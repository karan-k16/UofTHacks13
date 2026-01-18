/**
 * Batch Executor - Execute multiple AI commands as a single transaction
 * 
 * Handles:
 * - Consistent sample selection within a batch
 * - Auto-creation of tracks when needed
 * - Conflict resolution (offset overlapping clips)
 * - Grouped undo for entire batch
 * - Partial success reporting
 */

import { useStore } from '@/state/store';
import type { AICommand, CommandResult, BatchCommandResult, BackboardBatchResponse } from './types';
import { executeCommand } from './dawController';
import { parseAIResponse } from './commandParser';
import { getRandomFromCategory } from './sampleResolver';
import type { SampleLibrary, SampleMetadata } from '@/lib/audio/SampleLibrary';

// ============================================
// Types
// ============================================

interface ResolvedAction {
    action: AICommand;
    originalIndex: number;
}

interface ConflictInfo {
    trackIndex: number;
    startTick: number;
    durationTick: number;
}

// ============================================
// Sample Consistency
// ============================================

/**
 * Resolve sample references with consistency within a batch.
 * When the AI requests "kick", we pick ONE kick sample randomly
 * and use it for ALL kick references in this batch.
 */
export function resolveSamplesConsistently(
    actions: Array<{ action: string; parameters: Record<string, any> }>,
    library: SampleLibrary | null,
    providedChoices?: Record<string, string>
): {
    resolvedActions: Array<{ action: string; parameters: Record<string, any> }>;
    sampleChoices: Record<string, string>;
} {
    // Track which sample types we've already picked
    const sampleChoices: Record<string, string> = { ...providedChoices };

    if (!library) {
        return { resolvedActions: actions, sampleChoices };
    }

    const resolvedActions = actions.map(actionData => {
        // Only process sample-related actions
        if (actionData.action !== 'addAudioSample') {
            return actionData;
        }

        const params = { ...actionData.parameters };

        // If we already have a specific sampleId, use it
        if (params.sampleId) {
            return actionData;
        }

        // Get category and subcategory from the request
        const category = String(params.category || 'drums').toLowerCase();
        const subcategory = String(params.subcategory || params.type || '').toLowerCase();

        // Create a key for this sample type
        const sampleKey = subcategory ? `${category}/${subcategory}` : category;

        // Check if we already picked a sample for this type
        if (sampleChoices[sampleKey]) {
            params.sampleId = sampleChoices[sampleKey];
        } else {
            // Pick a random sample from this category/subcategory
            const sample = getRandomFromCategory(library, category, subcategory || undefined);
            if (sample) {
                params.sampleId = sample.id;
                sampleChoices[sampleKey] = sample.id;
            }
        }

        return { ...actionData, parameters: params };
    });

    return { resolvedActions, sampleChoices };
}

// ============================================
// Track Auto-Creation
// ============================================

/**
 * Ensure tracks exist for all actions that reference track indices.
 * Creates tracks as needed.
 */
export function ensureTracksExist(
    actions: Array<{ action: string; parameters: Record<string, any> }>
): void {
    const store = useStore.getState();
    const project = store.project;

    if (!project) return;

    // Find the maximum track index referenced
    let maxTrackIndex = -1;
    for (const action of actions) {
        const trackIndex = action.parameters.trackIndex;
        if (typeof trackIndex === 'number' && trackIndex > maxTrackIndex) {
            maxTrackIndex = trackIndex;
        }
    }

    // Create tracks up to the max needed
    const currentTrackCount = project.playlist.tracks.length;
    for (let i = currentTrackCount; i <= maxTrackIndex; i++) {
        store.addPlaylistTrack(`Track ${i + 1}`);
    }
}

// ============================================
// Conflict Resolution
// ============================================

/**
 * Resolve conflicts by offsetting overlapping clips.
 * If two clips would occupy the same position on the same track,
 * offset the later one to start after the first one ends.
 */
export function resolveClipConflicts(
    actions: Array<{ action: string; parameters: Record<string, any> }>
): Array<{ action: string; parameters: Record<string, any> }> {
    // Track occupied regions per track
    const trackOccupancy: Map<number, ConflictInfo[]> = new Map();

    // Default duration for samples (1 beat = 96 ticks)
    const DEFAULT_DURATION = 96;

    return actions.map(action => {
        // Only process actions that place something on the timeline
        if (action.action !== 'addAudioSample' && action.action !== 'addClip') {
            return action;
        }

        const params = { ...action.parameters };
        const trackIndex = typeof params.trackIndex === 'number' ? params.trackIndex : 0;
        let startTick = typeof params.startTick === 'number' ? params.startTick : 0;
        const durationTick = typeof params.durationTick === 'number' ? params.durationTick : DEFAULT_DURATION;

        // Get existing occupancy for this track
        const occupied = trackOccupancy.get(trackIndex) || [];

        // Check for conflicts and find next available slot
        for (const region of occupied) {
            const regionEnd = region.startTick + region.durationTick;
            const newEnd = startTick + durationTick;

            // Check if there's an overlap
            if (startTick < regionEnd && newEnd > region.startTick) {
                // Offset to after this region
                startTick = regionEnd;
            }
        }

        // Update occupancy
        occupied.push({ trackIndex, startTick, durationTick });
        trackOccupancy.set(trackIndex, occupied);

        // Return updated action
        return {
            ...action,
            parameters: { ...params, startTick }
        };
    });
}

// ============================================
// Batch Execution
// ============================================

/**
 * Execute a batch of AI actions as a single transaction.
 * 
 * @param batchResponse - The batch response from the AI model
 * @param library - The sample library for resolving samples
 * @returns BatchCommandResult with success counts and individual results
 */
export async function executeBatch(
    batchResponse: BackboardBatchResponse,
    library: SampleLibrary | null
): Promise<BatchCommandResult> {
    const results: CommandResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Generate a unique ID for this undo group
    const undoGroupId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Step 1: Resolve samples consistently
    const { resolvedActions, sampleChoices } = resolveSamplesConsistently(
        batchResponse.actions,
        library,
        batchResponse.sampleChoices
    );

    // Step 2: Ensure tracks exist
    ensureTracksExist(resolvedActions);

    // Step 3: Resolve conflicts (offset overlapping clips)
    const conflictResolved = resolveClipConflicts(resolvedActions);

    // Step 4: Parse and execute each action
    for (let i = 0; i < conflictResolved.length; i++) {
        const actionData = conflictResolved[i];

        // Skip undefined entries (shouldn't happen but TypeScript wants this)
        if (!actionData) {
            continue;
        }

        try {
            // Parse the action into a typed command
            const command = parseAIResponse({
                action: actionData.action,
                parameters: actionData.parameters,
            });

            // Execute the command
            const result = await executeCommand(command);
            results.push(result);

            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            failCount++;
            results.push({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error executing action',
                error: String(error),
            });
        }
    }

    // Build summary message
    const totalActions = batchResponse.actions.length;
    let message = '';

    if (failCount === 0) {
        message = `Successfully executed ${successCount} action${successCount !== 1 ? 's' : ''}`;
        if (batchResponse.reasoning) {
            message += `: ${batchResponse.reasoning}`;
        }
    } else if (successCount === 0) {
        message = `Failed to execute all ${totalActions} actions`;
    } else {
        message = `Executed ${successCount}/${totalActions} actions. ${failCount} failed.`;

        // Add details about failures
        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
            const failureMessages = failures.slice(0, 3).map(f => f.message).join('; ');
            message += ` Errors: ${failureMessages}`;
            if (failures.length > 3) {
                message += ` (+${failures.length - 3} more)`;
            }
        }
    }

    return {
        success: failCount === 0,
        message,
        totalActions,
        successCount,
        failCount,
        results,
        undoGroupId,
    };
}

/**
 * Execute a single action (backward compatibility wrapper)
 */
export async function executeSingleAction(
    response: { action: string; parameters: Record<string, any> },
    library: SampleLibrary | null
): Promise<BatchCommandResult> {
    return executeBatch(
        {
            actions: [response],
            confidence: 1.0,
        },
        library
    );
}
