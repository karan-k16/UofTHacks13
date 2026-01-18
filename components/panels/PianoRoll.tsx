'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '@/state/store';
import { ticksToPixels, pixelsToTicks } from '@/lib/utils/time';
import { midiToNoteName, isBlackKey, getNoteColor } from '@/lib/utils/music';
import type { Note, Pattern } from '@/domain/types';

const KEY_WIDTH = 48;
const KEY_HEIGHT = 14;
const TOTAL_KEYS = 88; // Piano range
const LOWEST_NOTE = 21; // A0
const PPQ = 96;

export default function PianoRoll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState((60 - LOWEST_NOTE) * KEY_HEIGHT); // Start at C4
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<Map<number, OscillatorNode>>(new Map());

  // State for note creation (click-drag to create)
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const creatingNoteStart = useRef<{ x: number; tick: number; pitch: number } | null>(null);
  const creatingNoteId = useRef<string | null>(null);

  const {
    project,
    selectedPatternId,
    pianoRollZoom,
    position,
    addNote,
    deleteNote,
    updateNote,
    moveNotes,
    resizeNotes,
    selection,
    setSelection,
    selectedChannelId,
    snapToGrid,
    setPosition,
  } = useStore();

  // ... (audio context effect kept as is)

  // ... (other internal logic)




  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      // Clean up oscillators
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Ignore if already stopped
        }
      });
      oscillatorsRef.current.clear();
    };
  }, []);

  const patterns = project?.patterns ?? [];
  const selectedPattern = patterns.find((p) => p.id === selectedPatternId);
  const notes = selectedPattern?.notes ?? [];

  // Calculate grid dimensions
  const patternLengthTicks = selectedPattern
    ? (selectedPattern.lengthInSteps / selectedPattern.stepsPerBeat) * PPQ
    : PPQ * 4;
  const gridWidth = ticksToPixels(patternLengthTicks, pianoRollZoom, PPQ) + 200;
  const gridHeight = TOTAL_KEYS * KEY_HEIGHT;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollLeft(target.scrollLeft);
    setScrollTop(target.scrollTop);
  }, []);

  // Grid size for snapping
  const gridSize = PPQ / 4; // 16th notes

  // Calculate note position from mouse event
  const getGridPosition = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = (e as React.MouseEvent).clientX - rect.left + scrollLeft;
    const y = (e as React.MouseEvent).clientY - rect.top + scrollTop;

    const pitch = LOWEST_NOTE + TOTAL_KEYS - 1 - Math.floor(y / KEY_HEIGHT);
    const tick = pixelsToTicks(x, pianoRollZoom, PPQ);

    // Snap to grid
    const snappedTick = snapToGrid ? Math.floor(tick / gridSize) * gridSize : tick;

    return {
      pitch: Math.max(0, Math.min(127, pitch)),
      tick: Math.max(0, snappedTick),
      x,
    };
  }, [scrollLeft, scrollTop, pianoRollZoom, snapToGrid, gridSize]);

  // Play preview sound (used when clicking grid or piano keys)
  const playPreviewNote = useCallback((midiNote: number) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

    // Stop existing oscillator for this note
    const existingOsc = oscillatorsRef.current.get(midiNote);
    if (existingOsc) {
      try { existingOsc.stop(); } catch (e) { /* ignore */ }
      oscillatorsRef.current.delete(midiNote);
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    oscillatorsRef.current.set(midiNote, oscillator);
    oscillator.onended = () => oscillatorsRef.current.delete(midiNote);
  }, []);

  // Handle mouse down on grid - start creating note
  const handleGridMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle left click
      if (e.button !== 0) return;

      // Don't create note if clicking on an existing note
      const target = e.target as HTMLElement;
      if (target.closest('.note')) return;

      if (!selectedPattern) return;

      const pos = getGridPosition(e);
      if (!pos) return;

      // Play preview sound
      playPreviewNote(pos.pitch);

      // Create the note
      console.log('Adding note at', pos);
      const newNoteId = addNote(selectedPattern.id, {
        pitch: pos.pitch,
        startTick: pos.tick,
        durationTick: gridSize,
        velocity: 100,
      });

      console.log('Added note ID:', newNoteId);

      // Track that we're creating this note by its ID
      setIsCreatingNote(true);
      creatingNoteStart.current = { x: pos.x, tick: pos.tick, pitch: pos.pitch };
      creatingNoteId.current = newNoteId || null;

      e.preventDefault();
    },
    [selectedPattern, getGridPosition, addNote, gridSize, playPreviewNote]
  );

  // Handle mouse move while creating note - extend duration
  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isCreatingNote || !creatingNoteStart.current || !selectedPattern || !creatingNoteId.current) return;

      const pos = getGridPosition(e);
      if (!pos) return;

      // Calculate new duration based on drag distance
      const deltaTick = pos.tick - creatingNoteStart.current.tick;
      const newDuration = Math.max(gridSize, deltaTick + gridSize); // Wait, logic check below

      // Resize the note
      // Logic fix: deltaTick is (current - start). If I drag 1 grid unit right, delta is gridSize.
      // Assuming start duration was gridSize?

      // Standard behavior: duration = max(gridSize, currentTick - startTick)
      // Actually, if we start at X and drag to X+d, duration should cover from X to X+d.
      const exactDuration = Math.max(gridSize, pos.tick - creatingNoteStart.current.tick);

      resizeNotes(selectedPattern.id, [creatingNoteId.current], exactDuration);
    },
    [isCreatingNote, selectedPattern, getGridPosition, gridSize, resizeNotes]
  );

  // Handle mouse up - finish creating note
  const handleGridMouseUp = useCallback(() => {
    if (isCreatingNote) {
      console.log('Finished creating note');
      setIsCreatingNote(false);
      creatingNoteStart.current = null;
      creatingNoteId.current = null;
    }
  }, [isCreatingNote]);

  // Global mouse up handler (in case mouse leaves the grid)
  useEffect(() => {
    if (isCreatingNote) {
      const handleGlobalMouseUp = () => {
        setIsCreatingNote(false);
        creatingNoteStart.current = null;
      };
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
    return undefined;
  }, [isCreatingNote]);

  // Handle note click
  const handleNoteClick = useCallback(
    (noteId: string, ctrlKey: boolean) => {
      if (ctrlKey && selection && selection.type === 'notes') {
        // Toggle selection
        const isCurrentlySelected = selection.ids.includes(noteId);
        const newIds = isCurrentlySelected
          ? selection.ids.filter(id => id !== noteId)
          : [...selection.ids, noteId];
        setSelection(newIds.length > 0 ? { type: 'notes', ids: newIds } : null);
      } else {
        // Single selection
        setSelection({ type: 'notes', ids: [noteId] });
      }
    },
    [selection, setSelection]
  );

  // Handle note delete
  const handleNoteDelete = useCallback(
    (noteId: string) => {
      if (selectedPattern) {
        // Delete all selected notes if this note is selected
        if (selection && selection.type === 'notes' && selection.ids.includes(noteId)) {
          selection.ids.forEach(id => deleteNote(selectedPattern.id, id));
          setSelection(null);
        } else {
          deleteNote(selectedPattern.id, noteId);
        }
      }
    },
    [selectedPattern, selection, deleteNote, setSelection]
  );

  // Handle piano key click - only play preview sound (notes are created by clicking grid)
  const handlePianoKeyClick = useCallback(
    (midiNote: number) => {
      playPreviewNote(midiNote);
    },
    [playPreviewNote]
  );

  if (!selectedPattern) {
    return (
      <div
        className="h-full flex items-center justify-center text-ps-text-muted text-sm"
        data-panel="pianoRoll"
      >
        Select a pattern to edit notes
      </div>
    );
  }

  // Check if pattern has clips in playlist
  const patternHasClips = project?.playlist.clips.some(
    (clip) => clip.type === 'pattern' && clip.patternId === selectedPatternId
  );

  // Cursor position
  const cursorX = ticksToPixels(position, pianoRollZoom, PPQ);

  return (
    <div className="h-full flex flex-col" data-panel="pianoRoll">
      {/* Top info bar */}
      {!patternHasClips && (
        <div className="h-7 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center px-3 text-xs text-yellow-400 shrink-0">
          <span className="mr-2">⚠</span>
          <span>Pattern not in Playlist - Go to Playlist and double-click to add this pattern, then press Play</span>
        </div>
      )}

      {/* Timeline header */}
      <div className="h-6 flex border-b border-ps-bg-600 shrink-0">
        {/* Corner */}
        <div
          className="shrink-0 bg-ps-bg-700 border-r border-ps-bg-600"
          style={{ width: KEY_WIDTH }}
        />

        {/* Timeline ruler */}
        <div
          className="flex-1 overflow-hidden relative bg-ps-bg-700"
          style={{ marginLeft: -scrollLeft }}
        >
          <PianoRollRuler
            width={gridWidth}
            zoom={pianoRollZoom}
            ppq={PPQ}
            patternLength={patternLengthTicks}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Piano keyboard */}
        <div
          className="shrink-0 overflow-hidden border-r border-ps-bg-600"
          style={{ width: KEY_WIDTH, marginTop: -scrollTop }}
        >
          <PianoKeyboard height={gridHeight} onKeyClick={handlePianoKeyClick} />
        </div>

        {/* Note grid */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto relative"
          onScroll={handleScroll}
          onMouseDown={handleGridMouseDown}
          onMouseMove={handleGridMouseMove}
          onMouseUp={handleGridMouseUp}
        >
          <div
            className="relative"
            style={{ width: gridWidth, height: gridHeight }}
          >
            {/* Grid */}
            <PianoRollGrid
              width={gridWidth}
              height={gridHeight}
              zoom={pianoRollZoom}
              ppq={PPQ}
              keyHeight={KEY_HEIGHT}
              totalKeys={TOTAL_KEYS}
              patternLength={patternLengthTicks}
            />

            {/* Notes */}
            {notes.map((note) => (
              <NoteBlock
                key={note.id}
                note={note}
                zoom={pianoRollZoom}
                ppq={PPQ}
                keyHeight={KEY_HEIGHT}
                lowestNote={LOWEST_NOTE}
                totalKeys={TOTAL_KEYS}
                isSelected={selection != null && selection.type === 'notes' && selection.ids.includes(note.id)}
                onClick={(ctrlKey) => handleNoteClick(note.id, ctrlKey)}
                onDelete={() => handleNoteDelete(note.id)}
                patternId={selectedPattern.id}
                snapToGrid={snapToGrid}
              />
            ))}

            {/* Playhead cursor */}
            <div
              className="absolute top-0 bottom-0 w-px bg-ps-accent-primary pointer-events-none z-10"
              style={{ left: cursorX }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Piano roll ruler
function PianoRollRuler({
  width,
  zoom,
  ppq,
  patternLength,
}: {
  width: number;
  zoom: number;
  ppq: number;
  patternLength: number;
}) {
  const beats: { beat: number; x: number; isBar: boolean }[] = [];
  const ticksPerBeat = ppq;
  const totalBeats = Math.ceil(patternLength / ticksPerBeat);

  for (let i = 0; i <= totalBeats; i++) {
    beats.push({
      beat: i + 1,
      x: ticksToPixels(i * ticksPerBeat, zoom, ppq),
      isBar: i % 4 === 0,
    });
  }

  return (
    <div className="relative h-full" style={{ width }}>
      {beats.map(({ beat, x, isBar }) => (
        <div
          key={beat}
          className={`absolute top-0 h-full text-2xs ${isBar ? 'text-ps-text-secondary' : 'text-ps-text-muted'
            }`}
          style={{ left: x }}
        >
          {isBar && <span className="ml-1">{Math.ceil(beat / 4)}</span>}
        </div>
      ))}
    </div>
  );
}

// Piano keyboard
function PianoKeyboard({
  height,
  onKeyClick,
}: {
  height: number;
  onKeyClick: (note: number) => void;
}) {
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());

  const handleKeyDown = useCallback((note: number) => {
    setActiveKeys(prev => new Set(prev).add(note));
    onKeyClick(note);
  }, [onKeyClick]);

  const handleKeyUp = useCallback((note: number) => {
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }, []);

  return (
    <div className="relative" style={{ height }}>
      {Array.from({ length: TOTAL_KEYS }).map((_, i) => {
        const note = LOWEST_NOTE + TOTAL_KEYS - 1 - i;
        const black = isBlackKey(note);
        const isC = note % 12 === 0;
        const isActive = activeKeys.has(note);

        return (
          <div
            key={note}
            className={`piano-key ${black ? 'piano-key-black' : 'piano-key-white'
              } ${isActive ? 'piano-key-active' : ''} flex items-center justify-end pr-1`}
            style={{
              height: KEY_HEIGHT,
              width: black ? KEY_WIDTH * 0.7 : KEY_WIDTH,
            }}
            onMouseDown={() => handleKeyDown(note)}
            onMouseUp={() => handleKeyUp(note)}
            onMouseLeave={() => handleKeyUp(note)}
          >
            {isC && (
              <span className="text-2xs text-ps-text-muted pointer-events-none">
                {midiToNoteName(note)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Piano roll grid
function PianoRollGrid({
  width,
  height,
  zoom,
  ppq,
  keyHeight,
  totalKeys,
  patternLength,
}: {
  width: number;
  height: number;
  zoom: number;
  ppq: number;
  keyHeight: number;
  totalKeys: number;
  patternLength: number;
}) {
  return (
    <svg className="absolute inset-0" width={width} height={height}>
      {/* Horizontal key lines */}
      {Array.from({ length: totalKeys }).map((_, i) => {
        const note = LOWEST_NOTE + totalKeys - 1 - i;
        const black = isBlackKey(note);

        return (
          <rect
            key={`key-${i}`}
            x={0}
            y={i * keyHeight}
            width={width}
            height={keyHeight}
            fill={black ? 'var(--ps-bg-900)' : 'var(--ps-bg-800)'}
          />
        );
      })}

      {/* Vertical beat lines */}
      {(() => {
        const lines: JSX.Element[] = [];
        const gridSize = ppq / 4; // 16th notes

        for (let tick = 0; tick <= patternLength; tick += gridSize) {
          const x = ticksToPixels(tick, zoom, ppq);
          const isBeat = tick % ppq === 0;
          const isBar = tick % (ppq * 4) === 0;

          lines.push(
            <line
              key={`grid-${tick}`}
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke={
                isBar
                  ? 'var(--ps-grid-bar)'
                  : isBeat
                    ? 'var(--ps-grid-beat)'
                    : 'var(--ps-grid-line)'
              }
              strokeWidth={isBar ? 1 : 0.5}
            />
          );
        }
        return lines;
      })()}
    </svg>
  );
}

// Note block
function NoteBlock({
  note,
  zoom,
  ppq,
  keyHeight,
  lowestNote,
  totalKeys,
  isSelected,
  onClick,
  onDelete,
  patternId,
  snapToGrid,
}: {
  note: Note;
  zoom: number;
  ppq: number;
  keyHeight: number;
  lowestNote: number;
  totalKeys: number;
  isSelected: boolean;
  onClick: (ctrlKey: boolean) => void;
  onDelete: () => void;
  patternId: string;
  snapToGrid: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [resizeOffset, setResizeOffset] = useState(0);
  const dragStartPos = useRef({
    x: 0,
    y: 0,
    startTick: 0,
    pitch: 0,
    duration: 0,
  });

  const { moveNotes, resizeNotes } = useStore();

  const x = ticksToPixels(note.startTick, zoom, ppq);
  const width = Math.max(4, ticksToPixels(note.durationTick, zoom, ppq) - 1);
  const y = (lowestNote + totalKeys - 1 - note.pitch) * keyHeight + 1;
  const height = keyHeight - 2;

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, edge: 'left' | 'right') => {
      e.stopPropagation();
      e.preventDefault();
      onClick(e.ctrlKey || e.metaKey);

      setIsResizing(edge);
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        startTick: note.startTick,
        pitch: note.pitch,
        duration: note.durationTick,
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
          const gridSize = ppq / 4; // 16th note grid
          finalDeltaTicks = Math.round(deltaTicks / gridSize) * gridSize;
        }

        if (edge === 'right') {
          // Resize from right: change duration
          const newDuration = Math.max(ppq / 4, dragStartPos.current.duration + finalDeltaTicks);
          resizeNotes(patternId, [note.id], newDuration);
        } else {
          // Resize from left: change start position and duration
          const newStartTick = Math.max(0, dragStartPos.current.startTick + finalDeltaTicks);
          const tickChange = newStartTick - dragStartPos.current.startTick;
          const newDuration = Math.max(ppq / 4, dragStartPos.current.duration - tickChange);

          // Move the note first, then resize
          moveNotes(patternId, [note.id], 0, tickChange);
          resizeNotes(patternId, [note.id], newDuration);
        }

        setIsResizing(null);
        setResizeOffset(0);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [note.id, note.startTick, note.pitch, note.durationTick, zoom, ppq, snapToGrid, onClick, moveNotes, resizeNotes, patternId]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (isResizing) {
        e.preventDefault();
        return;
      }

      e.stopPropagation();
      onClick(e.ctrlKey || e.metaKey);
      setIsDragging(true);

      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        startTick: note.startTick,
        pitch: note.pitch,
        duration: note.durationTick,
      };

      // Set invisible drag image
      const dragImage = document.createElement('div');
      dragImage.style.opacity = '0';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', note.id);
    },
    [note.id, note.startTick, note.pitch, note.durationTick, onClick, isResizing]
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      if (e.clientX === 0 && e.clientY === 0) return;

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

      // Calculate time delta in ticks
      const deltaPixels = deltaX;
      const deltaTicks = pixelsToTicks(Math.abs(deltaPixels), zoom, ppq) * Math.sign(deltaPixels);

      // Calculate pitch delta
      const pitchDelta = -Math.round(deltaY / keyHeight);

      // Snap to grid if enabled
      let finalDeltaTicks = deltaTicks;
      if (snapToGrid) {
        const gridSize = ppq / 4; // 16th notes
        const newTick = dragStartPos.current.startTick + deltaTicks;
        const snappedTick = Math.round(newTick / gridSize) * gridSize;
        finalDeltaTicks = snappedTick - dragStartPos.current.startTick;
      }

      // Only update if actually moved
      if (Math.abs(finalDeltaTicks) > 1 || pitchDelta !== 0) {
        moveNotes(patternId, [note.id], pitchDelta, finalDeltaTicks);
      }
    },
    [note.id, zoom, ppq, keyHeight, snapToGrid, moveNotes, patternId]
  );

  const displayWidth = isResizing === 'right'
    ? Math.max(4, width + ticksToPixels(resizeOffset, zoom, ppq))
    : isResizing === 'left'
      ? Math.max(4, width - ticksToPixels(resizeOffset, zoom, ppq))
      : width;

  const displayX = isResizing === 'left' ? x + ticksToPixels(resizeOffset, zoom, ppq) : x;

  return (
    <div
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className={`absolute note group ${isSelected ? 'note-selected' : ''} ${isDragging ? 'opacity-50' : ''
        } ${!isResizing ? 'cursor-move' : ''}`}
      style={{
        left: isDragging ? x + dragOffset.x : displayX,
        top: isDragging ? y + dragOffset.y : y,
        width: displayWidth,
        height,
        backgroundColor: getNoteColor(note.pitch),
        opacity: 0.5 + (note.velocity / 127) * 0.5,
        transition: isDragging || isResizing ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out, width 0.1s ease-out',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e.ctrlKey || e.metaKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Note name if wide enough */}
      {width > 30 && (
        <span className="text-2xs text-white px-1 truncate pointer-events-none">
          {midiToNoteName(note.pitch)}
        </span>
      )}
    </div>
  );
}

// Velocity lane


