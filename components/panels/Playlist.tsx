'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useStore } from '@/state/store';
import { ticksToPixels, pixelsToTicks } from '@/lib/utils/time';
import type { Clip, PatternClip, AudioClip, Pattern, PlaylistTrack as PlaylistTrackType, AudioAsset } from '@/domain/types';
import WaveformCanvas from '@/components/common/WaveformCanvas';
import { useAISuggestion, type GhostClip } from '@/lib/ai/hooks/useAISuggestion';

const TRACK_HEIGHT = 60;
const HEADER_WIDTH = 120;
const PPQ = 96;
const LOOP_HANDLE_WIDTH = 8;

// Predefined color palette for clips
const CLIP_COLORS = [
  '#ff6b6b', '#ffa502', '#ffd93d', '#6bcb77', '#4d96ff', '#6c5ce7',
  '#a55eea', '#fd79a8', '#00cec9', '#81ecec', '#74b9ff', '#fab1a0',
  '#ff7675', '#b2bec3', '#636e72', '#2d3436',
];

// Box selection state interface
interface BoxSelection {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export default function Playlist() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [dropDebug, setDropDebug] = useState<string>('');

  // Box selection state
  const [boxSelection, setBoxSelection] = useState<BoxSelection | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);

  // Split preview state
  const [splitPreview, setSplitPreview] = useState<{ clipId: string; tick: number } | null>(null);

  // AI Ghost Preview state - click only, no hover timing
  const { isAnalyzing, analyzingTrackIndex, ghostClip, triggerSuggestion, acceptSuggestion, dismissSuggestion } = useAISuggestion();

  const {
    project,
    playlistZoom,
    position,
    selectedPatternId,
    addClip,
    addAudioAssetFromUrl,
    deleteClip,
    moveClipAction,
    resizeClipAction,
    toggleClipMute,
    addPlaylistTrack,
    addAudioSampleToNewTrack,
    togglePlaylistTrackMute,
    togglePlaylistTrackSolo,
    selection,
    setSelection,
    snapToGrid,
    setLoopRegion,
    splitClipAction,
    setClipColor,
    setPosition,
    openPianoRoll,
  } = useStore();

  const playlist = project?.playlist;
  const patterns = project?.patterns ?? [];
  const assets = project?.assets ?? [];
  const tracks = playlist?.tracks ?? [];
  const clips = playlist?.clips ?? [];
  const bpm = project?.bpm ?? 120;
  const ppq = project?.ppq ?? PPQ;

  // Loop region state
  const loopStart = playlist?.loopStart ?? 0;
  const loopEnd = playlist?.loopEnd ?? PPQ * 4 * 4;
  const loopEnabled = playlist?.loopEnabled ?? false;

  // Loop region drag state
  const [isDraggingLoop, setIsDraggingLoop] = useState<'start' | 'end' | 'region' | null>(null);
  const loopDragStart = useRef({ x: 0, loopStart: 0, loopEnd: 0 });

  // Playhead drag state
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  // Calculate total width based on content
  const maxTick = Math.max(
    PPQ * 4 * 32, // Extended minimum to 32 bars to show playhead past loops
    ...clips.map((c) => c.startTick + c.durationTick)
  );
  const totalWidth = ticksToPixels(maxTick, playlistZoom, PPQ) + 200;

  // Calculate effective track count - include enough rows for all clips
  const maxClipTrackIndex = clips.length > 0 ? Math.max(...clips.map(c => c.trackIndex)) : 0;
  const effectiveTrackCount = Math.max(tracks.length, maxClipTrackIndex + 1, 3); // At least 3 rows

  console.log('[Playlist] Render', {
    tracks: tracks.length,
    clips: clips.length,
    effectiveTrackCount,
    viewport: effectiveTrackCount * TRACK_HEIGHT
  });

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollLeft(target.scrollLeft);
    setScrollTop(target.scrollTop);
  }, []);

  // Loop region drag handlers
  const handleLoopDragStart = useCallback(
    (e: React.MouseEvent, handle: 'start' | 'end' | 'region') => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingLoop(handle);
      loopDragStart.current = { x: e.clientX, loopStart, loopEnd };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - loopDragStart.current.x;
        const deltaTicks = pixelsToTicks(deltaX, playlistZoom, ppq);
        // Snap to beat
        const snappedDelta = Math.round(deltaTicks / ppq) * ppq;

        if (handle === 'start') {
          const newStart = Math.max(0, loopDragStart.current.loopStart + snappedDelta);
          if (newStart < loopDragStart.current.loopEnd - ppq) {
            setLoopRegion(newStart, loopDragStart.current.loopEnd);
          }
        } else if (handle === 'end') {
          const newEnd = Math.max(ppq, loopDragStart.current.loopEnd + snappedDelta);
          if (newEnd > loopDragStart.current.loopStart + ppq) {
            setLoopRegion(loopDragStart.current.loopStart, newEnd);
          }
        } else if (handle === 'region') {
          const regionLength = loopDragStart.current.loopEnd - loopDragStart.current.loopStart;
          const newStart = Math.max(0, loopDragStart.current.loopStart + snappedDelta);
          setLoopRegion(newStart, newStart + regionLength);
        }
      };

      const handleMouseUp = () => {
        setIsDraggingLoop(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [loopStart, loopEnd, playlistZoom, ppq, setLoopRegion]
  );

  // Playhead drag/click handlers
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const scrollLeft = containerRef.current?.scrollLeft ?? 0;
      const x = e.clientX - rect.left + scrollLeft;
      const tick = pixelsToTicks(x, playlistZoom, PPQ);

      // No snapping for playhead - allow smooth positioning anywhere
      setPosition(Math.max(0, tick));
    },
    [playlistZoom, setPosition]
  );

  const handlePlayheadDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingPlayhead(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const scrollLeft = containerRef.current?.scrollLeft ?? 0;
        const x = moveEvent.clientX - rect.left + scrollLeft;
        const tick = pixelsToTicks(x, playlistZoom, PPQ);

        // No snapping for playhead - allow smooth positioning anywhere
        setPosition(Math.max(0, tick));
      };

      const handleMouseUp = () => {
        setIsDraggingPlayhead(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [playlistZoom, setPosition]
  );

  // Box selection handlers
  const handleBoxSelectionStart = useCallback(
    (e: React.MouseEvent) => {
      // Only start box selection if clicking on background (not on clip) and using shift or middle mouse
      const target = e.target as HTMLElement;
      const isClickingClip = target.closest('.clip');

      if (!isClickingClip && (e.shiftKey || e.button === 1)) {
        console.log('[Playlist] Starting box selection. Shift:', e.shiftKey, 'Button:', e.button);
        e.preventDefault();
        e.stopPropagation();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left + (containerRef.current?.scrollLeft ?? 0);
        const y = e.clientY - rect.top + (containerRef.current?.scrollTop ?? 0);

        setIsBoxSelecting(true);
        setBoxSelection({ startX: x, startY: y, currentX: x, currentY: y });
      }
    },
    []
  );

  const handleBoxSelectionMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isBoxSelecting || !boxSelection) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left + (containerRef.current?.scrollLeft ?? 0);
      const y = e.clientY - rect.top + (containerRef.current?.scrollTop ?? 0);

      setBoxSelection((prev) => prev ? { ...prev, currentX: x, currentY: y } : null);
    },
    [isBoxSelecting, boxSelection]
  );

  const handleBoxSelectionEnd = useCallback(
    () => {
      if (!isBoxSelecting || !boxSelection) {
        setIsBoxSelecting(false);
        setBoxSelection(null);
        return;
      }

      // Calculate selection rectangle in grid coordinates
      const minX = Math.min(boxSelection.startX, boxSelection.currentX);
      const maxX = Math.max(boxSelection.startX, boxSelection.currentX);
      const minY = Math.min(boxSelection.startY, boxSelection.currentY);
      const maxY = Math.max(boxSelection.startY, boxSelection.currentY);

      // Find clips within the selection box
      const selectedIds = clips
        .filter((clip) => {
          const clipX = ticksToPixels(clip.startTick, playlistZoom, PPQ);
          const clipWidth = ticksToPixels(clip.durationTick, playlistZoom, PPQ);
          const clipY = clip.trackIndex * TRACK_HEIGHT;
          const clipHeight = TRACK_HEIGHT;

          // Check if clip intersects with selection box
          return (
            clipX < maxX &&
            clipX + clipWidth > minX &&
            clipY < maxY &&
            clipY + clipHeight > minY
          );
        })
        .map((clip) => clip.id);

      if (selectedIds.length > 0) {
        setSelection({ type: 'clips', ids: selectedIds });
      } else {
        setSelection(null);
      }

      setIsBoxSelecting(false);
      setBoxSelection(null);
    },
    [isBoxSelecting, boxSelection, clips, playlistZoom, setSelection]
  );

  // Context menu handler
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, clipId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const clip = clips.find((c) => c.id === clipId);
      console.log('[Playlist] Context menu opened:', {
        clipId: clipId.substring(0, 8),
        clip: clip ? {
          startTick: clip.startTick,
          endTick: clip.startTick + clip.durationTick,
          durationTick: clip.durationTick
        } : 'not found',
        playheadPosition: position,
        canSplit: clip ? (position > clip.startTick && position < clip.startTick + clip.durationTick) : false
      });
      setContextMenu({ x: e.clientX, y: e.clientY, clipId });
    },
    [clips, position]
  );

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle split at position
  const handleSplitClip = useCallback(
    (clipId: string, tick: number) => {
      splitClipAction(clipId, tick);
      closeContextMenu();
    },
    [splitClipAction, closeContextMenu]
  );

  // Handle color change
  const handleColorChange = useCallback(
    (clipId: string, color: string) => {
      setClipColor(clipId, color);
      closeContextMenu();
    },
    [setClipColor, closeContextMenu]
  );

  // Keyboard shortcuts for split (S key when clip is selected)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Split with S key
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        console.log('[Playlist] S key pressed. Selection:', selection);
        if (selection?.type === 'clips' && selection.ids.length > 0) {
          e.preventDefault();
          // Split all selected clips at current playhead position
          selection.ids.forEach((clipId) => {
            const clip = clips.find((c) => c.id === clipId);
            if (clip && position > clip.startTick && position < clip.startTick + clip.durationTick) {
              console.log('[Playlist] Splitting clip:', clipId.substring(0, 8), 'at position:', position);
              splitClipAction(clipId, position);
            } else if (clip) {
              console.log('[Playlist] Cannot split clip:', clipId.substring(0, 8), '- playhead not within bounds. Clip:', clip.startTick, '-', clip.startTick + clip.durationTick, 'Playhead:', position);
            }
          });
        }
      }
      // Delete selected clips with Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection?.type === 'clips' && selection.ids.length > 0) {
        e.preventDefault();
        selection.ids.forEach((id) => deleteClip(id));
        setSelection(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, clips, position, splitClipAction, deleteClip, setSelection]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
    return undefined;
  }, [contextMenu, closeContextMenu]);

  // Handle double-click to add clip
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedPatternId || !project) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left - HEADER_WIDTH + scrollLeft;
      const y = e.clientY - rect.top + scrollTop;

      const trackIndex = Math.floor(y / TRACK_HEIGHT);
      const tick = pixelsToTicks(x, playlistZoom, ppq);

      // Snap to beat
      const snappedTick = Math.floor(tick / ppq) * ppq;

      // Get pattern length in ticks
      const pattern = patterns.find((p) => p.id === selectedPatternId);
      if (!pattern) return;

      const patternLengthTicks = (pattern.lengthInSteps / pattern.stepsPerBeat) * PPQ;

      addClip({
        type: 'pattern',
        patternId: selectedPatternId,
        trackIndex: Math.max(0, Math.min(trackIndex, tracks.length - 1)),
        startTick: Math.max(0, snappedTick),
        durationTick: patternLengthTicks,
        offset: 0,
        color: pattern.color,
        mute: false,
      } as Clip);
    },
    [selectedPatternId, project, scrollLeft, scrollTop, playlistZoom, patterns, tracks.length, addClip]
  );

  // Handle drag and drop from browser
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setDropDebug('drop: received');

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Use the actual scroll position from the container
      const currentScrollLeft = containerRef.current?.scrollLeft ?? 0;
      const currentScrollTop = containerRef.current?.scrollTop ?? 0;

      const x = e.clientX - rect.left + currentScrollLeft;
      const y = e.clientY - rect.top + currentScrollTop;

      // Calculate track index and clamp to valid range
      const rawTrackIndex = Math.floor(y / TRACK_HEIGHT);
      // Ensure we have at least one track to drop into
      const maxTrackIndex = Math.max(0, tracks.length - 1);
      const trackIndex = Math.max(0, Math.min(rawTrackIndex, maxTrackIndex));

      const tick = pixelsToTicks(x, playlistZoom, PPQ);

      // Snap to beat
      const snappedTick = Math.floor(tick / PPQ) * PPQ;

      console.log('[Playlist] Drop position:', {
        clientY: e.clientY,
        rectTop: rect.top,
        scrollTop: currentScrollTop,
        y,
        rawTrackIndex,
        trackIndex,
        tracksLength: tracks.length
      });

      try {
        const raw =
          e.dataTransfer.getData('application/json') ||
          e.dataTransfer.getData('text/plain');
        if (!raw) {
          setDropDebug('drop: no payload');
          return;
        }
        const data = JSON.parse(raw);
        setDropDebug(`drop: ${data?.type ?? 'unknown'}`);
        console.info('[Playlist] drop payload', data);

        if (data.type === 'pattern' && data.patternId) {
          const pattern = patterns.find((p) => p.id === data.patternId);
          if (!pattern) return;

          const patternLengthTicks = (pattern.lengthInSteps / pattern.stepsPerBeat) * PPQ;

          addClip({
            type: 'pattern',
            patternId: data.patternId,
            trackIndex,
            startTick: Math.max(0, snappedTick),
            durationTick: patternLengthTicks,
            offset: 0,
            color: pattern.color,
            mute: false,
          } as Clip);
          setDropDebug('drop: pattern added');
        }

        if (data.type === 'library-sample' && data.sample) {
          const sample = data.sample as { name: string; filename: string; path: string; duration?: number };
          const assetId = addAudioAssetFromUrl({
            name: sample.name,
            fileName: sample.filename || `${sample.name}`,
            storageUrl: sample.path,
            duration: sample.duration ?? 0,
            format: sample.path.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg',
          });

          const durationSeconds = sample.duration ?? 0.5;
          // Calculate duration in ticks and snap to nearest beat
          const rawDurationTick = Math.round((durationSeconds * bpm * ppq) / 60);
          // Snap to at least 1 beat, and round up to nearest beat
          const durationTick = Math.max(ppq, Math.ceil(rawDurationTick / ppq) * ppq);

          console.log('[Playlist] Library sample drop:', {
            sample: sample.name,
            assetId,
            trackIndex,
            tracksLength: tracks.length,
            willAddToExisting: trackIndex < tracks.length,
            snappedTick,
            durationTick
          });

          // If dropped on an existing track, add clip to that track
          // Otherwise, create a new track
          if (trackIndex < tracks.length) {
            console.log('[Playlist] Adding to existing track:', trackIndex);
            // Add to existing track
            const { getSampleColor } = await import('@/domain/operations');
            addClip({
              type: 'audio',
              assetId,
              trackIndex,
              startTick: Math.max(0, snappedTick),
              durationTick,
              offset: 0,
              color: getSampleColor(sample.name || sample.filename || assetId),
              mute: false,
              gain: 1,
              pitch: 0,
            } as AudioClip);
          } else {
            console.log('[Playlist] Creating new track for sample');
            // Create a new track for dropped samples
            setTimeout(async () => {
              await addAudioSampleToNewTrack(
                assetId,
                sample.name,
                Math.max(0, snappedTick),
                durationTick
              );
            }, 20);
          }

          setDropDebug('drop: audio clip added');
        }

        if (data.type === 'user-sample' && data.assetId) {
          const asset = assets.find((a) => a.id === data.assetId);
          const durationSeconds = asset?.duration ?? 0.5;
          // Calculate duration in ticks and snap to nearest beat
          const rawDurationTick = Math.round((durationSeconds * bpm * ppq) / 60);
          // Snap to at least 1 beat, and round up to nearest beat
          const durationTick = Math.max(ppq, Math.ceil(rawDurationTick / ppq) * ppq);

          // If dropped on an existing track, add clip to that track
          // Otherwise, create a new track
          if (trackIndex < tracks.length) {
            // Add to existing track
            const { getSampleColor } = await import('@/domain/operations');
            const sampleName = asset?.name || asset?.fileName || data.assetId;
            addClip({
              type: 'audio',
              assetId: data.assetId,
              trackIndex,
              startTick: Math.max(0, snappedTick),
              durationTick,
              offset: 0,
              color: getSampleColor(sampleName),
              mute: false,
              gain: 1,
              pitch: 0,
            } as AudioClip);
          } else {
            // Create a new track for dropped samples
            setTimeout(async () => {
              await addAudioSampleToNewTrack(
                data.assetId,
                asset?.name || 'Audio',
                Math.max(0, snappedTick),
                durationTick
              );
            }, 20);
          }

          setDropDebug('drop: audio clip added');
        }
      } catch (err) {
        setDropDebug('drop: parse error');
        console.error('Failed to parse drop data:', err);
      }
    },
    [playlistZoom, patterns, tracks.length, addClip, addAudioAssetFromUrl, addPlaylistTrack, addAudioSampleToNewTrack, assets, bpm, ppq]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dropDebug !== 'dragover') {
      setDropDebug('dragover');
    }
  }, [dropDebug]);

  // ============================================
  // AI Ghost Preview Handlers
  // ============================================

  // Calculate the last clip position for each track
  const getLastClipEndTick = useCallback((trackIndex: number): number => {
    const trackClips = clips.filter(c => c.trackIndex === trackIndex);
    if (trackClips.length === 0) return 0;
    return Math.max(...trackClips.map(c => c.startTick + c.durationTick));
  }, [clips]);

  // Handle + zone click - trigger AI suggestion immediately
  const handlePlusZoneClick = useCallback((trackId: string, trackIndex: number, afterTick: number) => {
    console.log('[AI Ghost] Click triggered for track', trackIndex);
    if (!isAnalyzing) {
      triggerSuggestion(trackId, trackIndex, afterTick);
    }
  }, [isAnalyzing, triggerSuggestion]);

  // Handle ghost clip click (accept suggestion)
  const handleGhostClipClick = useCallback(async () => {
    const result = await acceptSuggestion();
    if (!result.success) {
      console.error('Failed to accept suggestion:', result.message);
    }
  }, [acceptSuggestion]);

  // Handle ghost clip dismiss (click outside or ESC)
  const handleGhostClipDismiss = useCallback(() => {
    dismissSuggestion();
  }, [dismissSuggestion]);

  // ESC key to dismiss ghost clip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ghostClip) {
        handleGhostClipDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ghostClip, handleGhostClipDismiss]);

  // Position cursor
  const cursorX = ticksToPixels(position, playlistZoom, PPQ);

  // Loop region positions
  const loopStartX = ticksToPixels(loopStart, playlistZoom, PPQ);
  const loopEndX = ticksToPixels(loopEnd, playlistZoom, PPQ);
  const loopWidth = loopEndX - loopStartX;

  return (
    <div className="h-full flex flex-col" data-panel="playlist">
      {dropDebug && (
        <div className="absolute top-2 right-2 z-50 text-2xs px-2 py-1 rounded bg-ps-bg-800/80 text-ps-text-secondary">
          {dropDebug}
        </div>
      )}
      {/* Timeline Header */}
      <div className="h-6 flex border-b border-ps-bg-600 shrink-0">
        {/* Corner */}
        <div className="w-[120px] shrink-0 bg-ps-bg-700 border-r border-ps-bg-600 flex items-center justify-center">
          <span className="text-[9px] text-ps-text-muted/60" title="Double-click pattern clips to edit notes">
            🎹 2x click
          </span>
        </div>

        {/* Timeline ruler */}
        <div
          className="flex-1 overflow-hidden relative bg-ps-bg-700 cursor-pointer"
          style={{ marginLeft: -scrollLeft }}
          onClick={handleTimelineClick}
        >
          <TimelineRuler
            width={totalWidth}
            zoom={playlistZoom}
            ppq={PPQ}
            bpm={bpm}
          />

          {/* Playhead position indicator on timeline */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-ps-accent-primary cursor-ew-resize hover:bg-orange-400 z-20"
            style={{ left: cursorX - 2 }}
            onMouseDown={handlePlayheadDragStart}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-ps-accent-primary" />
          </div>

          {/* Loop Region Markers on Timeline */}
          <LoopRegionMarkers
            loopStartX={loopStartX}
            loopEndX={loopEndX}
            loopWidth={loopWidth}
            loopEnabled={loopEnabled}
            isDragging={isDraggingLoop}
            onDragStart={handleLoopDragStart}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track headers */}
        <div
          className="w-[120px] shrink-0 overflow-hidden border-r border-ps-bg-600"
          style={{ marginTop: -scrollTop }}
        >
          {tracks.map((track, index) => (
            <TrackHeader
              key={track.id}
              track={track}
              index={index}
              onToggleMute={() => togglePlaylistTrackMute(track.id)}
              onToggleSolo={() => togglePlaylistTrackSolo(track.id)}
            />
          ))}
          <button
            className="w-full h-8 text-xs text-ps-text-muted hover:text-ps-text-primary hover:bg-ps-bg-700 transition-colors"
            onClick={() => addPlaylistTrack()}
          >
            + Add Track
          </button>
        </div>

        {/* Grid and clips */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto relative"
          onScroll={handleScroll}
          onDoubleClick={handleDoubleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMouseDown={handleBoxSelectionStart}
          onMouseMove={handleBoxSelectionMove}
          onMouseUp={handleBoxSelectionEnd}
          onMouseLeave={handleBoxSelectionEnd}
        >
          {/* Grid background */}
          <div
            className="absolute inset-0"
            style={{
              width: totalWidth,
              height: effectiveTrackCount * TRACK_HEIGHT,
            }}
          >
            <PlaylistGrid
              width={totalWidth}
              height={effectiveTrackCount * TRACK_HEIGHT}
              zoom={playlistZoom}
              ppq={PPQ}
              trackCount={effectiveTrackCount}
              trackHeight={TRACK_HEIGHT}
            />

            {/* Clips */}
            {clips.map((clip) => (
              <ClipBlock
                key={clip.id}
                clip={clip}
                pattern={
                  clip.type === 'pattern'
                    ? patterns.find((p) => p.id === clip.patternId)
                    : undefined
                }
                asset={
                  clip.type === 'audio'
                    ? assets.find((a) => a.id === clip.assetId)
                    : undefined
                }
                zoom={playlistZoom}
                bpm={bpm}
                ppq={PPQ}
                trackHeight={TRACK_HEIGHT}
                isSelected={selection?.ids.includes(clip.id) ?? false}
                onSelect={() => setSelection({ type: 'clips', ids: [clip.id] })}
                onDelete={() => deleteClip(clip.id)}
                onToggleMute={() => toggleClipMute(clip.id)}
                onContextMenu={(e) => handleContextMenu(e, clip.id)}
                onSplit={(tick) => handleSplitClip(clip.id, tick)}
                onDoubleClick={() => {
                  if (clip.type === 'pattern' && clip.patternId) {
                    openPianoRoll(clip.patternId);
                  }
                }}
                snapToGrid={snapToGrid}
              />
            ))}

            {/* AI Ghost Preview - Plus Zones for each track */}
            {Array.from({ length: effectiveTrackCount }).map((_, trackIndex) => {
              const track = tracks[trackIndex];
              const trackId = track?.id || `track-${trackIndex}`;
              const lastClipEnd = getLastClipEndTick(trackIndex);
              const plusZoneX = ticksToPixels(lastClipEnd, playlistZoom, PPQ) + 8;
              const plusZoneY = trackIndex * TRACK_HEIGHT + (TRACK_HEIGHT - 32) / 2;
              const isThisTrackAnalyzing = isAnalyzing && analyzingTrackIndex === trackIndex;

              return (
                <div
                  key={`plus-zone-${trackId}`}
                  className={`absolute flex items-center justify-center w-10 h-10 rounded-lg border-2 border-dashed 
                    transition-all duration-200 cursor-pointer z-20
                    ${isThisTrackAnalyzing
                      ? 'border-blue-400 bg-blue-500/30 scale-110 shadow-lg shadow-blue-500/30'
                      : 'border-ps-bg-400 bg-ps-bg-600/70 hover:border-blue-400 hover:bg-blue-500/20 hover:scale-105'
                    }`}
                  style={{
                    left: plusZoneX,
                    top: plusZoneY,
                  }}
                  onClick={() => handlePlusZoneClick(trackId, trackIndex, lastClipEnd)}
                  title="Click to get AI suggestion"
                >
                  {isThisTrackAnalyzing ? (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-blue-400 text-xl font-bold">+</span>
                  )}
                </div>
              );
            })}

            {/* AI Ghost Preview - Ghost Clip */}
            {ghostClip && (
              <div
                className="absolute rounded-lg border-2 border-dashed border-cyan-400 cursor-pointer z-30
                  transition-all duration-300 hover:border-cyan-300 shadow-xl shadow-cyan-500/50"
                style={{
                  left: ticksToPixels(ghostClip.startTick, playlistZoom, PPQ),
                  top: ghostClip.trackIndex * TRACK_HEIGHT + 4,
                  width: Math.max(ticksToPixels(ghostClip.durationTick, playlistZoom, PPQ), 120),
                  height: TRACK_HEIGHT - 8,
                  background: ghostClip.batchCommands
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.5) 0%, rgba(236, 72, 153, 0.5) 100%)' // Purple/pink for new patterns
                    : 'linear-gradient(135deg, rgba(34, 211, 238, 0.5) 0%, rgba(59, 130, 246, 0.5) 100%)', // Cyan/blue for existing
                  boxShadow: ghostClip.batchCommands
                    ? '0 0 20px rgba(168, 85, 247, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.1)'
                    : '0 0 20px rgba(34, 211, 238, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.1)',
                }}
                onClick={handleGhostClipClick}
                title={`Click to add: ${ghostClip.patternName}\n${ghostClip.reasoning || ''}`}
              >
                {/* Pulsing glow effect */}
                <div
                  className="absolute inset-0 rounded-lg opacity-75"
                  style={{
                    animation: 'pulse 1.5s ease-in-out infinite',
                    background: ghostClip.batchCommands
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
                  }}
                />
                <div className="absolute inset-0 flex items-center gap-2 px-3 overflow-hidden z-10">
                  <span className="text-2xl drop-shadow-lg animate-bounce">
                    {ghostClip.batchCommands ? '✨' : '🤖'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white drop-shadow-md truncate">
                      {ghostClip.batchCommands ? '🎵 ' : ''}{ghostClip.patternName || 'AI Suggestion'}
                    </div>
                    {ghostClip.reasoning && (
                      <div className="text-xs text-cyan-100 drop-shadow truncate">
                        {ghostClip.reasoning}
                      </div>
                    )}
                  </div>
                  <button
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-500 text-white text-sm font-bold shadow-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGhostClipDismiss();
                    }}
                    title="Dismiss suggestion (ESC)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Box Selection Rectangle */}
            {isBoxSelecting && boxSelection && (
              <div
                className="absolute border-2 border-ps-accent-primary bg-ps-accent-primary/20 pointer-events-none z-20"
                style={{
                  left: Math.min(boxSelection.startX, boxSelection.currentX),
                  top: Math.min(boxSelection.startY, boxSelection.currentY),
                  width: Math.abs(boxSelection.currentX - boxSelection.startX),
                  height: Math.abs(boxSelection.currentY - boxSelection.startY),
                }}
              />
            )}

            {/* Loop Region Overlay in Grid */}
            {loopEnabled && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-5"
                style={{
                  left: loopStartX,
                  width: loopWidth,
                  background: 'rgba(var(--ps-accent-tertiary-rgb), 0.08)',
                  borderLeft: '2px solid rgba(var(--ps-accent-tertiary-rgb), 0.5)',
                  borderRight: '2px solid rgba(var(--ps-accent-tertiary-rgb), 0.5)',
                }}
              />
            )}

            {/* Playhead cursor */}
            <div
              className={`absolute top-0 bottom-0 z-10 ${isDraggingPlayhead ? 'cursor-grabbing' : 'cursor-ew-resize'}`}
              style={{ left: cursorX - 4, width: 8 }}
              onMouseDown={handlePlayheadDragStart}
            >
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-ps-accent-primary" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-ps-accent-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ClipContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          clipId={contextMenu.clipId}
          clip={clips.find((c) => c.id === contextMenu.clipId)}
          position={position}
          onSplit={handleSplitClip}
          onColorChange={handleColorChange}
          onDelete={(id) => { deleteClip(id); closeContextMenu(); }}
          onDuplicate={(id) => { useStore.getState().duplicateClipAction(id); closeContextMenu(); }}
          onMute={(id) => { toggleClipMute(id); closeContextMenu(); }}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

// Timeline ruler component
function TimelineRuler({
  width,
  zoom,
  ppq,
  bpm,
}: {
  width: number;
  zoom: number;
  ppq: number;
  bpm: number;
}) {
  const bars: { bar: number; x: number }[] = [];
  const ticksPerBar = ppq * 4;
  const barCount = Math.ceil(width / ticksToPixels(ticksPerBar, zoom, ppq));

  for (let i = 0; i <= barCount; i++) {
    bars.push({
      bar: i + 1,
      x: ticksToPixels(i * ticksPerBar, zoom, ppq),
    });
  }

  return (
    <div className="relative h-full" style={{ width }}>
      {bars.map(({ bar, x }) => (
        <div
          key={bar}
          className="absolute top-0 h-full text-2xs text-ps-text-muted"
          style={{ left: x }}
        >
          <span className="ml-1">{bar}</span>
        </div>
      ))}
    </div>
  );
}

// Loop region markers component (displayed in timeline header)
function LoopRegionMarkers({
  loopStartX,
  loopEndX,
  loopWidth,
  loopEnabled,
  isDragging,
  onDragStart,
}: {
  loopStartX: number;
  loopEndX: number;
  loopWidth: number;
  loopEnabled: boolean;
  isDragging: 'start' | 'end' | 'region' | null;
  onDragStart: (e: React.MouseEvent, handle: 'start' | 'end' | 'region') => void;
}) {
  const opacity = loopEnabled ? 1 : 0.4;
  const bgColor = loopEnabled
    ? 'bg-ps-accent-tertiary/30'
    : 'bg-ps-bg-600/50';
  const handleColor = loopEnabled
    ? 'bg-ps-accent-tertiary hover:bg-ps-accent-tertiary/80'
    : 'bg-ps-text-muted/50 hover:bg-ps-text-muted/70';
  const borderColor = loopEnabled
    ? 'border-ps-accent-tertiary'
    : 'border-ps-text-muted/30';

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity }}
    >
      {/* Loop region background */}
      <div
        className={`absolute top-0 bottom-0 ${bgColor} pointer-events-auto cursor-grab active:cursor-grabbing`}
        style={{
          left: loopStartX + LOOP_HANDLE_WIDTH,
          width: Math.max(0, loopWidth - LOOP_HANDLE_WIDTH * 2)
        }}
        onMouseDown={(e) => onDragStart(e, 'region')}
        title="Drag to move loop region"
      />

      {/* Loop start handle */}
      <div
        className={`absolute top-0 bottom-0 ${handleColor} cursor-ew-resize pointer-events-auto flex items-center justify-center ${borderColor} border-r`}
        style={{
          left: loopStartX,
          width: LOOP_HANDLE_WIDTH
        }}
        onMouseDown={(e) => onDragStart(e, 'start')}
        title="Drag to adjust loop start"
      >
        <div className="w-0.5 h-3 bg-current rounded-full" />
      </div>

      {/* Loop end handle */}
      <div
        className={`absolute top-0 bottom-0 ${handleColor} cursor-ew-resize pointer-events-auto flex items-center justify-center ${borderColor} border-l`}
        style={{
          left: loopEndX - LOOP_HANDLE_WIDTH,
          width: LOOP_HANDLE_WIDTH
        }}
        onMouseDown={(e) => onDragStart(e, 'end')}
        title="Drag to adjust loop end"
      >
        <div className="w-0.5 h-3 bg-current rounded-full" />
      </div>

      {/* Loop indicator triangles at top */}
      {loopEnabled && (
        <>
          <div
            className="absolute top-0 pointer-events-none"
            style={{ left: loopStartX }}
          >
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-ps-accent-tertiary" />
          </div>
          <div
            className="absolute top-0 pointer-events-none"
            style={{ left: loopEndX - 12 }}
          >
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-ps-accent-tertiary" />
          </div>
        </>
      )}
    </div>
  );
}

// Playlist grid component
function PlaylistGrid({
  width,
  height,
  zoom,
  ppq,
  trackCount,
  trackHeight,
}: {
  width: number;
  height: number;
  zoom: number;
  ppq: number;
  trackCount: number;
  trackHeight: number;
}) {
  return (
    <svg className="absolute inset-0" width={width} height={height}>
      {/* Track lines */}
      {Array.from({ length: trackCount + 1 }).map((_, i) => (
        <line
          key={`track-${i}`}
          x1={0}
          y1={i * trackHeight}
          x2={width}
          y2={i * trackHeight}
          stroke="var(--ps-grid-line)"
          strokeWidth={1}
        />
      ))}

      {/* Beat lines */}
      {(() => {
        const lines: JSX.Element[] = [];
        const ticksPerBeat = ppq;
        const ticksPerBar = ppq * 4;
        const totalTicks = pixelsToTicks(width, zoom, ppq);

        for (let tick = 0; tick <= totalTicks; tick += ticksPerBeat) {
          const x = ticksToPixels(tick, zoom, ppq);
          const isBar = tick % ticksPerBar === 0;

          lines.push(
            <line
              key={`beat-${tick}`}
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke={isBar ? 'var(--ps-grid-bar)' : 'var(--ps-grid-beat)'}
              strokeWidth={isBar ? 1 : 0.5}
            />
          );
        }
        return lines;
      })()}
    </svg>
  );
}

// Track header component
function TrackHeader({
  track,
  index,
  onToggleMute,
  onToggleSolo,
}: {
  track: PlaylistTrackType;
  index: number;
  onToggleMute: () => void;
  onToggleSolo: () => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(track.name);
  const { updatePlaylistTrack } = useStore();

  return (
    <div
      className="flex items-center px-2 border-b border-ps-bg-700 bg-ps-bg-800"
      style={{ height: TRACK_HEIGHT }}
    >
      <div className="flex-1 min-w-0">
        {isEditingName ? (
          <input
            type="text"
            className="w-full text-xs bg-ps-bg-900 border border-ps-accent-primary rounded px-1"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={() => {
              if (editedName.trim()) {
                updatePlaylistTrack(track.id, { name: editedName.trim() });
              }
              setIsEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editedName.trim()) {
                  updatePlaylistTrack(track.id, { name: editedName.trim() });
                }
                setIsEditingName(false);
              } else if (e.key === 'Escape') {
                setEditedName(track.name);
                setIsEditingName(false);
              }
            }}
            autoFocus
            maxLength={30}
          />
        ) : (
          <div
            className="text-xs font-medium truncate cursor-pointer hover:text-ps-accent-primary"
            onClick={() => setIsEditingName(true)}
            title="Click to rename"
          >
            {track.name}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          className={`btn btn-icon w-5 h-5 text-2xs ${track.mute ? 'bg-ps-accent-red text-white' : 'btn-ghost'
            }`}
          title="Mute"
          onClick={onToggleMute}
        >
          M
        </button>
        <button
          className={`btn btn-icon w-5 h-5 text-2xs ${track.solo ? 'bg-ps-accent-tertiary text-black' : 'btn-ghost'
            }`}
          title="Solo"
          onClick={onToggleSolo}
        >
          S
        </button>
      </div>
    </div>
  );
}

// Clip block component
function ClipBlock({
  clip,
  pattern,
  asset,
  zoom,
  bpm,
  ppq,
  trackHeight,
  isSelected,
  onSelect,
  onDelete,
  onToggleMute,
  onContextMenu,
  onSplit,
  onDoubleClick,
  snapToGrid,
}: {
  clip: Clip;
  pattern: Pattern | undefined;
  asset: AudioAsset | undefined;
  zoom: number;
  bpm: number;
  ppq: number;
  trackHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleMute: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onSplit: (tick: number) => void;
  onDoubleClick: () => void;
  snapToGrid: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [resizeOffset, setResizeOffset] = useState(0);
  const [splitPreviewX, setSplitPreviewX] = useState<number | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0, startTick: 0, trackIndex: 0, duration: 0 });

  const { moveClipAction, resizeClipAction, updateClipAction } = useStore();

  const x = ticksToPixels(clip.startTick, zoom, ppq);
  const width = Math.max(20, ticksToPixels(clip.durationTick, zoom, ppq));
  const y = clip.trackIndex * trackHeight + 2;
  const height = trackHeight - 4;

  // Debug: log clip positioning
  if (clip.type === 'audio') {
    console.log('[ClipBlock] Rendering audio clip:', {
      clipId: clip.id.substring(0, 8),
      trackIndex: clip.trackIndex,
      trackHeight,
      calculatedY: y,
      startTick: clip.startTick
    });
  }

  const name = clip.type === 'pattern' ? pattern?.name ?? 'Pattern' : 'Audio';

  // Get notes and step events for visualization
  const notes = pattern?.notes || [];
  const stepEvents = pattern?.stepEvents || [];
  const patternLengthTicks = pattern ? (pattern.lengthInSteps / pattern.stepsPerBeat) * ppq : clip.durationTick;

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, edge: 'left' | 'right') => {
      e.stopPropagation();
      e.preventDefault();
      onSelect();

      setIsResizing(edge);
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        startTick: clip.startTick,
        trackIndex: clip.trackIndex,
        duration: clip.durationTick,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - dragStartPos.current.x;
        setResizeOffset(deltaX);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        const deltaX = upEvent.clientX - dragStartPos.current.x;
        const deltaTicks = pixelsToTicks(Math.abs(deltaX), zoom, ppq) * Math.sign(deltaX);

        let finalDeltaTicks = deltaTicks;
        if (snapToGrid) {
          const ticksPerBeat = ppq;
          finalDeltaTicks = Math.round(deltaTicks / ticksPerBeat) * ticksPerBeat;
        }

        if (edge === 'right') {
          // Resize from right: change duration
          const newDuration = Math.max(ppq, dragStartPos.current.duration + finalDeltaTicks);
          resizeClipAction(clip.id, newDuration);
        } else {
          // Resize from left: change start position and duration
          const newStartTick = Math.max(0, dragStartPos.current.startTick + finalDeltaTicks);
          const tickChange = newStartTick - dragStartPos.current.startTick;
          const newDuration = Math.max(ppq, dragStartPos.current.duration - tickChange);

          // Move the clip first, then resize
          moveClipAction(clip.id, tickChange, 0);
          resizeClipAction(clip.id, newDuration);

          if (clip.type === 'audio') {
            const secondsPerTick = 60 / (bpm * ppq);
            const offsetDeltaSeconds = Math.max(0, tickChange * secondsPerTick);
            updateClipAction(clip.id, {
              offset: Math.max(0, (clip.offset ?? 0) + offsetDeltaSeconds),
            });
          }
        }

        setIsResizing(null);
        setResizeOffset(0);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [clip.id, clip.startTick, clip.trackIndex, clip.durationTick, zoom, ppq, bpm, snapToGrid, onSelect, moveClipAction, resizeClipAction, updateClipAction, clip.offset, clip.type]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      // Prevent drag if resizing
      if (isResizing) {
        e.preventDefault();
        return;
      }

      e.stopPropagation();
      onSelect();
      setIsDragging(true);

      // Store initial position
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        startTick: clip.startTick,
        trackIndex: clip.trackIndex,
        duration: clip.durationTick,
      };

      // Set drag image (invisible to allow custom preview)
      const dragImage = document.createElement('div');
      dragImage.style.opacity = '0';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', clip.id);
    },
    [clip.id, clip.startTick, clip.trackIndex, clip.durationTick, onSelect, isResizing]
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      if (e.clientX === 0 && e.clientY === 0) return; // Ignore last drag event

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      setDragOffset({ x: deltaX, y: deltaY });
    },
    []
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation();
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      // Calculate new position in ticks
      const deltaPixels = deltaX;
      const deltaTicks = pixelsToTicks(Math.abs(deltaPixels), zoom, ppq) * Math.sign(deltaPixels);

      // Calculate new track
      const trackDelta = Math.round(deltaY / trackHeight);

      // Snap to grid if enabled
      let finalDeltaTicks = deltaTicks;
      if (snapToGrid) {
        const newTick = dragStartPos.current.startTick + deltaTicks;
        const snappedTick = Math.round(newTick / ppq) * ppq;
        finalDeltaTicks = snappedTick - dragStartPos.current.startTick;
      }

      // Only update if actually moved
      if (Math.abs(finalDeltaTicks) > 1 || trackDelta !== 0) {
        moveClipAction(clip.id, finalDeltaTicks, trackDelta);
      }
    },
    [clip.id, zoom, ppq, trackHeight, snapToGrid, moveClipAction]
  );

  const displayWidth = isResizing === 'right'
    ? Math.max(20, width + resizeOffset)
    : isResizing === 'left'
      ? Math.max(20, width - resizeOffset)
      : width;

  const displayX = isResizing === 'left' ? x + resizeOffset : x;

  // Alt+Click handler for splitting
  const handleAltClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.altKey) {
        e.stopPropagation();
        e.preventDefault();
        const rect = (e.target as HTMLElement).closest('.clip')?.getBoundingClientRect();
        if (rect) {
          const clickX = e.clientX - rect.left;
          const clickTick = clip.startTick + pixelsToTicks(clickX, zoom, ppq);
          // Snap to beat
          const snappedTick = Math.round(clickTick / ppq) * ppq;
          onSplit(snappedTick);
        }
      } else {
        onSelect();
      }
    },
    [clip.startTick, zoom, ppq, onSplit, onSelect]
  );

  // Show split preview on hover with Alt key
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (e.altKey) {
        const rect = (e.target as HTMLElement).closest('.clip')?.getBoundingClientRect();
        if (rect) {
          setSplitPreviewX(e.clientX - rect.left);
        }
      } else {
        setSplitPreviewX(null);
      }
    },
    []
  );

  return (
    <div
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className={`absolute clip group ${clip.mute ? 'clip-muted' : ''} ${isSelected ? 'clip-selected' : ''
        } ${isDragging ? 'opacity-50' : ''} ${!isResizing ? (clip.type === 'pattern' ? 'cursor-pointer' : 'cursor-move') : ''}`}
      style={{
        left: isDragging ? x + dragOffset.x : displayX,
        top: isDragging ? y + dragOffset.y : y,
        width: displayWidth,
        height,
        backgroundColor: clip.color,
        transition: isDragging || isResizing ? 'none' : 'left 0.05s ease-out, top 0.05s ease-out, width 0.05s ease-out',
      }}
      onClick={handleAltClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setSplitPreviewX(null)}
      onContextMenu={onContextMenu}
      title={clip.type === 'pattern' ? '🎹 Double-click to edit notes in Piano Roll' : undefined}
    >
      {/* Split preview line */}
      {splitPreviewX !== null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/70 pointer-events-none z-10"
          style={{ left: splitPreviewX }}
        />
      )}

      {/* Left resize handle */}
      <div
        className="resize-handle resize-handle-left absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:!bg-white/50 transition-opacity z-10"
        onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Right resize handle */}
      <div
        className="resize-handle resize-handle-right absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:!bg-white/50 transition-opacity z-10"
        onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Clip header with gradient */}
      <div className="px-2 py-1 bg-gradient-to-b from-black/30 to-transparent text-xs font-medium text-white truncate pointer-events-none">
        {name}
      </div>

      {/* Mini preview */}
      <div className="flex-1 px-1.5 pb-1 overflow-hidden pointer-events-none">
        {clip.type === 'pattern' && pattern && (
          <div className="h-full flex items-end gap-0.5">
            {pattern.stepEvents.slice(0, 16).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-white/40 rounded-sm"
                style={{ height: `${30 + Math.random() * 40}%` }}
              />
            ))}
          </div>
        )}
        {clip.type === 'audio' && (
          <div className="absolute inset-0 p-2 pointer-events-none flex items-center justify-center gap-0.5">
            {/* Simple waveform visualization bars */}
            {Array.from({ length: Math.floor(displayWidth / 4) }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 bg-white/50 rounded-sm"
                style={{
                  width: '2px',
                  height: `${30 + (Math.sin(i * 0.5) * 0.5 + 0.5) * 40}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Context Menu for Clips
function ClipContextMenu({
  x,
  y,
  clipId,
  clip,
  position,
  onSplit,
  onColorChange,
  onDelete,
  onDuplicate,
  onMute,
  onClose,
}: {
  x: number;
  y: number;
  clipId: string;
  clip: Clip | undefined;
  position: number;
  onSplit: (clipId: string, tick: number) => void;
  onColorChange: (clipId: string, color: string) => void;
  onDelete: (clipId: string) => void;
  onDuplicate: (clipId: string) => void;
  onMute: (clipId: string) => void;
  onClose: () => void;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!clip) return null;

  const canSplit = position > clip.startTick && position < clip.startTick + clip.durationTick;

  return (
    <div
      className="fixed bg-ps-bg-700 border border-ps-bg-500 rounded-lg shadow-xl z-50 py-1 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {canSplit && (
        <button
          className="w-full px-3 py-1.5 text-left text-sm hover:bg-ps-bg-600 flex items-center gap-2"
          onClick={() => onSplit(clipId, position)}
        >
          <span className="text-ps-text-muted">✂</span>
          Split at Playhead
          <span className="ml-auto text-xs text-ps-text-muted">S</span>
        </button>
      )}
      <button
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-ps-bg-600 flex items-center gap-2"
        onClick={() => onDuplicate(clipId)}
      >
        <span className="text-ps-text-muted">📋</span>
        Duplicate
        <span className="ml-auto text-xs text-ps-text-muted">Ctrl+D</span>
      </button>
      <button
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-ps-bg-600 flex items-center gap-2"
        onClick={() => onMute(clipId)}
      >
        <span className="text-ps-text-muted">{clip.mute ? '🔊' : '🔇'}</span>
        {clip.mute ? 'Unmute' : 'Mute'}
      </button>

      <div className="border-t border-ps-bg-500 my-1" />

      <div className="relative">
        <button
          className="w-full px-3 py-1.5 text-left text-sm hover:bg-ps-bg-600 flex items-center gap-2"
          onClick={() => setShowColorPicker(!showColorPicker)}
        >
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: clip.color }}
          />
          Change Color
          <span className="ml-auto">▸</span>
        </button>

        {showColorPicker && (
          <div className="absolute left-full top-0 ml-1 bg-ps-bg-700 border border-ps-bg-500 rounded-lg p-2 shadow-xl">
            <div className="grid grid-cols-4 gap-1">
              {CLIP_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded hover:ring-2 hover:ring-white/50 transition-all"
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChange(clipId, color)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-ps-bg-500 my-1" />

      <button
        className="w-full px-3 py-1.5 text-left text-sm hover:bg-ps-accent-red/20 text-ps-accent-red flex items-center gap-2"
        onClick={() => onDelete(clipId)}
      >
        <span>🗑</span>
        Delete
        <span className="ml-auto text-xs">Del</span>
      </button>
    </div>
  );
}

