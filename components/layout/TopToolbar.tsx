'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/state/store';
import Transport from '@/components/transport/Transport';
import Dropdown from '@/components/common/Dropdown';
import KeyboardShortcutsModal from '@/components/common/KeyboardShortcutsModal';
import ExportDialog from '@/components/common/ExportDialog';

export default function TopToolbar() {
  const {
    project,
    hasUnsavedChanges,
    setBpm,
    undo,
    redo,
    canUndo,
    canRedo,
    toggleMetronome,
    metronomeEnabled,
    createNewProject,
    loadDemoProject,
    markSaved,
    playlistZoom,
    pianoRollZoom,
    setPlaylistZoom,
    setPianoRollZoom,
    updateProjectName,
  } = useStore();

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Listen for global shortcuts
  useEffect(() => {
    const handleShowShortcuts = () => setShowShortcuts(true);
    const handleExport = () => setShowExport(true);

    window.addEventListener('pulse-studio-show-shortcuts', handleShowShortcuts);
    window.addEventListener('pulse-studio-export', handleExport);

    return () => {
      window.removeEventListener('pulse-studio-show-shortcuts', handleShowShortcuts);
      window.removeEventListener('pulse-studio-export', handleExport);
    };
  }, []);

  // File Menu Items
  const fileMenuItems = [
    {
      label: 'New Project',
      onClick: () => {
        if (hasUnsavedChanges) {
          if (confirm('You have unsaved changes. Create new project?')) {
            createNewProject('Untitled Project', 'user-id');
          }
        } else {
          createNewProject('Untitled Project', 'user-id');
        }
      },
      shortcut: 'Ctrl+N',
    },
    {
      label: 'Load Demo Project',
      onClick: () => {
        if (hasUnsavedChanges) {
          if (confirm('You have unsaved changes. Load demo project?')) {
            loadDemoProject('demo-user-id');
          }
        } else {
          loadDemoProject('demo-user-id');
        }
      },
    },
    { label: '', onClick: () => { }, divider: true },
    {
      label: 'Save Project',
      onClick: () => {
        // In a real app, this would save to Supabase
        markSaved();
        alert('Project saved! (Supabase integration coming soon)');
      },
      shortcut: 'Ctrl+S',
      disabled: !hasUnsavedChanges,
    },
    {
      label: 'Save As...',
      onClick: () => {
        const newName = prompt('Enter new project name:', project?.name || 'Untitled Project');
        if (newName && newName.trim()) {
          // Update the project name and mark as saved
          const { updateProjectName, markSaved } = useStore.getState();
          updateProjectName(newName.trim());
          markSaved();
          alert(`Project saved as "${newName.trim()}"! (Supabase integration coming soon)`);
        }
      },
      disabled: false,
    },
    { label: '', onClick: () => { }, divider: true },
    {
      label: 'Export Audio',
      onClick: () => {
        setShowExport(true);
      },
      shortcut: 'Ctrl+E',
    },
  ];

  // Edit Menu Items
  const editMenuItems = [
    {
      label: 'Undo',
      onClick: () => undo(),
      shortcut: 'Ctrl+Z',
      disabled: !canUndo(),
    },
    {
      label: 'Redo',
      onClick: () => redo(),
      shortcut: 'Ctrl+Shift+Z',
      disabled: !canRedo(),
    },
    { label: '', onClick: () => { }, divider: true },
    {
      label: 'Cut',
      onClick: () => alert('Cut feature coming soon!'),
      shortcut: 'Ctrl+X',
      disabled: true,
    },
    {
      label: 'Copy',
      onClick: () => alert('Copy feature coming soon!'),
      shortcut: 'Ctrl+C',
      disabled: true,
    },
    {
      label: 'Paste',
      onClick: () => alert('Paste feature coming soon!'),
      shortcut: 'Ctrl+V',
      disabled: true,
    },
    { label: '', onClick: () => { }, divider: true },
    {
      label: 'Select All',
      onClick: () => alert('Select All feature coming soon!'),
      shortcut: 'Ctrl+A',
      disabled: true,
    },
    {
      label: 'Delete',
      onClick: () => alert('Delete feature coming soon!'),
      shortcut: 'Del',
      disabled: true,
    },
  ];

  // View Menu Items
  const viewMenuItems = [
    {
      label: metronomeEnabled ? '✓ Metronome' : 'Metronome',
      onClick: () => toggleMetronome(),
      shortcut: 'M',
    },
    { label: '', onClick: () => { }, divider: true },
    {
      label: 'Zoom In Playlist',
      onClick: () => setPlaylistZoom(Math.min(4, playlistZoom * 1.2)),
      shortcut: 'Ctrl++',
    },
    {
      label: 'Zoom Out Playlist',
      onClick: () => setPlaylistZoom(Math.max(0.1, playlistZoom / 1.2)),
      shortcut: 'Ctrl+-',
    },
    {
      label: 'Reset Playlist Zoom',
      onClick: () => setPlaylistZoom(1),
      shortcut: 'Ctrl+0',
    },
    { label: '', onClick: () => { }, divider: true },
    {
      label: 'Zoom In Piano Roll',
      onClick: () => setPianoRollZoom(Math.min(4, pianoRollZoom * 1.2)),
    },
    {
      label: 'Zoom Out Piano Roll',
      onClick: () => setPianoRollZoom(Math.max(0.1, pianoRollZoom / 1.2)),
    },
    {
      label: 'Reset Piano Roll Zoom',
      onClick: () => setPianoRollZoom(1),
    },
  ];

  // Help Menu Items
  const helpMenuItems = [
    {
      label: 'Keyboard Shortcuts',
      onClick: () => setShowShortcuts(true),
      shortcut: '?',
    },
    { label: '', onClick: () => { }, divider: true },
    {
      label: 'About Pulse Studio',
      onClick: () => setShowAbout(true),
    },
    {
      label: 'Documentation',
      onClick: () => {
        window.open('https://github.com/karan-k16/UofTHacks13/blob/main/README.md', '_blank');
      },
    },
  ];

  return (
    <>
      <div className="h-12 bg-ps-bg-800 border-b border-ps-bg-600 flex items-center px-4 gap-4 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg
            className="w-6 h-6"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="40" stroke="#ff6b35" strokeWidth="4" />
            <circle cx="50" cy="50" r="20" fill="#ff6b35" />
          </svg>
          <span className="font-bold text-sm text-ps-accent-primary">PULSE</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-ps-bg-600" />

        {/* File Menu */}
        <div className="flex items-center gap-1">
          <Dropdown
            trigger={<button className="btn btn-ghost text-xs">File</button>}
            items={fileMenuItems}
          />
          <Dropdown
            trigger={<button className="btn btn-ghost text-xs">Edit</button>}
            items={editMenuItems}
          />
          <Dropdown
            trigger={<button className="btn btn-ghost text-xs">View</button>}
            items={viewMenuItems}
          />
          <Dropdown
            trigger={<button className="btn btn-ghost text-xs">Help</button>}
            items={helpMenuItems}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-ps-bg-600" />

        {/* Project Name */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ps-text-secondary">Project:</span>
          <span 
            className="text-xs font-medium text-ps-text-primary cursor-pointer hover:text-ps-accent-primary transition-colors px-1 py-0.5 rounded hover:bg-ps-bg-700"
            onClick={() => {
              const newName = prompt('Enter new project name:', project?.name || 'Untitled');
              if (newName && newName.trim()) {
                updateProjectName(newName.trim());
              }
            }}
            title="Click to rename project"
          >
            {project?.name ?? 'Untitled'}
          </span>
          {hasUnsavedChanges && (
            <span className="text-xs text-ps-accent-tertiary">*</span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Transport */}
        <Transport />

        {/* Spacer */}
        <div className="flex-1" />

        {/* BPM */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ps-text-secondary">BPM</span>
          <input
            type="number"
            value={project?.bpm ?? 120}
            onChange={(e) => setBpm(parseInt(e.target.value, 10) || 120)}
            className="w-14 text-center font-mono"
            min={20}
            max={999}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-ps-bg-600" />

        {/* Tools */}
        <div className="flex items-center gap-1">
          <button
            className={`btn btn-icon ${canUndo() ? 'btn-ghost' : 'btn-ghost opacity-50 cursor-not-allowed'}`}
            onClick={() => canUndo() && undo()}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            className={`btn btn-icon ${canRedo() ? 'btn-ghost' : 'btn-ghost opacity-50 cursor-not-allowed'}`}
            onClick={() => canRedo() && redo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="w-px h-4 bg-ps-bg-600 mx-1" />

          <button
            className={`btn btn-icon ${metronomeEnabled ? 'btn-primary' : 'btn-ghost'}`}
            onClick={toggleMetronome}
            title="Metronome (M)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modals */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* About Modal */}
      {showAbout && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="bg-ps-bg-800 border border-ps-bg-600 rounded-lg p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-16 h-16"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="50" cy="50" r="40" stroke="#ff6b35" strokeWidth="4" />
                <circle cx="50" cy="50" r="20" fill="#ff6b35" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ps-text-primary text-center mb-2">
              Pulse Studio
            </h2>
            <p className="text-sm text-ps-text-secondary text-center mb-4">
              Version 0.1.0 Alpha
            </p>
            <p className="text-sm text-ps-text-secondary text-center mb-6">
              A modern, browser-based digital audio workstation (DAW) built with Next.js, Tone.js, and TypeScript.
            </p>
            <div className="text-xs text-ps-text-muted text-center space-y-1">
              <p>Created for UofTHacks</p>
              <p className="mt-4 pt-4 border-t border-ps-bg-600">
                This is an alpha version. Many features are still in development.
              </p>
            </div>
            <button
              onClick={() => setShowAbout(false)}
              className="btn btn-primary w-full mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

