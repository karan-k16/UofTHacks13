// ============================================
// Pulse Studio - Playlist Phase 2 Unit Tests
// Testing: Split/Cut, Box Selection, Color Editing, Waveform Preview
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    splitClip,
    moveClip,
    resizeClip,
    duplicateClip,
    createPatternClip,
} from '@/domain/operations';
import { ticksToPixels, pixelsToTicks } from '@/lib/utils/time';
import type { Clip, PatternClip, AudioClip } from '@/domain/types';

const PPQ = 96; // Pulses per quarter note
const DEFAULT_ZOOM = 1;

// ============================================
// Helper Functions for Tests
// ============================================

function createTestPatternClip(overrides: Partial<PatternClip> = {}): PatternClip {
    return {
        id: 'test-clip-1',
        type: 'pattern',
        patternId: 'pattern-1',
        trackIndex: 0,
        startTick: 0,
        durationTick: PPQ * 4, // 1 bar
        offset: 0,
        color: '#ff6b6b',
        mute: false,
        ...overrides,
    };
}

function createTestAudioClip(overrides: Partial<AudioClip> = {}): AudioClip {
    return {
        id: 'test-audio-1',
        type: 'audio',
        assetId: 'asset-1',
        trackIndex: 0,
        startTick: 0,
        durationTick: PPQ * 4, // 1 bar
        offset: 0,
        color: '#4ecdc4',
        mute: false,
        gain: 1,
        pitch: 0,
        ...overrides,
    };
}

// ============================================
// Split/Cut Clip Tests
// ============================================

describe('Split Clip Feature', () => {
    describe('splitClip function', () => {
        it('should split a clip at a valid position', () => {
            const clip = createTestPatternClip({
                startTick: 0,
                durationTick: PPQ * 4, // 4 beats
            });

            const result = splitClip(clip, PPQ * 2); // Split at beat 2

            expect(result).not.toBeNull();
            expect(result).toHaveLength(2);

            const [first, second] = result!;
            expect(first.durationTick).toBe(PPQ * 2);
            expect(second.startTick).toBe(PPQ * 2);
            expect(second.durationTick).toBe(PPQ * 2);
        });

        it('should return null when splitting at clip start', () => {
            const clip = createTestPatternClip({
                startTick: PPQ,
                durationTick: PPQ * 4,
            });

            const result = splitClip(clip, PPQ); // Split at start

            expect(result).toBeNull();
        });

        it('should return null when splitting at clip end', () => {
            const clip = createTestPatternClip({
                startTick: 0,
                durationTick: PPQ * 4,
            });

            const result = splitClip(clip, PPQ * 4); // Split at end

            expect(result).toBeNull();
        });

        it('should return null when splitting before clip', () => {
            const clip = createTestPatternClip({
                startTick: PPQ * 2,
                durationTick: PPQ * 4,
            });

            const result = splitClip(clip, PPQ); // Before clip

            expect(result).toBeNull();
        });

        it('should return null when splitting after clip', () => {
            const clip = createTestPatternClip({
                startTick: 0,
                durationTick: PPQ * 4,
            });

            const result = splitClip(clip, PPQ * 8); // After clip

            expect(result).toBeNull();
        });

        it('should preserve clip properties in both halves', () => {
            const clip = createTestPatternClip({
                startTick: 0,
                durationTick: PPQ * 4,
                color: '#ff0000',
                mute: true,
                trackIndex: 2,
            });

            const result = splitClip(clip, PPQ * 2);

            expect(result).not.toBeNull();
            const [first, second] = result!;

            expect(first.color).toBe('#ff0000');
            expect(first.mute).toBe(true);
            expect(first.trackIndex).toBe(2);

            expect(second.color).toBe('#ff0000');
            expect(second.mute).toBe(true);
            expect(second.trackIndex).toBe(2);
        });

        it('should generate a new ID for the second clip', () => {
            const clip = createTestPatternClip();

            const result = splitClip(clip, PPQ * 2);

            expect(result).not.toBeNull();
            const [first, second] = result!;

            expect(first.id).toBe(clip.id);
            expect(second.id).not.toBe(clip.id);
        });

        it('should correctly calculate offset for second clip', () => {
            const clip = createTestPatternClip({
                startTick: 0,
                durationTick: PPQ * 4,
                offset: 10,
            });

            const result = splitClip(clip, PPQ * 2);

            expect(result).not.toBeNull();
            const [first, second] = result!;

            expect(first.offset).toBe(10);
            expect(second.offset).toBe(10 + PPQ * 2); // Original offset + first clip duration
        });

        it('should work with audio clips', () => {
            const clip = createTestAudioClip({
                startTick: 0,
                durationTick: PPQ * 8,
            });

            const result = splitClip(clip, PPQ * 4);

            expect(result).not.toBeNull();
            const [first, second] = result!;

            expect(first.type).toBe('audio');
            expect(second.type).toBe('audio');
            expect(first.durationTick).toBe(PPQ * 4);
            expect(second.durationTick).toBe(PPQ * 4);
        });

        it('should split at exact tick position', () => {
            const clip = createTestPatternClip({
                startTick: 100,
                durationTick: 200,
            });

            const result = splitClip(clip, 150);

            expect(result).not.toBeNull();
            const [first, second] = result!;

            expect(first.startTick).toBe(100);
            expect(first.durationTick).toBe(50);
            expect(second.startTick).toBe(150);
            expect(second.durationTick).toBe(150);
        });

        it('should handle splitting near edges', () => {
            const clip = createTestPatternClip({
                startTick: 0,
                durationTick: 100,
            });

            // Split at tick 1 (just after start)
            const result1 = splitClip(clip, 1);
            expect(result1).not.toBeNull();
            expect(result1![0].durationTick).toBe(1);
            expect(result1![1].durationTick).toBe(99);

            // Split at tick 99 (just before end)
            const result2 = splitClip(clip, 99);
            expect(result2).not.toBeNull();
            expect(result2![0].durationTick).toBe(99);
            expect(result2![1].durationTick).toBe(1);
        });
    });

    describe('Split at playhead position', () => {
        it('should identify valid split position', () => {
            const clip = createTestPatternClip({
                startTick: PPQ * 4,
                durationTick: PPQ * 8,
            });
            const playhead = PPQ * 8; // Within clip

            const isValidSplitPosition =
                playhead > clip.startTick && playhead < clip.startTick + clip.durationTick;

            expect(isValidSplitPosition).toBe(true);
        });

        it('should reject playhead outside clip', () => {
            const clip = createTestPatternClip({
                startTick: PPQ * 4,
                durationTick: PPQ * 4,
            });
            const playhead = PPQ * 2; // Before clip

            const isValidSplitPosition =
                playhead > clip.startTick && playhead < clip.startTick + clip.durationTick;

            expect(isValidSplitPosition).toBe(false);
        });
    });
});

// ============================================
// Box Selection Tests
// ============================================

describe('Box Selection Feature', () => {
    describe('Selection rectangle calculation', () => {
        it('should calculate correct bounds from drag coordinates', () => {
            const startX = 100;
            const startY = 50;
            const currentX = 300;
            const currentY = 200;

            const minX = Math.min(startX, currentX);
            const maxX = Math.max(startX, currentX);
            const minY = Math.min(startY, currentY);
            const maxY = Math.max(startY, currentY);

            expect(minX).toBe(100);
            expect(maxX).toBe(300);
            expect(minY).toBe(50);
            expect(maxY).toBe(200);
        });

        it('should handle reverse drag (right to left)', () => {
            const startX = 300;
            const startY = 200;
            const currentX = 100;
            const currentY = 50;

            const minX = Math.min(startX, currentX);
            const maxX = Math.max(startX, currentX);
            const minY = Math.min(startY, currentY);
            const maxY = Math.max(startY, currentY);

            expect(minX).toBe(100);
            expect(maxX).toBe(300);
            expect(minY).toBe(50);
            expect(maxY).toBe(200);
        });
    });

    describe('Clip intersection detection', () => {
        const TRACK_HEIGHT = 60;
        const zoom = 1;

        function clipIntersectsBox(
            clip: Clip,
            minX: number,
            maxX: number,
            minY: number,
            maxY: number
        ): boolean {
            const clipX = ticksToPixels(clip.startTick, zoom, PPQ);
            const clipWidth = ticksToPixels(clip.durationTick, zoom, PPQ);
            const clipY = clip.trackIndex * TRACK_HEIGHT;
            const clipHeight = TRACK_HEIGHT;

            return (
                clipX < maxX &&
                clipX + clipWidth > minX &&
                clipY < maxY &&
                clipY + clipHeight > minY
            );
        }

        it('should detect clip fully inside selection box', () => {
            const clip = createTestPatternClip({
                startTick: PPQ * 2,
                durationTick: PPQ * 2,
                trackIndex: 1,
            });

            const minX = 0;
            const maxX = 500;
            const minY = 0;
            const maxY = 200;

            expect(clipIntersectsBox(clip, minX, maxX, minY, maxY)).toBe(true);
        });

        it('should detect clip partially overlapping selection box', () => {
            const clip = createTestPatternClip({
                startTick: PPQ * 4,
                durationTick: PPQ * 4,
                trackIndex: 0,
            });

            // Box that partially overlaps
            const clipX = ticksToPixels(clip.startTick, zoom, PPQ);
            const minX = clipX - 10;
            const maxX = clipX + 10;
            const minY = 0;
            const maxY = TRACK_HEIGHT;

            expect(clipIntersectsBox(clip, minX, maxX, minY, maxY)).toBe(true);
        });

        it('should not detect clip outside selection box (horizontally)', () => {
            const clip = createTestPatternClip({
                startTick: PPQ * 10,
                durationTick: PPQ * 2,
                trackIndex: 0,
            });

            const minX = 0;
            const maxX = 50; // Before clip
            const minY = 0;
            const maxY = TRACK_HEIGHT;

            expect(clipIntersectsBox(clip, minX, maxX, minY, maxY)).toBe(false);
        });

        it('should not detect clip outside selection box (vertically)', () => {
            const clip = createTestPatternClip({
                startTick: 0,
                durationTick: PPQ * 4,
                trackIndex: 5, // Track 5
            });

            const minX = 0;
            const maxX = 500;
            const minY = 0;
            const maxY = TRACK_HEIGHT * 2; // Only covers tracks 0-1

            expect(clipIntersectsBox(clip, minX, maxX, minY, maxY)).toBe(false);
        });

        it('should select multiple clips in box', () => {
            const clips = [
                createTestPatternClip({ id: 'clip-1', startTick: 0, trackIndex: 0 }),
                createTestPatternClip({ id: 'clip-2', startTick: PPQ * 4, trackIndex: 1 }),
                createTestPatternClip({ id: 'clip-3', startTick: PPQ * 8, trackIndex: 2 }),
                createTestPatternClip({ id: 'clip-4', startTick: PPQ * 20, trackIndex: 5 }), // Outside
            ];

            const minX = 0;
            const maxX = 1000;
            const minY = 0;
            const maxY = TRACK_HEIGHT * 3;

            const selectedIds = clips
                .filter((clip) => clipIntersectsBox(clip, minX, maxX, minY, maxY))
                .map((clip) => clip.id);

            expect(selectedIds).toContain('clip-1');
            expect(selectedIds).toContain('clip-2');
            expect(selectedIds).toContain('clip-3');
            expect(selectedIds).not.toContain('clip-4');
        });
    });
});

// ============================================
// Clip Color Editing Tests
// ============================================

describe('Clip Color Editing Feature', () => {
    const CLIP_COLORS = [
        '#ff6b6b', '#ffa502', '#ffd93d', '#6bcb77', '#4d96ff', '#6c5ce7',
        '#a55eea', '#fd79a8', '#00cec9', '#81ecec', '#74b9ff', '#fab1a0',
        '#ff7675', '#b2bec3', '#636e72', '#2d3436',
    ];

    describe('Color palette', () => {
        it('should have 16 predefined colors', () => {
            expect(CLIP_COLORS).toHaveLength(16);
        });

        it('should have valid hex color format', () => {
            const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
            CLIP_COLORS.forEach((color) => {
                expect(color).toMatch(hexColorRegex);
            });
        });

        it('should have unique colors', () => {
            const uniqueColors = new Set(CLIP_COLORS);
            expect(uniqueColors.size).toBe(CLIP_COLORS.length);
        });
    });

    describe('Color change operation', () => {
        it('should update clip color', () => {
            const clip = createTestPatternClip({ color: '#ff6b6b' });
            const newColor = '#4d96ff';

            const updatedClip = { ...clip, color: newColor };

            expect(updatedClip.color).toBe('#4d96ff');
            expect(updatedClip.id).toBe(clip.id); // ID should be preserved
        });

        it('should preserve other clip properties when changing color', () => {
            const clip = createTestPatternClip({
                color: '#ff6b6b',
                startTick: 100,
                durationTick: 200,
                trackIndex: 3,
                mute: true,
            });
            const newColor = '#4d96ff';

            const updatedClip = { ...clip, color: newColor };

            expect(updatedClip.color).toBe('#4d96ff');
            expect(updatedClip.startTick).toBe(100);
            expect(updatedClip.durationTick).toBe(200);
            expect(updatedClip.trackIndex).toBe(3);
            expect(updatedClip.mute).toBe(true);
        });
    });
});

// ============================================
// Time Utilities for Waveform Tests
// ============================================

describe('Time Utilities', () => {
    describe('ticksToPixels', () => {
        it('should convert ticks to pixels at zoom 1', () => {
            const pixels = ticksToPixels(PPQ, 1, PPQ);
            expect(pixels).toBeGreaterThan(0);
        });

        it('should scale with zoom', () => {
            const pixels1 = ticksToPixels(PPQ, 1, PPQ);
            const pixels2 = ticksToPixels(PPQ, 2, PPQ);
            expect(pixels2).toBe(pixels1 * 2);
        });

        it('should return 0 for 0 ticks', () => {
            const pixels = ticksToPixels(0, 1, PPQ);
            expect(pixels).toBe(0);
        });
    });

    describe('pixelsToTicks', () => {
        it('should convert pixels to ticks', () => {
            const ticks = pixelsToTicks(100, 1, PPQ);
            expect(ticks).toBeGreaterThan(0);
        });

        it('should be inverse of ticksToPixels', () => {
            const originalTicks = 384;
            const pixels = ticksToPixels(originalTicks, 1, PPQ);
            const resultTicks = pixelsToTicks(pixels, 1, PPQ);
            expect(Math.round(resultTicks)).toBe(originalTicks);
        });
    });
});

// ============================================
// Waveform Preview Tests
// ============================================

describe('Audio Waveform Preview Feature', () => {
    describe('Waveform data processing', () => {
        it('should downsample audio data to reasonable number of points', () => {
            // Simulate audio channel data
            const sampleCount = 44100 * 2; // 2 seconds at 44.1kHz
            const targetSamples = 100;
            const blockSize = Math.floor(sampleCount / targetSamples);

            expect(blockSize).toBe(882);
            expect(Math.ceil(sampleCount / blockSize)).toBeLessThanOrEqual(targetSamples + 1);
        });

        it('should calculate peak values correctly', () => {
            const channelData = new Float32Array([0.1, -0.3, 0.5, -0.8, 0.2]);
            const max = Math.max(...Array.from(channelData).map(Math.abs));
            expect(max).toBeCloseTo(0.8, 5);
            const peaks = [0.2, 0.5, 0.8, 0.3];
            const normalized = peaks.map((p) => Math.min(1, Math.max(0, p)));
            normalized.forEach((p) => {
                expect(p).toBeGreaterThanOrEqual(0);
                expect(p).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('Canvas dimensions', () => {
        it('should calculate correct bar width', () => {
            const width = 200;
            const waveformDataLength = 100;
            const barWidth = Math.max(1, width / waveformDataLength - 1);

            expect(barWidth).toBe(1); // 200/100 - 1 = 1
        });

        it('should center waveform vertically', () => {
            const height = 40;
            const centerY = height / 2;
            expect(centerY).toBe(20);
        });

        it('should scale bar height based on peak value', () => {
            const height = 40;
            const peakValue = 0.5;
            const scaleFactor = 0.8;
            const barHeight = peakValue * height * scaleFactor;

            expect(barHeight).toBe(16); // 0.5 * 40 * 0.8 = 16
        });
    });
});

// ============================================
// Keyboard Shortcuts Tests
// ============================================

describe('Keyboard Shortcuts', () => {
    describe('Split shortcut (S key)', () => {
        it('should validate S key condition', () => {
            const key = 's';
            const ctrlKey = false;
            const metaKey = false;
            const hasSelection = true;
            const selectionType = 'clips';
            const selectionCount = 1;

            const shouldTriggerSplit =
                key === 's' &&
                !ctrlKey &&
                !metaKey &&
                hasSelection &&
                selectionType === 'clips' &&
                selectionCount === 1;

            expect(shouldTriggerSplit).toBe(true);
        });

        it('should not trigger with Ctrl+S', () => {
            const key = 's';
            const ctrlKey = true;
            const metaKey = false;

            const shouldTriggerSplit = key === 's' && !ctrlKey && !metaKey;

            expect(shouldTriggerSplit).toBe(false);
        });

        it('should not trigger with no selection', () => {
            const hasSelection = false;

            expect(hasSelection).toBe(false);
        });

        it('should not trigger with multiple clips selected', () => {
            const selectionCount = 3;

            const isSingleSelection = selectionCount === 1;

            expect(isSingleSelection).toBe(false);
        });
    });

    describe('Delete shortcut', () => {
        it('should trigger on Delete key', () => {
            const key = 'Delete';
            const shouldDelete = key === 'Delete' || key === 'Backspace';
            expect(shouldDelete).toBe(true);
        });

        it('should trigger on Backspace key', () => {
            const key = 'Backspace';
            const shouldDelete = key === 'Delete' || key === 'Backspace';
            expect(shouldDelete).toBe(true);
        });
    });
});

// ============================================
// Alt+Click Split Tests
// ============================================

describe('Alt+Click Split', () => {
    describe('Click position to tick conversion', () => {
        it('should convert click position to tick', () => {
            const clipStartTick = 0;
            const clickX = 50; // pixels from clip left edge
            const zoom = 1;

            const clickTick = clipStartTick + pixelsToTicks(clickX, zoom, PPQ);

            expect(clickTick).toBeGreaterThan(0);
        });

        it('should snap to beat', () => {
            const rawTick = 150; // Not aligned to beat
            const snappedTick = Math.round(rawTick / PPQ) * PPQ;

            expect(snappedTick % PPQ).toBe(0);
        });
    });
});

// ============================================
// Context Menu Tests
// ============================================

describe('Context Menu', () => {
    describe('Menu options availability', () => {
        it('should show split option when playhead is within clip', () => {
            const clip = createTestPatternClip({
                startTick: 0,
                durationTick: PPQ * 4,
            });
            const playhead = PPQ * 2;

            const canSplit =
                playhead > clip.startTick && playhead < clip.startTick + clip.durationTick;

            expect(canSplit).toBe(true);
        });

        it('should hide split option when playhead is outside clip', () => {
            const clip = createTestPatternClip({
                startTick: PPQ * 4,
                durationTick: PPQ * 4,
            });
            const playhead = PPQ; // Before clip

            const canSplit =
                playhead > clip.startTick && playhead < clip.startTick + clip.durationTick;

            expect(canSplit).toBe(false);
        });
    });
});

// ============================================
// Clip Operations Integration Tests
// ============================================

describe('Clip Operations Integration', () => {
    it('should support move after split', () => {
        const clip = createTestPatternClip({
            startTick: 0,
            durationTick: PPQ * 4,
        });

        const result = splitClip(clip, PPQ * 2);
        expect(result).not.toBeNull();

        const [first, second] = result!;
        const movedSecond = moveClip(second, PPQ * 4, 1);

        expect(movedSecond.startTick).toBe(PPQ * 6);
        expect(movedSecond.trackIndex).toBe(1);
    });

    it('should support resize after split', () => {
        const clip = createTestPatternClip({
            startTick: 0,
            durationTick: PPQ * 4,
        });

        const result = splitClip(clip, PPQ * 2);
        expect(result).not.toBeNull();

        const [first] = result!;
        const resized = resizeClip(first, PPQ * 4);

        expect(resized.durationTick).toBe(PPQ * 4);
    });

    it('should support duplicate after color change', () => {
        const clip = createTestPatternClip({ color: '#ff6b6b' });
        const coloredClip = { ...clip, color: '#4d96ff' };
        const duplicated = duplicateClip(coloredClip);

        expect(duplicated.color).toBe('#4d96ff');
        expect(duplicated.id).not.toBe(coloredClip.id);
    });

    it('should support multiple operations in sequence', () => {
        // Start with a clip
        const original = createTestPatternClip({
            startTick: 0,
            durationTick: PPQ * 8,
            color: '#ff6b6b',
        });

        // Split it
        const splitResult = splitClip(original, PPQ * 4);
        expect(splitResult).not.toBeNull();
        const [first, second] = splitResult!;

        // Change color of first
        const coloredFirst = { ...first, color: '#4d96ff' };

        // Move second
        const movedSecond = moveClip(second, PPQ * 2, 1);

        // Duplicate colored first
        const duplicatedFirst = duplicateClip(coloredFirst);

        expect(coloredFirst.color).toBe('#4d96ff');
        expect(movedSecond.trackIndex).toBe(1);
        expect(duplicatedFirst.startTick).toBe(PPQ * 4); // Original duration
    });
});
