'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  label?: string;
  onChange: (value: number) => void;
  color?: string;
}

export default function Knob({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  size = 32,
  label,
  onChange,
  color = '#ff6b35',
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  // Calculate rotation angle (270 degrees total range, -135 to 135)
  const normalizedValue = (value - min) / (max - min);
  const angle = -135 + normalizedValue * 270;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startY.current = e.clientY;
      startValue.current = value;
    },
    [value]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 100; // 100 pixels for full range
      const newValue = Math.max(
        min,
        Math.min(max, startValue.current + deltaY * sensitivity)
      );

      // Snap to step
      const snappedValue = Math.round(newValue / step) * step;
      onChange(snappedValue);
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
  }, [isDragging, min, max, step, onChange]);

  // Double-click to reset
  const handleDoubleClick = useCallback(() => {
    onChange((max - min) / 2 + min);
  }, [min, max, onChange]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={knobRef}
        className="knob relative cursor-pointer"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Background circle */}
        <svg width={size} height={size} viewBox="0 0 32 32">
          {/* Track */}
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="var(--ps-bg-700)"
            stroke="var(--ps-bg-500)"
            strokeWidth="1"
          />

          {/* Value arc */}
          <path
            d={describeArc(16, 16, 12, -135, angle)}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Indicator */}
          <g transform={`rotate(${angle}, 16, 16)`}>
            <line
              x1="16"
              y1="6"
              x2="16"
              y2="10"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {label && (
        <span className="knob-label text-2xs text-ps-text-muted">{label}</span>
      )}
    </div>
  );
}

// Helper function to create SVG arc path
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
}

