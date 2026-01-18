'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '@/state/store';
import { ticksToPixels, pixelsToTicks } from '@/lib/utils/time';
import { midiToNoteName, isBlackKey, getNoteColor } from '@/lib/utils/music';
import type { Note, Pattern } from '@/domain/types';

const KEY_WIDTH = 70;
const KEY_HEIGHT = 32;
const TOTAL_KEYS = 88; // Piano range
const LOWEST_NOTE = 21; // A0
const PPQ = 96;

export default function PianoRoll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridContentRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrollInitialized, setIsScrollInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<Map<number, OscillatorNode>>(new Map());


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
    clearPatternNotes,
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

  // Initialize scroll position to center around C4 (MIDI note 60)
  useEffect(() => {
    if (containerRef.current && !isScrollInitialized) {
      const initialScrollTop = (60 - LOWEST_NOTE) * KEY_HEIGHT;
      containerRef.current.scrollTop = initialScrollTop;
      setScrollTop(initialScrollTop);
      setIsScrollInitialized(true);
    }
  }, [isScrollInitialized]);

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
  const getGridPosition = useCallback((e: React.MouseEvent) => {
    const gridContent = gridContentRef.current;
    if (!gridContent) return null;
    
    const gridRect = gridContent.getBoundingClientRect();
    const x = e.clientX - gridRect.left;
    
    // Try to get the pitch directly from the clicked grid row's data attribute
    // This is more reliable than coordinate calculations
    const target = e.target as HTMLElement | SVGElement;
    const gridRow = target.closest('.grid-row') as SVGRectElement | null;
    
    let pitch: number;
    if (gridRow && gridRow.dataset.note) {
      // Use the data attribute directly - most reliable
      pitch = parseInt(gridRow.dataset.note, 10);
    } else {
      // Fallback to coordinate calculation
      const y = e.clientY - gridRect.top;
      pitch = LOWEST_NOTE + TOTAL_KEYS - 1 - Math.floor(y / KEY_HEIGHT);
    }

    const tick = pixelsToTicks(x, pianoRollZoom, PPQ);

    // Snap to grid
    const snappedTick = snapToGrid ? Math.floor(tick / gridSize) * gridSize : tick;

    return {
      pitch: Math.max(0, Math.min(127, pitch)),
      tick: Math.max(0, snappedTick),
      x,
    };
  }, [pianoRollZoom, snapToGrid, gridSize]);

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

  // State for drag-and-drop from piano keyboard
  const [isDraggingKey, setIsDraggingKey] = useState(false);
  const [draggedNote, setDraggedNote] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<{ pitch: number; tick: number } | null>(null);

  // Handle drag over grid - allow drop and show preview
  const handleGridDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    
    // Calculate preview position for visual feedback
    const gridContent = gridContentRef.current;
    if (!gridContent) return;
    
    const gridRect = gridContent.getBoundingClientRect();
    const x = e.clientX - gridRect.left;
    const y = e.clientY - gridRect.top;
    
    // Calculate tick from X position
    const tick = pixelsToTicks(x, pianoRollZoom, PPQ);
    const snappedTick = snapToGrid ? Math.floor(tick / gridSize) * gridSize : tick;
    
    // Calculate pitch from Y position
    const rowIndex = Math.floor(y / KEY_HEIGHT);
    const pitch = LOWEST_NOTE + TOTAL_KEYS - 1 - rowIndex;
    const clampedPitch = Math.max(LOWEST_NOTE, Math.min(LOWEST_NOTE + TOTAL_KEYS - 1, pitch));
    
    setDragPreview({ pitch: clampedPitch, tick: Math.max(0, snappedTick) });
  }, [pianoRollZoom, snapToGrid, gridSize]);

  // Handle drop on grid - create note at drop position
  const handleGridDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!selectedPattern) return;
      
      // Check if this is a piano key drag
      const noteData = e.dataTransfer.getData('text/plain');
      console.log('[PianoRoll] Drop received, data:', noteData);
      
      if (!noteData || !noteData.startsWith('piano-note:')) return;
      
      // Calculate position from drop location on the grid
      const gridContent = gridContentRef.current;
      if (!gridContent) return;
      
      const gridRect = gridContent.getBoundingClientRect();
      const x = e.clientX - gridRect.left;
      const y = e.clientY - gridRect.top;
      
      // Calculate tick from X position
      const tick = pixelsToTicks(x, pianoRollZoom, PPQ);
      
      // Calculate pitch from Y position - this is where the note should be placed
      // Y=0 is the top (highest note), Y=gridHeight is the bottom (lowest note)
      const rowIndex = Math.floor(y / KEY_HEIGHT);
      const pitch = LOWEST_NOTE + TOTAL_KEYS - 1 - rowIndex;
      const clampedPitch = Math.max(LOWEST_NOTE, Math.min(LOWEST_NOTE + TOTAL_KEYS - 1, pitch));
      
      // Snap tick to grid
      const snappedTick = snapToGrid ? Math.floor(tick / gridSize) * gridSize : tick;
      
      // Play preview sound
      playPreviewNote(clampedPitch);
      
      // Create the note at the drop position
      console.log('[PianoRoll] Dropping note at pitch:', clampedPitch, 'tick:', snappedTick, 'rowIndex:', rowIndex);
      addNote(selectedPattern.id, {
        pitch: clampedPitch,
        startTick: Math.max(0, snappedTick),
        durationTick: gridSize,
        velocity: 100,
      });
      
      setIsDraggingKey(false);
      setDraggedNote(null);
      setDragPreview(null);
    },
    [selectedPattern, pianoRollZoom, snapToGrid, gridSize, playPreviewNote, addNote]
  );

  // Callback for when piano key drag starts
  const handlePianoKeyDragStart = useCallback((midiNote: number, _e: React.DragEvent) => {
    // Data is set in PianoKeyboard component directly
    setIsDraggingKey(true);
    setDraggedNote(midiNote);
    setDragPreview(null);
    playPreviewNote(midiNote);
  }, [playPreviewNote]);

  // Callback for when piano key drag ends
  const handlePianoKeyDragEnd = useCallback(() => {
    setIsDraggingKey(false);
    setDraggedNote(null);
    setDragPreview(null);
  }, []);

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

  // Handle piano key click - only play preview sound (drag to grid to add notes)
  const handlePianoKeyClick = useCallback(
    (midiNote: number) => {
      playPreviewNote(midiNote);
    },
    [playPreviewNote]
  );

  // Handle clear all notes
  const handleClearAllNotes = useCallback(() => {
    if (selectedPattern && notes.length > 0) {
      if (confirm(`Clear all ${notes.length} notes from this pattern?`)) {
        clearPatternNotes(selectedPattern.id);
        setSelection(null);
      }
    }
  }, [selectedPattern, notes.length, clearPatternNotes, setSelection]);

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
      {/* Toolbar */}
      <div className="h-8 bg-ps-bg-700 border-b border-ps-bg-600 flex items-center px-3 gap-3 shrink-0">
        <span className="text-xs text-ps-text-secondary">
          Pattern: <span className="text-ps-text-primary font-medium">{selectedPattern.name}</span>
        </span>
        <span className="text-xs text-ps-text-muted">|</span>
        <span className="text-xs text-ps-text-muted">
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-ps-text-muted">|</span>
        <span className="text-xs text-ps-accent-primary/70">
          🎹 Drag keys from keyboard → drop on grid
        </span>
        <div className="flex-1" />
        <button
          onClick={handleClearAllNotes}
          disabled={notes.length === 0}
          className="px-2 py-1 text-xs bg-ps-bg-600 hover:bg-red-600/30 hover:text-red-400 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Clear all notes from this pattern"
        >
          Clear All Notes
        </button>
      </div>

      {/* Warning bar if pattern not in playlist */}
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
        {/* Piano keyboard - drag keys from here */}
        <div
          className="shrink-0 overflow-hidden border-r border-ps-bg-600"
          style={{ width: KEY_WIDTH, marginTop: -scrollTop }}
        >
          <PianoKeyboard 
            height={gridHeight} 
            onKeyClick={handlePianoKeyClick}
            onKeyDragStart={handlePianoKeyDragStart}
            onKeyDragEnd={handlePianoKeyDragEnd}
          />
        </div>

        {/* Note grid - drop notes here */}
        <div
          ref={containerRef}
          className={`flex-1 overflow-auto relative ${isDraggingKey ? 'bg-ps-accent-primary/5' : ''}`}
          onScroll={handleScroll}
          onDragOver={handleGridDragOver}
          onDrop={handleGridDrop}
        >
          <div
            ref={gridContentRef}
            className="relative"
            style={{ width: gridWidth, height: gridHeight }}
            onDragOver={handleGridDragOver}
            onDrop={handleGridDrop}
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

            {/* Ghost preview note while dragging from keyboard - snaps to discrete grid positions */}
            {isDraggingKey && dragPreview && (
              <div
                className="absolute note pointer-events-none z-20 border-2 border-white/50"
                style={{
                  left: ticksToPixels(dragPreview.tick, pianoRollZoom, PPQ),
                  top: (LOWEST_NOTE + TOTAL_KEYS - 1 - dragPreview.pitch) * KEY_HEIGHT + 2,
                  width: Math.max(12, ticksToPixels(gridSize, pianoRollZoom, PPQ) - 2),
                  height: KEY_HEIGHT - 4,
                  backgroundColor: getNoteColor(dragPreview.pitch),
                  opacity: 0.8,
                }}
              >
                <span className="text-xs text-white px-1 truncate pointer-events-none font-medium leading-tight">
                  {midiToNoteName(dragPreview.pitch)}
                </span>
              </div>
            )}

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

// Piano keyboard - supports drag-to-grid
function PianoKeyboard({
  height,
  onKeyClick,
  onKeyDragStart,
  onKeyDragEnd,
}: {
  height: number;
  onKeyClick: (note: number) => void;
  onKeyDragStart?: (note: number, e: React.DragEvent) => void;
  onKeyDragEnd?: () => void;
}) {
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const [draggingKey, setDraggingKey] = useState<number | null>(null);

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

  const handleDragStart = useCallback((note: number, e: React.DragEvent) => {
    // Set data FIRST before anything else - this must happen synchronously in dragstart
    e.dataTransfer.setData('text/plain', `piano-note:${note}`);
    e.dataTransfer.effectAllowed = 'copyMove';
    
    setDraggingKey(note);
    onKeyDragStart?.(note, e);
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = midiToNoteName(note);
    dragImage.style.cssText = 'position:absolute;left:-1000px;padding:4px 8px;background:#ff6b35;color:white;border-radius:4px;font-size:12px;font-weight:bold;';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 10);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    console.log('[PianoKeyboard] Drag started for note:', note);
  }, [onKeyDragStart]);

  const handleDragEnd = useCallback(() => {
    setDraggingKey(null);
    onKeyDragEnd?.();
  }, [onKeyDragEnd]);

  return (
    <div className="relative" style={{ height }}>
      {Array.from({ length: TOTAL_KEYS }).map((_, i) => {
        const note = LOWEST_NOTE + TOTAL_KEYS - 1 - i;
        const black = isBlackKey(note);
        const isC = note % 12 === 0;
        const isActive = activeKeys.has(note);
        const isDragging = draggingKey === note;

        return (
          <div
            key={note}
            draggable
            className={`piano-key ${black ? 'piano-key-black' : 'piano-key-white'
              } ${isActive ? 'piano-key-active' : ''} ${isDragging ? 'opacity-50' : ''} flex items-center justify-end pr-1 cursor-grab active:cursor-grabbing`}
            style={{
              height: KEY_HEIGHT,
              width: black ? KEY_WIDTH * 0.7 : KEY_WIDTH,
            }}
            onMouseDown={() => handleKeyDown(note)}
            onMouseUp={() => handleKeyUp(note)}
            onMouseLeave={() => handleKeyUp(note)}
            onDragStart={(e) => handleDragStart(note, e)}
            onDragEnd={handleDragEnd}
          >
            <span 
              className={`text-xs pointer-events-none font-medium ${
                black 
                  ? 'text-white/80' 
                  : isC 
                    ? 'text-ps-accent-primary font-bold' 
                    : 'text-ps-text-muted'
              }`}
            >
              {midiToNoteName(note)}
            </span>
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
    <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
      {/* Horizontal key lines */}
      {Array.from({ length: totalKeys }).map((_, i) => {
        const note = LOWEST_NOTE + totalKeys - 1 - i;
        const black = isBlackKey(note);

        return (
          <rect
            key={`key-${i}`}
            data-note={note}
            data-row={i}
            className="grid-row"
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
  const width = Math.max(12, ticksToPixels(note.durationTick, zoom, ppq) - 2);
  const y = (lowestNote + totalKeys - 1 - note.pitch) * keyHeight + 2;
  const height = keyHeight - 4;

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
    ? Math.max(12, width + ticksToPixels(resizeOffset, zoom, ppq))
    : isResizing === 'left'
      ? Math.max(12, width - ticksToPixels(resizeOffset, zoom, ppq))
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
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Note name if wide enough */}
      {width > 24 && (
        <span className="text-xs text-white px-1 truncate pointer-events-none font-medium leading-tight">
          {midiToNoteName(note.pitch)}
        </span>
      )}
    </div>
  );
}

// Velocity lane


