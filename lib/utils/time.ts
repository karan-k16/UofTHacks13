// ============================================
// Pulse Studio - Time Utilities
// ============================================

/**
 * Format seconds as MM:SS.ms
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/**
 * Format ticks as Bar:Beat:Tick
 */
export function formatTicksAsBBT(
  ticks: number,
  ppq: number = 96,
  timeSignature = { numerator: 4, denominator: 4 }
): string {
  const ticksPerBeat = ppq;
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;

  const bar = Math.floor(ticks / ticksPerBar) + 1;
  const remainingAfterBar = ticks % ticksPerBar;
  const beat = Math.floor(remainingAfterBar / ticksPerBeat) + 1;
  const tick = remainingAfterBar % ticksPerBeat;

  return `${bar}:${beat}:${tick.toString().padStart(2, '0')}`;
}

/**
 * Format ticks as seconds string
 */
export function formatTicksAsTime(ticks: number, bpm: number, ppq: number = 96): string {
  const seconds = (ticks / ppq) * (60 / bpm);
  return formatTime(seconds);
}

/**
 * Parse BBT string to ticks
 */
export function parseBBTToTicks(
  bbt: string,
  ppq: number = 96,
  timeSignature = { numerator: 4, denominator: 4 }
): number {
  const parts = bbt.split(':').map(Number);
  const bar = (parts[0] ?? 1) - 1;
  const beat = (parts[1] ?? 1) - 1;
  const tick = parts[2] ?? 0;

  const ticksPerBeat = ppq;
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;

  return bar * ticksPerBar + beat * ticksPerBeat + tick;
}

/**
 * Calculate pixels per tick based on zoom level
 */
export function calculatePixelsPerTick(zoom: number, ppq: number = 96): number {
  // Base: 1 beat = 48 pixels at zoom 1.0
  const basePixelsPerBeat = 48;
  return (basePixelsPerBeat * zoom) / ppq;
}

/**
 * Calculate ticks from pixels based on zoom level
 */
export function pixelsToTicks(pixels: number, zoom: number, ppq: number = 96): number {
  const ppt = calculatePixelsPerTick(zoom, ppq);
  return Math.round(pixels / ppt);
}

/**
 * Calculate pixels from ticks based on zoom level
 */
export function ticksToPixels(ticks: number, zoom: number, ppq: number = 96): number {
  const ppt = calculatePixelsPerTick(zoom, ppq);
  return ticks * ppt;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

