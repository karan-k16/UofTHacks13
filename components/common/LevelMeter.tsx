'use client';

import { useEffect, useState, useRef } from 'react';

interface LevelMeterProps {
  level: number; // in dB
  peak?: number;
  width?: number;
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  showPeak?: boolean;
  showScale?: boolean;
}

export default function LevelMeter({
  level,
  peak,
  width = 12,
  height = 100,
  orientation = 'vertical',
  showPeak = true,
  showScale = false,
}: LevelMeterProps) {
  const [displayLevel, setDisplayLevel] = useState(level);
  const [peakLevel, setPeakLevel] = useState(peak ?? level);
  const peakHoldRef = useRef<ReturnType<typeof setTimeout>>();

  // Smooth level changes
  useEffect(() => {
    setDisplayLevel((prev) => {
      // Fast attack, slow release
      if (level > prev) return level;
      return prev - (prev - level) * 0.1;
    });

    // Update peak with hold
    if (level > peakLevel) {
      setPeakLevel(level);
      clearTimeout(peakHoldRef.current);
      peakHoldRef.current = setTimeout(() => {
        setPeakLevel(level);
      }, 1500);
    }
  }, [level, peakLevel]);

  // Convert dB to percentage
  const dbToPercent = (db: number) => {
    // Range: -60dB to 0dB (with some headroom for +6dB)
    const min = -60;
    const max = 6;
    return Math.max(0, Math.min(100, ((db - min) / (max - min)) * 100));
  };

  const levelPercent = dbToPercent(displayLevel);
  const peakPercent = dbToPercent(peakLevel);

  // Color gradient based on level
  const getColor = (percent: number) => {
    if (percent > 90) return '#e74c3c'; // Red (clipping)
    if (percent > 75) return '#f39c12'; // Orange (hot)
    if (percent > 50) return '#f1c40f'; // Yellow
    return '#27ae60'; // Green
  };

  const isVertical = orientation === 'vertical';

  return (
    <div
      className="level-meter relative rounded overflow-hidden"
      style={{
        width: isVertical ? width : height,
        height: isVertical ? height : width,
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-ps-bg-900" />

      {/* Level fill */}
      <div
        className="absolute transition-all duration-50"
        style={
          isVertical
            ? {
                bottom: 0,
                left: 0,
                right: 0,
                height: `${levelPercent}%`,
                background: `linear-gradient(to top, #27ae60 0%, #f1c40f 50%, #f39c12 75%, #e74c3c 100%)`,
              }
            : {
                top: 0,
                left: 0,
                bottom: 0,
                width: `${levelPercent}%`,
                background: `linear-gradient(to right, #27ae60 0%, #f1c40f 50%, #f39c12 75%, #e74c3c 100%)`,
              }
        }
      />

      {/* Peak indicator */}
      {showPeak && (
        <div
          className="absolute bg-white"
          style={
            isVertical
              ? {
                  bottom: `${peakPercent}%`,
                  left: 0,
                  right: 0,
                  height: 2,
                }
              : {
                  left: `${peakPercent}%`,
                  top: 0,
                  bottom: 0,
                  width: 2,
                }
          }
        />
      )}

      {/* Scale markers */}
      {showScale && isVertical && (
        <div className="absolute inset-y-0 right-0 w-px flex flex-col justify-between pointer-events-none">
          {[-60, -40, -20, -10, -6, -3, 0, 6].map((db) => (
            <div
              key={db}
              className="relative"
              style={{ top: `${100 - dbToPercent(db)}%` }}
            >
              <span className="absolute right-1 text-[8px] text-ps-text-muted whitespace-nowrap">
                {db}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Segment lines */}
      <div
        className={`absolute inset-0 flex ${
          isVertical ? 'flex-col' : 'flex-row'
        } justify-between pointer-events-none`}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`${
              isVertical ? 'w-full h-px' : 'h-full w-px'
            } bg-ps-bg-900/50`}
          />
        ))}
      </div>
    </div>
  );
}

