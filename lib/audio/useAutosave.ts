'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';

export function useAutosave() {
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const {
        project,
        hasUnsavedChanges,
        autoSaveEnabled,
        autoSaveInterval,
        triggerAutoSave,
    } = useStore();

    useEffect(() => {
        // Clear existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Don't set up autosave if disabled or no project
        if (!autoSaveEnabled || !project) {
            return;
        }

        // Set up autosave interval
        timerRef.current = setInterval(() => {
            if (hasUnsavedChanges) {
                triggerAutoSave();
            }
        }, autoSaveInterval);

        // Cleanup on unmount
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [autoSaveEnabled, autoSaveInterval, project, hasUnsavedChanges, triggerAutoSave]);

    // Also save on visibility change (user switching tabs)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && hasUnsavedChanges && autoSaveEnabled) {
                triggerAutoSave();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [hasUnsavedChanges, autoSaveEnabled, triggerAutoSave]);

    // Save before unload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
                // Attempt to save
                triggerAutoSave();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges, triggerAutoSave]);
}
