// ============================================
// Pulse Studio - Tone.js Provider (Unified)
// ============================================
// Single source of truth for Tone.js access across the entire app
// Uses the CDN-loaded Tone.js from window.Tone

// ==========================================
// Type definitions for window.Tone
// ==========================================

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Tone: any;
  }
}

// ==========================================
// Tone.js Instance
// ==========================================

/**
 * Get the Tone.js instance from window
 * This is the ONLY way to access Tone.js in the application
 * @returns The Tone.js instance or null if not loaded
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTone(): any | null {
  if (typeof window === 'undefined') return null;
  return window.Tone || null;
}

/**
 * Initialize the Tone.js audio context
 * Must be called from a user interaction (e.g., button click)
 * @returns Promise that resolves when audio context is ready
 */
export async function initializeToneContext(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Tone.js can only be initialized in the browser');
  }

  const Tone = getTone();
  if (!Tone) {
    throw new Error('Tone.js is not loaded');
  }

  try {
    await Tone.start();
    const context = Tone.getContext();
    console.log('[ToneProvider] Audio context started, state:', context.state);
  } catch (error) {
    console.error('[ToneProvider] Failed to start audio context:', error);
    throw error;
  }
}

/**
 * Check if the audio context is running
 */
export function isAudioContextRunning(): boolean {
  if (typeof window === 'undefined') return false;
  const Tone = getTone();
  if (!Tone) return false;
  const context = Tone.getContext();
  return context.state === 'running';
}

/**
 * Get the current audio context state
 */
export function getAudioContextState(): AudioContextState {
  if (typeof window === 'undefined') return 'suspended';
  const Tone = getTone();
  if (!Tone) return 'suspended';
  const context = Tone.getContext();
  return context.state;
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Get the Transport singleton
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTransport(): any | null {
  const Tone = getTone();
  return Tone?.Transport || null;
}

/**
 * Get the audio context
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getToneContext(): any | null {
  const Tone = getTone();
  return Tone?.getContext?.() || null;
}

// ==========================================
// Type Exports
// ==========================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToneType = any;
