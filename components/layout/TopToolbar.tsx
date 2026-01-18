'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/state/store';
import { apiClient } from '@/lib/api/client';
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
    setPlaylistZoom,
    updateProjectName,
  } = useStore();

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const router = useRouter();

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
      <div className="h-14 bg-gradient-to-r from-[#0d0d0d] to-[#111] border-b border-[#1a1a1a] flex items-center px-5 gap-4 shrink-0 shadow-md">
        {/* Logo - Click to go to Dashboard */}
        <button
          onClick={() => {
            if (hasUnsavedChanges) {
              if (confirm('You have unsaved changes. Leave project?')) {
                router.push('/dashboard');
              }
            } else {
              router.push('/dashboard');
            }
          }}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer group"
          title="Go to Dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:scale-105">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-semibold text-base text-white tracking-tight">PULSE</span>
        </button>

        {/* Divider */}
        <div className="w-px h-7 bg-[#222]" />

        {/* File Menu */}
        <div className="flex items-center gap-1">
          <Dropdown
            trigger={<button className="text-xs px-3 py-2 text-[#888] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">File</button>}
            items={fileMenuItems}
          />
          <Dropdown
            trigger={<button className="text-xs px-3 py-2 text-[#888] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">Edit</button>}
            items={editMenuItems}
          />
          <Dropdown
            trigger={<button className="text-xs px-3 py-2 text-[#888] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">View</button>}
            items={viewMenuItems}
          />
          <Dropdown
            trigger={<button className="text-xs px-3 py-2 text-[#888] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">Help</button>}
            items={helpMenuItems}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-[#222]" />

        {/* Project Name */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#666] uppercase tracking-wide">Project:</span>
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const trimmed = editedName.trim();
                    if (trimmed && trimmed !== project?.name && project?.id) {
                      updateProjectName(trimmed);
                      // Persist to database
                      try {
                        await apiClient.renameProject(project.id, trimmed);
                      } catch (error) {
                        console.error('Failed to save project name:', error);
                      }
                    }
                    setIsEditingName(false);
                  }
                  if (e.key === 'Escape') {
                    setIsEditingName(false);
                  }
                }}
                onBlur={async () => {
                  const trimmed = editedName.trim();
                  if (trimmed && trimmed !== project?.name && project?.id) {
                    updateProjectName(trimmed);
                    // Persist to database
                    try {
                      await apiClient.renameProject(project.id, trimmed);
                    } catch (error) {
                      console.error('Failed to save project name:', error);
                    }
                  }
                  setIsEditingName(false);
                }}
                className="text-xs font-medium bg-[#0a0a0a] border border-[#ff6b6b] rounded-lg px-2 py-1 focus:outline-none w-40 text-white"
                autoFocus
              />
            </div>
          ) : (
            <span
              className="text-xs font-medium text-white cursor-pointer hover:text-[#ff6b6b] transition-colors px-2 py-1 rounded-lg hover:bg-[#1a1a1a] border border-transparent hover:border-[#222]"
              onClick={() => {
                setEditedName(project?.name || 'Untitled');
                setIsEditingName(true);
              }}
              title="Click to rename project"
            >
              {project?.name ?? 'Untitled'}
            </span>
          )}
          {hasUnsavedChanges && (
            <span className="text-xs text-[#ffe66d]">*</span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Transport */}
        <Transport />

        {/* Spacer */}
        <div className="flex-1" />

        {/* BPM */}
        <div className="flex items-center gap-2 bg-[#111] rounded-lg px-3 py-1.5 border border-[#1a1a1a]">
          <span className="text-xs text-[#666] uppercase tracking-wide">BPM</span>
          <input
            type="number"
            value={project?.bpm ?? 120}
            onChange={(e) => setBpm(parseInt(e.target.value, 10) || 120)}
            className="w-14 text-center font-mono bg-transparent border-none text-white text-sm focus:outline-none"
            min={20}
            max={999}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[#222]" />

        {/* Tools */}
        <div className="flex items-center gap-1">
          <button
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${canUndo() ? 'text-[#888] hover:text-white hover:bg-[#1a1a1a]' : 'text-[#333] cursor-not-allowed'}`}
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
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${canRedo() ? 'text-[#888] hover:text-white hover:bg-[#1a1a1a]' : 'text-[#333] cursor-not-allowed'}`}
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

          <div className="w-px h-4 bg-[#222] mx-1" />

          <button
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${metronomeEnabled ? 'bg-[#ff6b6b] text-white' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[#222] rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-5">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white text-center mb-2">
              Pulse Studio
            </h2>
            <p className="text-sm text-[#888] text-center mb-4">
              Version 0.1.0 Alpha
            </p>
            <p className="text-sm text-[#666] text-center mb-6 leading-relaxed">
              A modern, browser-based digital audio workstation (DAW) built with Next.js, Tone.js, and TypeScript.
            </p>
            <div className="text-xs text-[#555] text-center space-y-1">
              <p>Created for UofTHacks</p>
              <p className="mt-4 pt-4 border-t border-[#222]">
                This is an alpha version. Many features are still in development.
              </p>
            </div>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full mt-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] text-white hover:shadow-lg hover:shadow-[#ff6b6b]/25 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

