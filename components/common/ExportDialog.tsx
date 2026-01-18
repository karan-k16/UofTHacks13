'use client';

import { useState } from 'react';
import { useStore } from '@/state/store';
import { offlineRenderer, type RenderProgress } from '@/lib/audio/OfflineRenderer';
import Modal from './Modal';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const { project } = useStore();
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [fileName, setFileName] = useState(project?.name || 'export');
  const [exportMode, setExportMode] = useState<'master' | 'stems'>('master');
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());

  // Initialize selected tracks with all non-master tracks
  useState(() => {
    if (project) {
      const trackIds = project.mixer.tracks
        .filter(t => t.index !== 0)
        .map(t => t.id);
      setSelectedTracks(new Set(trackIds));
    }
  });

  const handleExport = async () => {
    if (!project) return;

    try {
      setIsRendering(true);
      
      // Set up progress callback
      offlineRenderer.setProgressCallback((prog) => {
        setProgress(prog);
      });

      if (exportMode === 'master') {
        // Master render
        const result = await offlineRenderer.render(project);
        downloadBlob(result.wavBlob, `${fileName}.wav`);
      } else {
        // Stems render
        const tracksToExport = project.mixer.tracks.filter(t => 
          selectedTracks.has(t.id) && t.index !== 0
        );

        for (let i = 0; i < tracksToExport.length; i++) {
          const track = tracksToExport[i];
          setProgress({
            phase: 'preparing',
            progress: Math.round((i / tracksToExport.length) * 100),
            message: `Rendering stem: ${track.name} (${i + 1}/${tracksToExport.length})`
          });

          // To render a stem, we temporarily mute other tracks
          // but OfflineRenderer doesn't support track-specific rendering yet.
          // For now, we'll implement the UI and then update the renderer.
          const result = await offlineRenderer.render(project, {
            onlyTrackId: track.id
          });
          
          downloadBlob(result.wavBlob, `${fileName}_${track.name}.wav`);
        }
      }

      // Close dialog after short delay
      setTimeout(() => {
        onClose();
        setIsRendering(false);
        setProgress(null);
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsRendering(false);
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleTrack = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const handleClose = () => {
    if (!isRendering) {
      onClose();
      setProgress(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Export Audio">
      <div className="space-y-4">
        {/* File name input */}
        <div>
          <label className="block text-sm font-medium mb-2">File Name</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            disabled={isRendering}
            className="w-full px-3 py-2 bg-ps-bg-700 border border-ps-bg-500 rounded text-sm focus:outline-none focus:border-ps-accent-primary"
            placeholder="export"
          />
        </div>

        {/* Export Mode */}
        <div className="flex gap-2 p-1 bg-ps-bg-700 rounded">
          <button
            className={`flex-1 py-1.5 text-xs rounded transition-colors ${
              exportMode === 'master'
                ? 'bg-ps-accent-primary text-white'
                : 'hover:bg-ps-bg-600 text-ps-text-muted'
            }`}
            onClick={() => setExportMode('master')}
            disabled={isRendering}
          >
            Master Mix
          </button>
          <button
            className={`flex-1 py-1.5 text-xs rounded transition-colors ${
              exportMode === 'stems'
                ? 'bg-ps-accent-primary text-white'
                : 'hover:bg-ps-bg-600 text-ps-text-muted'
            }`}
            onClick={() => setExportMode('stems')}
            disabled={isRendering}
          >
            Individual Stems
          </button>
        </div>

        {/* Track Selection (only for stems) */}
        {exportMode === 'stems' && project && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Select Tracks</label>
            <div className="max-h-40 overflow-y-auto bg-ps-bg-700 rounded border border-ps-bg-500 p-1">
              {project.mixer.tracks
                .filter((t) => t.index !== 0) // Skip master
                .map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-2 p-2 hover:bg-ps-bg-600 rounded cursor-pointer"
                    onClick={() => !isRendering && handleToggleTrack(track.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTracks.has(track.id)}
                      onChange={() => {}} // Handled by div onClick
                      disabled={isRendering}
                      className="rounded border-ps-bg-500 text-ps-accent-primary"
                    />
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: track.color }}
                    />
                    <span className="text-xs truncate">{track.name}</span>
                  </div>
                ))}
            </div>
            <div className="flex gap-2">
              <button
                className="text-[10px] text-ps-accent-primary hover:underline"
                onClick={() => setSelectedTracks(new Set(project.mixer.tracks.filter(t => t.index !== 0).map(t => t.id)))}
                disabled={isRendering}
              >
                Select All
              </button>
              <button
                className="text-[10px] text-ps-accent-primary hover:underline"
                onClick={() => setSelectedTracks(new Set())}
                disabled={isRendering}
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* Format info */}
        <div className="bg-ps-bg-700 p-3 rounded">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-ps-text-muted">Format:</span>
              <span className="text-ps-text-primary">WAV (PCM)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ps-text-muted">Sample Rate:</span>
              <span className="text-ps-text-primary">48 kHz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ps-text-muted">Bit Depth:</span>
              <span className="text-ps-text-primary">16-bit</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ps-text-muted capitalize">{progress.phase}</span>
              <span className="text-ps-text-primary">{progress.progress}%</span>
            </div>
            <div className="h-2 bg-ps-bg-700 rounded overflow-hidden">
              <div
                className="h-full bg-ps-accent-primary transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <p className="text-xs text-ps-text-muted">{progress.message}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="btn btn-ghost px-4 py-2"
            onClick={handleClose}
            disabled={isRendering}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary px-4 py-2"
            onClick={handleExport}
            disabled={isRendering || !fileName.trim()}
          >
            {isRendering ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
