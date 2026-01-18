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

  const handleExport = async () => {
    if (!project) return;

    try {
      setIsRendering(true);

      // Set up progress callback
      offlineRenderer.setProgressCallback((prog) => {
        setProgress(prog);
      });

      // Render master mix
      const result = await offlineRenderer.render(project);
      downloadBlob(result.wavBlob, `${fileName}.wav`);

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
