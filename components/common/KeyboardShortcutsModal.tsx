'use client';

import Modal from './Modal';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    {
      category: 'Transport', items: [
        { keys: 'Space', description: 'Play/Pause' },
        { keys: 'Enter', description: 'Stop' },
        { keys: 'M', description: 'Toggle Metronome' },
      ]
    },
    {
      category: 'Editing', items: [
        { keys: 'Ctrl+Z', description: 'Undo' },
        { keys: 'Ctrl+Shift+Z', description: 'Redo' },
        { keys: 'Ctrl+S', description: 'Save Project' },
        { keys: 'Ctrl+C', description: 'Copy (Coming Soon)' },
        { keys: 'Ctrl+V', description: 'Paste (Coming Soon)' },
        { keys: 'Ctrl+X', description: 'Cut (Coming Soon)' },
        { keys: 'Delete', description: 'Delete Selection (Coming Soon)' },
      ]
    },
    {
      category: 'View', items: [

        { keys: 'Ctrl++', description: 'Zoom In (Coming Soon)' },
        { keys: 'Ctrl+-', description: 'Zoom Out (Coming Soon)' },
      ]
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts">
      <div className="space-y-6 max-h-[60vh] overflow-y-auto">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <h3 className="text-sm font-semibold text-ps-accent-primary mb-3">
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="text-sm text-ps-text-secondary">
                    {item.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-ps-bg-600 border border-ps-bg-500 rounded">
                    {item.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
