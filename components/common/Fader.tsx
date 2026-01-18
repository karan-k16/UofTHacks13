'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface FaderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  width?: number;
  height?: number;
  label?: string;
  onChange: (value: number) => void;
  color?: string;
  showValue?: boolean;
}

export default function Fader({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  width = 24,
  height = 100,
  label,
  onChange,
  color = '#ff6b35',
  showValue = true,
}: FaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate thumb position (0 at bottom, 100 at top)
  const normalizedValue = (value - min) / (max - min);
  const thumbPosition = (1 - normalizedValue) * (height - 20);

  const calculateValue = useCallback(
    (clientY: number) => {
      if (!trackRef.current) return value;

      const rect = trackRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const normalizedY = 1 - Math.max(0, Math.min(1, relativeY / rect.height));
      const newValue = min + normalizedY * (max - min);

      // Snap to step
      return Math.round(newValue / step) * step;
    },
    [min, max, step, value]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      onChange(calculateValue(e.clientY));
    },
    [calculateValue, onChange]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onChange(calculateValue(e.clientY));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateValue, onChange]);

  // Double-click to reset
  const handleDoubleClick = useCallback(() => {
    onChange((max - min) / 2 + min);
  }, [min, max, onChange]);

  // Format value for display
  const displayValue =
    max <= 1 ? `${Math.round(value * 100)}%` : value.toFixed(2);

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-2xs text-ps-text-muted">{label}</span>
      )}

      <div
        ref={trackRef}
        className="fader-track relative cursor-pointer"
        style={{ width, height }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Track background */}
        <div className="absolute inset-0 rounded bg-ps-bg-600">
          {/* Fill */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-b"
            style={{
              height: `${normalizedValue * 100}%`,
              background: `linear-gradient(to top, ${color}88, ${color})`,
            }}
          />
        </div>

        {/* Thumb */}
        <div
          className="fader-thumb absolute left-1/2 -translate-x-1/2"
          style={{
            top: thumbPosition,
            width: width - 4,
            height: 20,
          }}
        />

        {/* Tick marks */}
        <div className="absolute inset-y-0 right-0 w-px flex flex-col justify-between py-2">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="w-1 h-px bg-ps-text-muted"
            />
          ))}
        </div>
      </div>

      {showValue && (
        <span className="text-2xs text-ps-text-secondary font-mono">
          {displayValue}
        </span>
      )}
    </div>
  );
}

