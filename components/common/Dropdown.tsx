'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
}

export default function Dropdown({ trigger, items }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-ps-bg-700 border border-ps-bg-600 rounded-md shadow-lg z-50 py-1">
          {items.map((item, index) => (
            <div key={index}>
              {item.divider ? (
                <div className="h-px bg-ps-bg-600 my-1" />
              ) : (
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-ps-bg-600 transition-colors ${
                    item.disabled
                      ? 'text-ps-text-muted cursor-not-allowed opacity-50'
                      : 'text-ps-text-primary cursor-pointer'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="text-xs text-ps-text-secondary ml-4">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
