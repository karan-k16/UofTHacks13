'use client';

import { useEffect, useCallback } from 'react';
import { useStore } from '@/state/store';
import PianoRoll from '@/components/panels/PianoRoll';

/**
 * Modal wrapper for Piano Roll that opens as an overlay
 * when editing patterns (like FL Studio's approach)
 */
export default function PianoRollModal() {
    const { pianoRollModal, closePianoRoll, project } = useStore();
    const { isOpen, patternId } = pianoRollModal;

    // Get the pattern being edited
    const pattern = project?.patterns.find((p) => p.id === patternId);

    // Handle Escape key to close modal
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                closePianoRoll();
            }
        },
        [isOpen, closePianoRoll]
    );

    // Handle backdrop click to close
    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                closePianoRoll();
            }
        },
        [closePianoRoll]
    );

    // Register global key listener
    useEffect(() => {
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
        return undefined;
    }, [isOpen, handleKeyDown]);

    // Don't render if not open
    if (!isOpen || !patternId) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={handleBackdropClick}
        >
            {/* Modal Container */}
            <div
                className="relative w-[95vw] h-[85vh] bg-ps-bg-800 rounded-lg border border-ps-bg-500 shadow-2xl overflow-hidden animate-slideUp flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-ps-bg-700 border-b border-ps-bg-600">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: pattern?.color || '#ff6b35' }}
                            />
                            <span className="text-sm font-medium text-ps-text-primary">
                                {pattern?.name || 'Piano Roll'}
                            </span>
                        </div>
                        <span className="text-xs text-ps-text-muted">
                            {pattern ? `${pattern.notes?.length || 0} notes` : 'No pattern selected'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Zoom Controls */}
                        <button
                            className="btn btn-ghost btn-icon text-xs"
                            onClick={() => useStore.getState().setPianoRollZoom(useStore.getState().pianoRollZoom - 0.2)}
                            title="Zoom Out"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                            </svg>
                        </button>
                        <button
                            className="btn btn-ghost btn-icon text-xs"
                            onClick={() => useStore.getState().setPianoRollZoom(useStore.getState().pianoRollZoom + 0.2)}
                            title="Zoom In"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                        </button>

                        {/* Close Button */}
                        <button
                            className="btn btn-ghost btn-icon hover:bg-red-500/20 hover:text-red-400"
                            onClick={closePianoRoll}
                            title="Close (Escape)"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Piano Roll Content */}
                <div className="flex-1 overflow-hidden">
                    <PianoRoll />
                </div>

                {/* Footer with keyboard shortcuts hint */}
                <div className="px-4 py-1.5 bg-ps-bg-700 border-t border-ps-bg-600 flex items-center justify-between text-xs text-ps-text-muted">
                    <div className="flex items-center gap-4">
                        <span>🖱️ Click to place notes</span>
                        <span>⌫ Delete to remove</span>
                        <span>Drag to move/resize</span>
                    </div>
                    <span>Press <kbd className="px-1 py-0.5 bg-ps-bg-600 rounded text-ps-text-secondary">Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    );
}
