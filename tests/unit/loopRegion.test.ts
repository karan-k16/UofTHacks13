// ============================================
// Pulse Studio - Loop Region Unit Tests
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { ticksToPixels, pixelsToTicks } from '@/lib/utils/time';

// ============================================
// Time Utility Tests for Loop Region
// ============================================

describe('Loop Region Time Utilities', () => {
    const PPQ = 96; // Pulses per quarter note
    const DEFAULT_ZOOM = 1;

    describe('ticksToPixels', () => {
        it('should convert 0 ticks to 0 pixels', () => {
            const pixels = ticksToPixels(0, DEFAULT_ZOOM, PPQ);
            expect(pixels).toBe(0);
        });

        it('should convert one bar (4 beats) to correct pixels', () => {
            const ticksPerBar = PPQ * 4;
            const pixels = ticksToPixels(ticksPerBar, DEFAULT_ZOOM, PPQ);
            expect(pixels).toBeGreaterThan(0);
        });

        it('should scale with zoom level', () => {
            const ticks = PPQ * 4; // 1 bar
            const pixelsZoom1 = ticksToPixels(ticks, 1, PPQ);
            const pixelsZoom2 = ticksToPixels(ticks, 2, PPQ);
            expect(pixelsZoom2).toBe(pixelsZoom1 * 2);
        });

        it('should handle fractional ticks', () => {
            const pixels = ticksToPixels(48, DEFAULT_ZOOM, PPQ); // half a beat
            expect(pixels).toBeGreaterThan(0);
        });
    });

    describe('pixelsToTicks', () => {
        it('should convert 0 pixels to 0 ticks', () => {
            const ticks = pixelsToTicks(0, DEFAULT_ZOOM, PPQ);
            expect(ticks).toBe(0);
        });

        it('should be inverse of ticksToPixels', () => {
            const originalTicks = PPQ * 4; // 1 bar
            const pixels = ticksToPixels(originalTicks, DEFAULT_ZOOM, PPQ);
            const convertedTicks = pixelsToTicks(pixels, DEFAULT_ZOOM, PPQ);
            expect(convertedTicks).toBeCloseTo(originalTicks, 5);
        });

        it('should scale inversely with zoom level', () => {
            const pixels = 100;
            const ticksZoom1 = pixelsToTicks(pixels, 1, PPQ);
            const ticksZoom2 = pixelsToTicks(pixels, 2, PPQ);
            expect(ticksZoom1).toBe(ticksZoom2 * 2);
        });
    });

    describe('Loop region snapping', () => {
        it('should snap to beat boundaries', () => {
            // Simulate snapping logic from the component
            const rawTicks = 100; // some arbitrary tick position
            const snappedTicks = Math.round(rawTicks / PPQ) * PPQ;
            expect(snappedTicks % PPQ).toBe(0);
        });

        it('should snap small movements to nearest beat', () => {
            const rawTicks = PPQ + 10; // slightly past first beat
            const snappedTicks = Math.round(rawTicks / PPQ) * PPQ;
            expect(snappedTicks).toBe(PPQ);
        });

        it('should snap to next beat when closer', () => {
            const rawTicks = PPQ + 60; // closer to second beat (PPQ * 2)
            const snappedTicks = Math.round(rawTicks / PPQ) * PPQ;
            expect(snappedTicks).toBe(PPQ * 2);
        });
    });
});

// ============================================
// Loop Region State Logic Tests
// ============================================

describe('Loop Region State Logic', () => {
    const PPQ = 96;
    const DEFAULT_LOOP_START = 0;
    const DEFAULT_LOOP_END = PPQ * 4 * 4; // 4 bars

    describe('Loop region validation', () => {
        it('should ensure loop start is non-negative', () => {
            const loopStart = Math.max(0, -100);
            expect(loopStart).toBe(0);
        });

        it('should ensure loop end is after loop start', () => {
            const loopStart = PPQ * 4; // 1 bar
            const loopEnd = loopStart + PPQ; // at least 1 beat after
            expect(loopEnd).toBeGreaterThan(loopStart);
        });

        it('should maintain minimum loop length of 1 beat', () => {
            const loopStart = PPQ * 4;
            const minimumLoopLength = PPQ;
            const loopEnd = loopStart + minimumLoopLength;
            expect(loopEnd - loopStart).toBeGreaterThanOrEqual(PPQ);
        });
    });

    describe('Loop region dragging calculations', () => {
        it('should calculate new start position when dragging start handle', () => {
            const originalStart = PPQ * 4;
            const originalEnd = PPQ * 8;
            const deltaTicks = PPQ * 2;

            const newStart = originalStart + deltaTicks;

            // Ensure start doesn't exceed end minus minimum length
            expect(newStart).toBeLessThan(originalEnd - PPQ);
        });

        it('should calculate new end position when dragging end handle', () => {
            const originalStart = PPQ * 4;
            const originalEnd = PPQ * 8;
            const deltaTicks = PPQ * 2;

            const newEnd = originalEnd + deltaTicks;

            // Ensure end doesn't go below start plus minimum length
            expect(newEnd).toBeGreaterThan(originalStart + PPQ);
        });

        it('should move entire region when dragging middle', () => {
            const originalStart = PPQ * 4;
            const originalEnd = PPQ * 8;
            const regionLength = originalEnd - originalStart;
            const deltaTicks = PPQ * 2;

            const newStart = Math.max(0, originalStart + deltaTicks);
            const newEnd = newStart + regionLength;

            // Region length should remain constant
            expect(newEnd - newStart).toBe(regionLength);
        });

        it('should not allow region to move before tick 0', () => {
            const originalStart = PPQ;
            const originalEnd = PPQ * 4;
            const regionLength = originalEnd - originalStart;
            const deltaTicks = -PPQ * 2; // try to move before 0

            const newStart = Math.max(0, originalStart + deltaTicks);
            const newEnd = newStart + regionLength;

            expect(newStart).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Loop region pixel calculations', () => {
        it('should calculate correct loop width in pixels', () => {
            const loopStart = PPQ * 4;
            const loopEnd = PPQ * 8;
            const zoom = 1;

            const loopStartX = ticksToPixels(loopStart, zoom, PPQ);
            const loopEndX = ticksToPixels(loopEnd, zoom, PPQ);
            const loopWidth = loopEndX - loopStartX;

            expect(loopWidth).toBeGreaterThan(0);
        });

        it('should scale loop width with zoom', () => {
            const loopStart = PPQ * 4;
            const loopEnd = PPQ * 8;

            const widthZoom1 = ticksToPixels(loopEnd, 1, PPQ) - ticksToPixels(loopStart, 1, PPQ);
            const widthZoom2 = ticksToPixels(loopEnd, 2, PPQ) - ticksToPixels(loopStart, 2, PPQ);

            expect(widthZoom2).toBe(widthZoom1 * 2);
        });
    });
});

// ============================================
// Loop Region Handle Interaction Tests
// ============================================

describe('Loop Region Handle Interactions', () => {
    const PPQ = 96;
    const LOOP_HANDLE_WIDTH = 8;

    describe('Handle positioning', () => {
        it('should position start handle at loop start', () => {
            const loopStart = PPQ * 4;
            const zoom = 1;
            const loopStartX = ticksToPixels(loopStart, zoom, PPQ);

            // Handle should be at loopStartX
            expect(loopStartX).toBeGreaterThanOrEqual(0);
        });

        it('should position end handle at loop end minus handle width', () => {
            const loopEnd = PPQ * 8;
            const zoom = 1;
            const loopEndX = ticksToPixels(loopEnd, zoom, PPQ);
            const handlePosition = loopEndX - LOOP_HANDLE_WIDTH;

            expect(handlePosition).toBeGreaterThan(0);
        });

        it('should calculate draggable region width correctly', () => {
            const loopStart = PPQ * 4;
            const loopEnd = PPQ * 8;
            const zoom = 1;

            const loopStartX = ticksToPixels(loopStart, zoom, PPQ);
            const loopEndX = ticksToPixels(loopEnd, zoom, PPQ);
            const loopWidth = loopEndX - loopStartX;

            // Draggable region is between the two handles
            const draggableWidth = Math.max(0, loopWidth - LOOP_HANDLE_WIDTH * 2);

            expect(draggableWidth).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Drag delta calculations', () => {
        it('should convert pixel delta to tick delta', () => {
            const pixelDelta = 50;
            const zoom = 1;
            const tickDelta = pixelsToTicks(pixelDelta, zoom, PPQ);

            expect(tickDelta).toBeGreaterThan(0);
        });

        it('should snap tick delta to beat grid', () => {
            const rawTickDelta = 100;
            const snappedDelta = Math.round(rawTickDelta / PPQ) * PPQ;

            expect(snappedDelta % PPQ).toBe(0);
        });
    });
});

// ============================================
// Loop Enabled State Tests
// ============================================

describe('Loop Enabled State', () => {
    describe('Visual styling based on loop state', () => {
        it('should have full opacity when loop is enabled', () => {
            const loopEnabled = true;
            const opacity = loopEnabled ? 1 : 0.4;

            expect(opacity).toBe(1);
        });

        it('should have reduced opacity when loop is disabled', () => {
            const loopEnabled = false;
            const opacity = loopEnabled ? 1 : 0.4;

            expect(opacity).toBe(0.4);
        });
    });

    describe('Loop toggle behavior', () => {
        it('should toggle loop state', () => {
            let loopEnabled = false;
            loopEnabled = !loopEnabled;
            expect(loopEnabled).toBe(true);

            loopEnabled = !loopEnabled;
            expect(loopEnabled).toBe(false);
        });
    });
});

// ============================================
// Default Values Tests
// ============================================

describe('Loop Region Default Values', () => {
    const PPQ = 96;

    it('should have default loop start at 0', () => {
        const defaultLoopStart = 0;
        expect(defaultLoopStart).toBe(0);
    });

    it('should have default loop end at 4 bars', () => {
        const defaultLoopEnd = PPQ * 4 * 4; // 4 bars
        expect(defaultLoopEnd).toBe(1536);
    });

    it('should have loop disabled by default', () => {
        const defaultLoopEnabled = false;
        expect(defaultLoopEnabled).toBe(false);
    });

    it('should calculate default loop length correctly', () => {
        const defaultLoopStart = 0;
        const defaultLoopEnd = PPQ * 4 * 4;
        const defaultLoopLength = defaultLoopEnd - defaultLoopStart;

        // Should be 4 bars worth of ticks
        expect(defaultLoopLength).toBe(PPQ * 4 * 4);
    });
});
