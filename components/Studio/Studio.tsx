'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/state/store';
import { useKeyboardShortcuts } from '@/state/shortcuts';
import { getAudioEngine } from '@/lib/audio/AudioEngine';
import DockingLayout from '@/components/layout/DockingLayout';
import TopToolbar from '@/components/layout/TopToolbar';
import PianoRollModal from '@/components/panels/PianoRollModal';
import { useAutosave } from '@/lib/audio/useAutosave';

import { apiClient } from '@/lib/api/client';

export default function Studio({ isDemo = true, projectId }: { isDemo?: boolean; projectId?: string }) {
    const [isAudioInitialized, setIsAudioInitialized] = useState(false);
    const [showStartPrompt, setShowStartPrompt] = useState(true);
    const [initError, setInitError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [toneLoaded, setToneLoaded] = useState(false);
    const [isProjectLoading, setIsProjectLoading] = useState(false);

    const {
        loadDemoProject,
        loadProject,
        project,
        transportState,
        setPosition,
        enableAutoSave,
    } = useStore();

    // Initialize keyboard shortcuts
    useKeyboardShortcuts();

    // Enable autosave for non-demo projects
    useAutosave();

    useEffect(() => {
        // Enable autosave only for non-demo projects with a projectId
        if (!isDemo && projectId) {
            enableAutoSave(true);
        } else {
            enableAutoSave(false);
        }
    }, [isDemo, projectId, enableAutoSave]);

    // Pre-load Tone.js from CDN
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check if already loaded
        if (window.Tone) {
            console.log('Tone.js already available');
            setToneLoaded(true);
            return;
        }

        // Load from CDN
        console.log('Loading Tone.js from CDN...');
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/tone@14.9.17/build/Tone.js';
        script.async = true;

        script.onload = () => {
            console.log('Tone.js loaded from CDN');
            console.log('Available exports:', Object.keys(window.Tone).slice(0, 20));
            setToneLoaded(true);
        };

        script.onerror = (err) => {
            console.error('Failed to load Tone.js:', err);
            setInitError('Failed to load audio library');
        };

        document.head.appendChild(script);
    }, []);

    // Load project data if projectId is provided
    useEffect(() => {
        if (projectId) {
            const fetchProject = async () => {
                try {
                    setIsProjectLoading(true);
                    const data = await apiClient.getProject(projectId);
                    loadProject(data);
                } catch (error) {
                    console.error('Failed to load project:', error);
                    setInitError('Failed to load project data');
                } finally {
                    setIsProjectLoading(false);
                }
            };

            // Check if we need to load (don't reload if already loaded and ID matches)
            if (!project || project.id !== projectId) {
                fetchProject();
            }
        }
    }, [projectId, loadProject, project]);

    // Handle audio initialization
    const initializeAudio = useCallback(async () => {
        if (isInitializing) return;
        if (!toneLoaded) {
            setInitError('Audio library still loading, please wait...');
            return;
        }

        setIsInitializing(true);
        setInitError(null);

        try {
            console.log('Starting audio initialization...');
            const engine = getAudioEngine();
            await engine.initialize();
            console.log('Audio engine initialized');

            setIsAudioInitialized(true);
            setShowStartPrompt(false);

            // Only load demo project if in demo mode and no project is loaded
            if (isDemo && !project && !projectId) {
                loadDemoProject('demo-user-id');
                console.log('Demo project loaded');
            }
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            setInitError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setIsInitializing(false);
        }
    }, [loadDemoProject, isInitializing, toneLoaded, isDemo, project, projectId]);

    // Set up audio engine position tracking
    useEffect(() => {
        if (!isAudioInitialized || !project) return;

        const engine = getAudioEngine();

        // Load project into audio engine
        engine.loadProject(project);

        // Set up position callback
        engine.onPositionChange((position) => {
            setPosition(position);
        });
    }, [isAudioInitialized, project, setPosition]);

    // Sync transport state with audio engine
    useEffect(() => {
        if (!isAudioInitialized) return;

        const engine = getAudioEngine();

        if (transportState === 'playing') {
            engine.play();
        } else if (transportState === 'stopped') {
            engine.stop();
        } else if (transportState === 'paused') {
            engine.pause();
        }
    }, [transportState, isAudioInitialized]);

    // Global event handlers
    useEffect(() => {
        const handleSave = async () => {
            if (projectId) {
                try {
                    const currentProject = useStore.getState().project;
                    if (currentProject) {
                        await apiClient.saveProject(currentProject);
                        useStore.getState().markSaved();
                        // Optional: visual feedback
                        console.log('Project saved successfully');
                    }
                } catch (error) {
                    console.error('Failed to save project:', error);
                    alert('Failed to save project');
                }
            } else {
                // Demo mode save
                console.log('Saving project...');
                alert('Project saved! (Supabase integration coming soon)');
                useStore.getState().markSaved();
            }
        };

        const handleNewProject = () => {
            const hasUnsaved = useStore.getState().hasUnsavedChanges;
            if (hasUnsaved) {
                if (confirm('You have unsaved changes. Create new project?')) {
                    useStore.getState().createNewProject('Untitled Project', 'user-id');
                }
            } else {
                useStore.getState().createNewProject('Untitled Project', 'user-id');
            }
        };

        const handleZoomIn = () => {
            const state = useStore.getState();
            state.setPlaylistZoom(Math.min(4, state.playlistZoom * 1.2));
        };

        const handleZoomOut = () => {
            const state = useStore.getState();
            state.setPlaylistZoom(Math.max(0.1, state.playlistZoom / 1.2));
        };

        const handleZoomReset = () => {
            const state = useStore.getState();
            state.setPlaylistZoom(1);
            state.setPianoRollZoom(1);
        };

        window.addEventListener('pulse-studio-save', handleSave);
        window.addEventListener('pulse-studio-new-project', handleNewProject);
        window.addEventListener('pulse-studio-zoom-in', handleZoomIn);
        window.addEventListener('pulse-studio-zoom-out', handleZoomOut);
        window.addEventListener('pulse-studio-zoom-reset', handleZoomReset);

        return () => {
            window.removeEventListener('pulse-studio-save', handleSave);
            window.removeEventListener('pulse-studio-new-project', handleNewProject);
            window.removeEventListener('pulse-studio-zoom-in', handleZoomIn);
            window.removeEventListener('pulse-studio-zoom-out', handleZoomOut);
            window.removeEventListener('pulse-studio-zoom-reset', handleZoomReset);
        };
    }, []);

    if (showStartPrompt) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-ps-bg-900">
                <div className="text-center">
                    <div className="mb-8">
                        <svg
                            className="w-24 h-24 mx-auto mb-4"
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle cx="50" cy="50" r="45" stroke="#ff6b35" strokeWidth="3" />
                            <circle cx="50" cy="50" r="30" fill="#ff6b35" opacity="0.2" />
                            <circle cx="50" cy="50" r="15" fill="#ff6b35" />
                            <path
                                d="M35 50 L50 35 L65 50 L50 65 Z"
                                fill="#ff6b35"
                                opacity="0.6"
                            />
                        </svg>
                        <h1 className="text-3xl font-bold text-ps-text-primary mb-2">
                            Pulse Studio
                        </h1>
                        <p className="text-ps-text-secondary text-sm">
                            Professional DAW in your browser
                        </p>
                    </div>

                    <button
                        onClick={initializeAudio}
                        disabled={isInitializing || !toneLoaded}
                        className="btn btn-primary px-8 py-3 text-base font-semibold rounded-lg hover:shadow-glow-orange transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {!toneLoaded ? 'Loading Audio...' : isInitializing ? 'Initializing...' : 'Start Creating'}
                    </button>

                    {initError && (
                        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm max-w-md">
                            <p className="font-semibold">Error:</p>
                            <p className="text-xs mt-1">{initError}</p>
                        </div>
                    )}

                    <p className="mt-4 text-ps-text-muted text-xs">
                        Click to enable audio and load the demo project
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-ps-bg-900">
            <TopToolbar />
            <div className="flex-1 overflow-hidden">
                <DockingLayout />
            </div>
            {/* Piano Roll Modal - overlays main UI when editing patterns */}
            <PianoRollModal />
        </div>
    );
}
