/**
 * useAISuggestion Hook
 * 
 * Manages AI-powered clip suggestions for the Playlist timeline.
 * When triggered, analyzes recent clips and suggests what should come next,
 * displaying a ghost clip preview that users can click to add.
 */

import { useState, useCallback, useRef } from 'react';
import { useStore } from '@/state/store';
import { buildSuggestionPrompt } from '@/lib/ai/contextBuilder';
import { loadSampleLibrary } from '@/lib/audio/SampleLibrary';
import { executeCommand } from '@/lib/ai/dawController';
import type { AICommand, BackboardResponse, CommandResult } from '@/lib/ai/types';
import type { PatternClip } from '@/domain/types';

// ============================================
// Types
// ============================================

export interface GhostClip {
    trackId: string;
    trackIndex: number;
    startTick: number;
    durationTick: number;
    patternId?: string;
    patternName?: string;
    suggestedPatternDescription?: string;
    type: 'pattern' | 'audio';
    color: string;
    reasoning?: string;
    /** Batch of commands to execute when accepting (for creating new patterns with notes) */
    batchCommands?: Array<{ action: string; parameters: Record<string, unknown> }>;
}

export interface SuggestionState {
    isAnalyzing: boolean;
    analyzingTrackIndex: number | null;
    ghostClip: GhostClip | null;
    suggestion: AICommand | null;
    error: string | null;
}

export interface UseAISuggestionReturn {
    isAnalyzing: boolean;
    analyzingTrackIndex: number | null;
    ghostClip: GhostClip | null;
    suggestion: AICommand | null;
    error: string | null;
    triggerSuggestion: (trackId: string, trackIndex: number, afterTick: number) => Promise<void>;
    acceptSuggestion: () => Promise<CommandResult>;
    dismissSuggestion: () => void;
}

// ============================================
// Default ghost clip color
// ============================================

const GHOST_CLIP_COLOR = '#4d96ff'; // Blue to match the dashed border

// ============================================
// Hook Implementation
// ============================================

export function useAISuggestion(): UseAISuggestionReturn {
    const [state, setState] = useState<SuggestionState>({
        isAnalyzing: false,
        analyzingTrackIndex: null,
        ghostClip: null,
        suggestion: null,
        error: null,
    });

    // Abort controller for cancelling in-flight requests
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Trigger AI suggestion for a specific track position
     */
    const triggerSuggestion = useCallback(async (
        trackId: string,
        trackIndex: number,
        afterTick: number
    ) => {
        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        // Set analyzing state
        console.log('[useAISuggestion] Starting analysis for track', trackIndex, 'at tick', afterTick);
        setState({
            isAnalyzing: true,
            analyzingTrackIndex: trackIndex,
            ghostClip: null,
            suggestion: null,
            error: null,
        });

        try {
            // Get current project state
            const project = useStore.getState().project;
            if (!project) {
                throw new Error('No project loaded');
            }

            // Load sample library for context
            const sampleLibrary = await loadSampleLibrary();

            // Build the suggestion prompt
            const suggestionPrompt = buildSuggestionPrompt(
                project,
                sampleLibrary,
                trackId,
                trackIndex,
                afterTick
            );

            // Call the existing /api/chat endpoint
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: 'Suggest what clip should come next on this track.',
                    model: 'gemini',
                    conversationHistory: [],
                    systemPrompt: suggestionPrompt,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API error: ${response.status}`);
            }

            const apiResponse = await response.json();
            console.log('[useAISuggestion] API response:', JSON.stringify(apiResponse, null, 2));

            if (!apiResponse.success) {
                throw new Error(apiResponse.error || 'Unknown API error');
            }

            // Parse the response
            if (apiResponse.data?.commandResult) {
                const backboardResponse = apiResponse.data.commandResult as BackboardResponse;
                console.log('[useAISuggestion] Backboard response:', backboardResponse);

                // Extract the actual action - handle batch responses
                let action = backboardResponse.action;
                let parameters = backboardResponse.parameters || {};
                let batchCommands: Array<{ action: string; parameters: Record<string, unknown> }> | undefined;

                // If it's a batch, check if it's a multi-step pattern creation
                if (action === '__batch__' && parameters.actions && parameters.actions.length > 0) {
                    const actions = parameters.actions as Array<{ action: string; parameters: Record<string, unknown> }>;

                    // Check if this is a pattern creation batch (addPattern + addNoteSequence + addClip)
                    const hasPatternCreation = actions.some(a => a.action === 'addPattern');
                    const hasNotes = actions.some(a => a.action === 'addNote' || a.action === 'addNoteSequence');

                    if (hasPatternCreation && hasNotes) {
                        // Store all commands for batch execution
                        batchCommands = actions;
                        // Use the first action for display purposes
                        const patternAction = actions.find(a => a.action === 'addPattern');
                        action = 'createAndAddPattern';
                        parameters = patternAction?.parameters || {};
                    } else {
                        // Simple batch - just extract first action
                        const firstAction = actions[0];
                        if (firstAction) {
                            action = firstAction.action;
                            parameters = firstAction.parameters || {};
                        }
                    }
                }

                // Skip clarification requests
                if (action === 'clarificationNeeded') {
                    throw new Error('AI needs more context. Try adding some clips first.');
                }

                // Calculate snap position (snap to bar)
                const PPQ = project.ppq || 96;
                const ticksPerBar = PPQ * 4; // Assuming 4/4 time
                const snappedStartTick = Math.ceil(afterTick / ticksPerBar) * ticksPerBar;

                // Extract duration from parameters or use default (1 bar)
                let durationTick = ticksPerBar; // Default 1 bar
                if ('durationTick' in parameters) {
                    durationTick = Number(parameters.durationTick);
                } else if ('durationBars' in parameters) {
                    durationTick = Number(parameters.durationBars) * ticksPerBar;
                } else if ('lengthInSteps' in parameters) {
                    const steps = Number(parameters.lengthInSteps);
                    durationTick = (steps / 4) * PPQ;
                }

                // Use startTick from response if provided, otherwise use snapped position
                const startTick = parameters.startTick ? Number(parameters.startTick) : snappedStartTick;

                // Build ghost clip
                const ghostClip: GhostClip = {
                    trackId,
                    trackIndex: parameters.trackIndex !== undefined ? Number(parameters.trackIndex) : trackIndex,
                    startTick,
                    durationTick,
                    patternId: parameters.patternId as string | undefined,
                    patternName: parameters.name as string ||
                        parameters.patternName as string ||
                        backboardResponse.reasoning ||
                        'Suggested Clip',
                    suggestedPatternDescription: parameters.description as string,
                    type: action === 'addAudioSample' ? 'audio' : 'pattern',
                    color: GHOST_CLIP_COLOR,
                    reasoning: backboardResponse.reasoning,
                    batchCommands, // Store batch commands for execution
                };

                // Build the command to execute
                const command: AICommand = {
                    action: action === 'createAndAddPattern' ? 'addClip' : action,
                    ...parameters,
                    trackIndex: ghostClip.trackIndex,
                    startTick: ghostClip.startTick,
                    durationTick: ghostClip.durationTick,
                } as AICommand;

                console.log('[useAISuggestion] Ghost clip created:', ghostClip);
                console.log('[useAISuggestion] AI command:', command);
                console.log('[useAISuggestion] Batch commands:', batchCommands);
                setState({
                    isAnalyzing: false,
                    analyzingTrackIndex: null,
                    ghostClip,
                    suggestion: command,
                    error: null,
                });
            } else {
                throw new Error('No suggestion received from AI');
            }
        } catch (error) {
            // Ignore abort errors
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }

            console.error('AI Suggestion error:', error);

            // Show error state - no fallback, let user retry
            setState({
                isAnalyzing: false,
                analyzingTrackIndex: null,
                ghostClip: null,
                suggestion: null,
                error: error instanceof Error ? error.message : 'Failed to get suggestion',
            });
        }
    }, []);

    /**
     * Accept the current suggestion and execute the command
     */
    const acceptSuggestion = useCallback(async (): Promise<CommandResult> => {
        const { suggestion, ghostClip } = state;

        if (!suggestion || !ghostClip) {
            return {
                success: false,
                message: 'No suggestion to accept',
            };
        }

        try {
            console.log('[useAISuggestion] Accepting suggestion:', { suggestion, ghostClip });

            // Get store actions directly
            const store = useStore.getState();
            const project = store.project;

            if (!project) {
                throw new Error('No project loaded');
            }

            // Check if we have batch commands (for creating new patterns with notes)
            if (ghostClip.batchCommands && ghostClip.batchCommands.length > 0) {
                console.log('[useAISuggestion] Executing batch commands:', ghostClip.batchCommands);

                let createdPatternId: string | null = null;

                // Execute each command in sequence
                for (const cmd of ghostClip.batchCommands) {
                    // Flatten the command - executeCommand expects properties at top level, not nested in parameters
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let commandToExecute: Record<string, any> = {
                        action: cmd.action,
                        ...(cmd.parameters || {}),
                    };

                    // For addNote/addNoteSequence, we need to use the newly created pattern's ID
                    if ((cmd.action === 'addNote' || cmd.action === 'addNoteSequence') && createdPatternId) {
                        commandToExecute = {
                            ...commandToExecute,
                            patternId: createdPatternId,
                        };
                    }

                    // For addClip, use the newly created pattern's ID
                    if (cmd.action === 'addClip' && createdPatternId) {
                        commandToExecute = {
                            ...commandToExecute,
                            patternId: createdPatternId,
                            trackIndex: ghostClip.trackIndex,
                            startTick: ghostClip.startTick,
                            durationTick: ghostClip.durationTick,
                        };
                    }

                    console.log('[useAISuggestion] Executing command:', commandToExecute);
                    const result = await executeCommand(commandToExecute as AICommand);

                    if (!result.success) {
                        console.error('[useAISuggestion] Command failed:', result.message);
                        // Continue anyway for resilience
                    } else {
                        console.log('[useAISuggestion] Command succeeded:', result.message);
                    }

                    // If this was addPattern, capture the new pattern's ID
                    if (cmd.action === 'addPattern') {
                        const updatedProject = useStore.getState().project;
                        const newPattern = updatedProject?.patterns[updatedProject.patterns.length - 1];
                        if (newPattern) {
                            createdPatternId = newPattern.id;
                            console.log('[useAISuggestion] Created pattern with ID:', createdPatternId);
                        }
                    }
                }

                // Clear state on success
                setState({
                    isAnalyzing: false,
                    analyzingTrackIndex: null,
                    ghostClip: null,
                    suggestion: null,
                    error: null,
                });

                return {
                    success: true,
                    message: `Created new pattern "${ghostClip.patternName}" with notes and added to track ${ghostClip.trackIndex + 1}`,
                };
            }

            // Handle addClip action - add a pattern clip to the playlist
            if (ghostClip.patternId) {
                // Find the pattern
                const pattern = project.patterns.find(p => p.id === ghostClip.patternId);
                if (!pattern) {
                    throw new Error(`Pattern not found: ${ghostClip.patternId}`);
                }

                // Add the clip using store action - cast to PatternClip type
                const clipData: Omit<PatternClip, 'id'> = {
                    type: 'pattern',
                    patternId: ghostClip.patternId,
                    trackIndex: ghostClip.trackIndex,
                    startTick: ghostClip.startTick,
                    durationTick: ghostClip.durationTick,
                    offset: 0,
                    color: pattern.color || ghostClip.color,
                    mute: false,
                };
                store.addClip(clipData);

                console.log('[useAISuggestion] Clip added successfully');

                // Clear state on success
                setState({
                    isAnalyzing: false,
                    analyzingTrackIndex: null,
                    ghostClip: null,
                    suggestion: null,
                    error: null,
                });

                return {
                    success: true,
                    message: `Added "${pattern.name}" to track ${ghostClip.trackIndex + 1}`,
                };
            } else {
                // No pattern ID and no batch commands - create empty pattern
                const newPatternName = ghostClip.patternName || 'AI Pattern';

                // Get the count before adding
                const patternCountBefore = project.patterns.length;

                // Create pattern using store action
                store.addPattern(newPatternName);

                // Get the updated project to find the new pattern
                const updatedProject = useStore.getState().project;
                const newPattern = updatedProject?.patterns[updatedProject.patterns.length - 1];

                if (updatedProject && newPattern && updatedProject.patterns.length > patternCountBefore) {
                    const clipData: Omit<PatternClip, 'id'> = {
                        type: 'pattern',
                        patternId: newPattern.id,
                        trackIndex: ghostClip.trackIndex,
                        startTick: ghostClip.startTick,
                        durationTick: ghostClip.durationTick,
                        offset: 0,
                        color: newPattern.color || ghostClip.color,
                        mute: false,
                    };
                    store.addClip(clipData);

                    setState({
                        isAnalyzing: false,
                        analyzingTrackIndex: null,
                        ghostClip: null,
                        suggestion: null,
                        error: null,
                    });

                    return {
                        success: true,
                        message: `Created and added "${newPatternName}" to track ${ghostClip.trackIndex + 1}`,
                    };
                }

                throw new Error('Failed to create new pattern');
            }
        } catch (error) {
            console.error('Error accepting suggestion:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to add clip',
            };
        }
    }, [state]);

    /**
     * Dismiss the current suggestion
     */
    const dismissSuggestion = useCallback(() => {
        // Cancel any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setState({
            isAnalyzing: false,
            analyzingTrackIndex: null,
            ghostClip: null,
            suggestion: null,
            error: null,
        });
    }, []);

    return {
        isAnalyzing: state.isAnalyzing,
        analyzingTrackIndex: state.analyzingTrackIndex,
        ghostClip: state.ghostClip,
        suggestion: state.suggestion,
        error: state.error,
        triggerSuggestion,
        acceptSuggestion,
        dismissSuggestion,
    };
}

export default useAISuggestion;
