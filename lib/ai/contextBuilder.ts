/**
 * Context Builder for AI Agent
 * 
 * Builds dynamic context from the current project state and sample library
 * to inject into the AI system prompt. This gives the AI model knowledge of:
 * - Available samples (categories, names, IDs)
 * - Current project state (patterns, channels, tracks, clips)
 * - Available actions with exact parameter schemas
 * - Constraints and validation rules
 */

import type { Project, Pattern, Channel, PlaylistTrack, Clip, TrackEffects, AudioClip, AudioAsset } from '@/domain/types';
import type { SampleLibrary, SampleMetadata } from '@/lib/audio/SampleLibrary';

// ============================================
// Types for Context Building
// ============================================

export interface ProjectContext {
    bpm: number;
    patterns: PatternSummary[];
    channels: ChannelSummary[];
    playlistTracks: PlaylistTrackSummary[];
    clips: ClipSummary[];
    loopRegion: { start: number; end: number } | null;
    ppq: number;
    masterVolume: number;
}

export interface PatternSummary {
    id: string;
    name: string;
    lengthInSteps: number;
    noteCount: number;
    color: string;
}

export interface ChannelSummary {
    id: string;
    name: string;
    type: 'synth' | 'sampler';
    preset?: string;
    volume: number;
    pan: number;
    muted: boolean;
    solo: boolean;
}

export interface PlaylistTrackSummary {
    id: string;
    index: number;
    name: string;
    muted: boolean;
    solo: boolean;
    clipCount: number;
}

export interface ClipSummary {
    id: string;
    trackIndex: number;
    startTick: number;
    durationTick: number;
    type: 'pattern' | 'audio';
    sourceName: string; // Pattern name or audio asset name
}

export interface SampleCatalog {
    totalSamples: number;
    categories: CategorySummary[];
}

export interface CategorySummary {
    name: string;
    subcategories: SubcategorySummary[];
}

export interface SubcategorySummary {
    name: string;
    samples: SampleEntry[];
}

export interface SampleEntry {
    id: string;
    name: string;
    path: string;
}

export interface DAWContext {
    project: ProjectContext | null;
    samples: SampleCatalog;
    capabilities: DAWCapabilities;
}

export interface DAWCapabilities {
    synthPresets: string[];
    effectTypes: string[];
    maxTracks: number;
    bpmRange: { min: number; max: number };
    pitchRange: { min: number; max: number };
    ppq: number;
}

// ============================================
// Project Context Extraction
// ============================================

/**
 * Extract a compact summary of the current project state
 */
export function extractProjectContext(project: Project | null): ProjectContext | null {
    if (!project) {
        return null;
    }

    // Summarize patterns
    const patterns: PatternSummary[] = project.patterns.map((p) => ({
        id: p.id,
        name: p.name,
        lengthInSteps: p.lengthInSteps,
        noteCount: p.notes.length,
        color: p.color,
    }));

    // Summarize channels
    const channels: ChannelSummary[] = project.channels.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        preset: c.preset, // Direct preset property on Channel
        volume: c.volume,
        pan: c.pan,
        muted: c.mute, // Correct property name is 'mute'
        solo: c.solo,
    }));

    // Summarize playlist tracks with indices
    const playlistTracks: PlaylistTrackSummary[] = project.playlist.tracks.map((t, index) => ({
        id: t.id,
        index,
        name: t.name,
        muted: t.mute, // Correct property name is 'mute'
        solo: t.solo,
        clipCount: project.playlist.clips.filter((c) => c.trackIndex === index).length,
    }));

    // Summarize clips
    const clips: ClipSummary[] = project.playlist.clips.map((c) => {
        let sourceName = 'Unknown';
        if (c.type === 'pattern') {
            const pattern = project.patterns.find((p) => p.id === c.patternId);
            sourceName = pattern?.name || 'Unknown Pattern';
        } else if (c.type === 'audio') {
            // For audio clips, the assetId property is used
            const audioClip = c as AudioClip;
            const asset = project.assets.find((a: AudioAsset) => a.id === audioClip.assetId);
            sourceName = asset?.name || 'Unknown Audio';
        }

        return {
            id: c.id,
            trackIndex: c.trackIndex,
            startTick: c.startTick,
            durationTick: c.durationTick,
            type: c.type,
            sourceName,
        };
    });

    return {
        bpm: project.bpm,
        patterns,
        channels,
        playlistTracks,
        clips,
        loopRegion: project.playlist.loopStart !== undefined && project.playlist.loopEnd !== undefined
            ? { start: project.playlist.loopStart, end: project.playlist.loopEnd }
            : null,
        ppq: project.ppq,
        masterVolume: project.mixer.masterVolume, // Accessed through mixer object
    };
}

// ============================================
// Sample Library Context Extraction
// ============================================

/**
 * Build a compact sample catalog for the AI to reference
 * Organizes samples by category/subcategory with searchable names
 */
export function extractSampleCatalog(library: SampleLibrary | null): SampleCatalog {
    if (!library) {
        return { totalSamples: 0, categories: [] };
    }

    const categories: CategorySummary[] = [];

    for (const [categoryName, subcategories] of Object.entries(library.categories)) {
        if (!subcategories) continue;

        const subcatSummaries: SubcategorySummary[] = [];

        for (const [subcatName, samples] of Object.entries(subcategories)) {
            const sampleEntries: SampleEntry[] = samples.map((s) => ({
                id: s.id,
                name: s.name,
                path: s.path,
            }));

            subcatSummaries.push({
                name: subcatName,
                samples: sampleEntries,
            });
        }

        categories.push({
            name: categoryName,
            subcategories: subcatSummaries,
        });
    }

    return {
        totalSamples: library.totalSamples,
        categories,
    };
}

/**
 * Create a compressed text representation of samples for the system prompt
 * Groups by category and lists sample names (not full IDs to save tokens)
 */
export function formatSamplesForPrompt(catalog: SampleCatalog): string {
    if (catalog.totalSamples === 0) {
        return 'No samples available.';
    }

    const lines: string[] = [`Available Samples (${catalog.totalSamples} total):`];

    for (const category of catalog.categories) {
        lines.push(`\n## ${category.name.toUpperCase()}`);

        for (const subcat of category.subcategories) {
            const sampleNames = subcat.samples.map((s) => {
                // Extract a short, readable name from the filename
                // e.g., "drums-kick-01-synth-kick-3.mp3" -> "synth-kick-3"
                const baseName = s.name.replace(/\.mp3$|\.wav$/i, '');
                const parts = baseName.split('-');
                // Take the last 2-3 meaningful parts
                return parts.slice(-3).join('-');
            });

            lines.push(`  ${subcat.name}: ${sampleNames.join(', ')}`);
        }
    }

    return lines.join('\n');
}

/**
 * Create a lookup table for sample resolution
 * AI can reference samples by category/subcategory/partial name
 */
export function createSampleLookupTable(catalog: SampleCatalog): Map<string, SampleEntry> {
    const lookup = new Map<string, SampleEntry>();

    for (const category of catalog.categories) {
        for (const subcat of category.subcategories) {
            for (const sample of subcat.samples) {
                // Add multiple lookup keys for flexible matching
                lookup.set(sample.id, sample);
                lookup.set(sample.name.toLowerCase(), sample);

                // Also add short name variants
                const baseName = sample.name.replace(/\.mp3$|\.wav$/i, '').toLowerCase();
                lookup.set(baseName, sample);

                // Add category/subcat prefix for disambiguation
                const prefixedKey = `${category.name}/${subcat.name}/${baseName}`;
                lookup.set(prefixedKey, sample);
            }
        }
    }

    return lookup;
}

// ============================================
// DAW Capabilities Definition
// ============================================

/**
 * Static capabilities of the DAW (doesn't change per project)
 */
export function getDAWCapabilities(): DAWCapabilities {
    return {
        synthPresets: [
            'piano', 'electricPiano', 'organ', 'harpsichord',
            'lead', 'brightLead',
            'bass', 'subBass', 'acidBass',
            'pad', 'warmPad', 'stringPad', 'atmosphericPad',
            'strings', 'violin', 'cello',
            'brass', 'trumpet', 'trombone',
            'bell', 'glockenspiel', 'marimba',
            'pluck', 'guitar', 'harp',
            'metallic',
        ],
        effectTypes: ['volume', 'pan', 'lowpass', 'highpass', 'reverb', 'delay', 'distortion'],
        maxTracks: 64,
        bpmRange: { min: 20, max: 999 },
        pitchRange: { min: 0, max: 127 },
        ppq: 96, // Pulses per quarter note
    };
}

// ============================================
// Full Context Building
// ============================================

/**
 * Build the complete DAW context for the AI
 */
export function buildDAWContext(
    project: Project | null,
    sampleLibrary: SampleLibrary | null
): DAWContext {
    return {
        project: extractProjectContext(project),
        samples: extractSampleCatalog(sampleLibrary),
        capabilities: getDAWCapabilities(),
    };
}

// ============================================
// System Prompt Generation
// ============================================

/**
 * Generate the dynamic system prompt with current context
 * This is what gets sent to the AI model
 * 
 * NOTE: All curly braces in examples must be escaped as {{ }} to prevent
 * LangChain from interpreting them as template variables.
 */
export function generateSystemPrompt(context: DAWContext): string {
    const { project, samples, capabilities } = context;

    // Build project state section
    let projectSection = '';
    if (project) {
        projectSection = `
## CURRENT PROJECT STATE
- BPM: ${project.bpm}
- Master Volume: ${(project.masterVolume * 100).toFixed(0)}%
- PPQ (ticks per beat): ${project.ppq}

### Patterns (${project.patterns.length} total):
${project.patterns.map((p) => `  - "${p.name}" (id: ${p.id}, ${p.lengthInSteps} steps, ${p.noteCount} notes)`).join('\n') || '  (none)'}

### Channels (${project.channels.length} total):
${project.channels.map((c) => `  - "${c.name}" (id: ${c.id}, type: ${c.type}${c.preset ? `, preset: ${c.preset}` : ''}, vol: ${(c.volume * 100).toFixed(0)}%${c.muted ? ', MUTED' : ''})`).join('\n') || '  (none)'}

### Playlist Tracks (${project.playlistTracks.length} total):
${project.playlistTracks.map((t) => `  - Track ${t.index}: "${t.name}" (id: ${t.id}, ${t.clipCount} clips${t.muted ? ', MUTED' : ''})`).join('\n') || '  (none)'}

### Clips on Timeline:
${project.clips.map((c) => `  - ${c.type} clip "${c.sourceName}" on track ${c.trackIndex} at tick ${c.startTick} (duration: ${c.durationTick} ticks)`).join('\n') || '  (none)'}

${project.loopRegion ? `### Loop Region: ticks ${project.loopRegion.start} to ${project.loopRegion.end}` : ''}
`;
    } else {
        projectSection = '\n## CURRENT PROJECT STATE\nNo project loaded. User must create or load a project first.\n';
    }

    // Build samples section (compressed)
    const samplesSection = formatSamplesForPrompt(samples);

    // Build the full prompt with BATCH support
    return `You are an AI assistant for Pulse Studio, a digital audio workstation (DAW). You help users create music by executing commands.

## YOUR ROLE
Convert natural language requests into structured JSON commands. You MUST respond with ONLY valid JSON, no markdown, no explanation.

## RESPONSE FORMAT - BATCH ACTIONS
For complex requests (like "make a beat"), return MULTIPLE actions in an array:

{{
  "actions": [
    {{ "action": "setBpm", "parameters": {{ "bpm": 90 }} }},
    {{ "action": "addAudioSample", "parameters": {{ "category": "drums", "subcategory": "kick", "trackIndex": 0, "startTick": 0 }} }},
    {{ "action": "addAudioSample", "parameters": {{ "category": "drums", "subcategory": "snare", "trackIndex": 1, "startTick": 192 }} }}
  ],
  "confidence": 0.85,
  "reasoning": "Creating a basic beat with kick and snare"
}}

For simple single-action requests, you can still use the single format:
{{
  "actions": [
    {{ "action": "commandName", "parameters": {{ ... }} }}
  ],
  "confidence": 0.9,
  "reasoning": "brief explanation"
}}

## CRITICAL RULES
1. ALWAYS return the "actions" array format (even for single actions)
2. Use EXACT IDs from the project state when referencing existing patterns, channels, or tracks
3. For samples: specify "category" and "subcategory" - the system will pick a consistent sample
4. All tick values use PPQ=${capabilities.ppq} (96 ticks = 1 beat = 1 quarter note)
5. 1 bar = 4 beats = 384 ticks
6. BPM must be between ${capabilities.bpmRange.min}-${capabilities.bpmRange.max}
7. MIDI pitch: ${capabilities.pitchRange.min}-${capabilities.pitchRange.max} (60 = middle C)
8. Volume: 0.0-1.0 (1.0 = 100%)
9. Pan: -1.0 (left) to 1.0 (right)
10. Tracks are auto-created if trackIndex doesn't exist
11. Overlapping clips are auto-offset to avoid conflicts

## TIMING REFERENCE
- 1 beat = 96 ticks
- 1 bar = 384 ticks (4 beats)
- 8th note = 48 ticks
- 16th note = 24 ticks
- 32nd note = 12 ticks

${projectSection}

## ${samplesSection}

## SAMPLE CATEGORIES
When adding samples, use these category/subcategory combinations:
- drums/kick, drums/snare, drums/hihat, drums/clap, drums/tom, drums/cymbal
- fx/impact, fx/riser, fx/sweep
- synth/bass, synth/lead, synth/pad
- instruments/piano, instruments/guitar, instruments/strings

## COMMON DRUM PATTERNS (use as reference)

### Boom-Bap (85-95 BPM)
- Kick: beat 1 and beat 3 (ticks 0, 192 per bar)
- Snare: beat 2 and beat 4 (ticks 96, 288 per bar)
- Hi-hat: every 8th note (ticks 0, 48, 96, 144, 192, 240, 288, 336)

### Trap (130-160 BPM)
- Kick: beat 1, sometimes syncopated
- Snare/Clap: beat 3 (tick 192 per bar)
- Hi-hat: 16th notes (every 24 ticks), with rolls (32nd = 12 ticks)

### Four-on-the-Floor / House (120-130 BPM)
- Kick: every beat (ticks 0, 96, 192, 288)
- Snare/Clap: beats 2 and 4 (ticks 96, 288)
- Hi-hat: 8th notes or 16th notes

### Lo-Fi Hip-Hop (70-90 BPM)
- Similar to boom-bap, relaxed feel
- Add reverb to drums for atmosphere

## AVAILABLE SYNTH PRESETS
${capabilities.synthPresets.join(', ')}

## MIXER EFFECTS (TrackEffects)
Each playlist track can have these effects:
- volume: 0.0-1.5 (default 1.0)
- pan: -1.0 to 1.0 (default 0.0)
- lowpass: 100-20000 Hz (default 20000)
- highpass: 20-10000 Hz (default 20)
- reverb: 0.0-1.0 (default 0.0)
- delay: 0.0-1.0 (default 0.0)
- distortion: 0.0-1.0 (default 0.0)

## AVAILABLE COMMANDS

### Transport
- play: Start playback. Parameters: none
- stop: Stop playback. Parameters: none
- pause: Pause playback. Parameters: none
- setBpm: Set tempo. Parameters: {{{{ bpm: number }}}}
- setPosition: Seek to position. Parameters: {{{{ tick: number }}}}
- toggleMetronome: Toggle metronome. Parameters: none

### Patterns
- addPattern: Create pattern. Parameters: {{{{ name?: string, lengthInSteps?: number }}}}
- deletePattern: Delete pattern. Parameters: {{{{ patternId: string }}}}
- selectPattern: Select pattern. Parameters: {{{{ patternId: string }}}}
- setPatternLength: Set length. Parameters: {{{{ patternId: string, lengthInSteps: number }}}}

### Notes (in patterns)
- addNote: Add note. Parameters: {{{{ patternId: string, pitch: number, startTick: number, durationTick: number, velocity?: number }}}}
- addNoteSequence: Add multiple notes. Parameters: {{{{ patternId: string, notes: Array }}}}
- deleteNote: Remove note. Parameters: {{{{ patternId: string, noteId: string }}}}
- clearPatternNotes: Clear pattern. Parameters: {{{{ patternId: string }}}}

### Channels (instruments)
- addChannel: Create channel. Parameters: {{{{ name?: string, type: "synth" | "sampler", preset?: string }}}}
- deleteChannel: Remove channel. Parameters: {{{{ channelId: string }}}}
- updateChannel: Update channel. Parameters: {{{{ channelId: string, name?: string, preset?: string }}}}
- setChannelVolume: Set volume. Parameters: {{{{ channelId: string, volume: number }}}}
- setChannelPan: Set pan. Parameters: {{{{ channelId: string, pan: number }}}}
- toggleChannelMute: Mute/unmute. Parameters: {{{{ channelId: string }}}}
- toggleChannelSolo: Solo/unsolo. Parameters: {{{{ channelId: string }}}}

### Playlist (arrangement)
- addPlaylistTrack: Add track. Parameters: {{{{ name?: string }}}}
- addClip: Add pattern clip. Parameters: {{{{ patternId: string, trackIndex: number, startTick: number }}}}
- moveClip: Move clip. Parameters: {{{{ clipId: string, trackIndex: number, startTick: number }}}}
- deleteClip: Remove clip. Parameters: {{{{ clipId: string }}}}
- setLoopRegion: Set loop. Parameters: {{{{ startTick: number, endTick: number }}}}
- togglePlaylistTrackMute: Mute track. Parameters: {{{{ trackId: string }}}}
- togglePlaylistTrackSolo: Solo track. Parameters: {{{{ trackId: string }}}}

### Samples (IMPORTANT - for adding audio samples)
- addAudioSample: Add sample from library. Parameters: {{{{ category: string, subcategory: string, trackIndex?: number, startTick?: number }}}}
  Note: Specify category/subcategory, the system will pick a random sample from that type.
  If trackIndex is omitted, a new track is created.

### Mixer Effects
- setTrackEffect: Set effect. Parameters: {{{{ trackId: string, effectKey: string, value: number }}}}
- resetTrackEffects: Reset effects. Parameters: {{{{ trackId: string }}}}
- setMasterVolume: Master volume. Parameters: {{{{ volume: number }}}}

### UI Navigation
- focusPanel: Focus panel. Parameters: {{{{ panel: "browser" | "channelRack" | "mixer" | "playlist" | "pianoRoll" | "chat" }}}}

### Special
- clarificationNeeded: When ambiguous. Parameters: {{{{ message: string, suggestedOptions?: string[] }}}}

## EXAMPLES

### Simple command:
User: "set tempo to 120"
Response:
{{{{
  "actions": [
    {{{{ "action": "setBpm", "parameters": {{{{ "bpm": 120 }}}} }}}}
  ],
  "confidence": 1.0,
  "reasoning": "Setting BPM to 120"
}}}}

### Creating a basic beat:
User: "make a simple hip hop beat"
Response:
{{{{
  "actions": [
    {{{{ "action": "setBpm", "parameters": {{{{ "bpm": 90 }}}} }}}},
    {{{{ "action": "addAudioSample", "parameters": {{{{ "category": "drums", "subcategory": "kick", "trackIndex": 0, "startTick": 0 }}}} }}}},
    {{{{ "action": "addAudioSample", "parameters": {{{{ "category": "drums", "subcategory": "kick", "trackIndex": 0, "startTick": 384 }}}} }}}},
    {{{{ "action": "addAudioSample", "parameters": {{{{ "category": "drums", "subcategory": "snare", "trackIndex": 1, "startTick": 192 }}}} }}}},
    {{{{ "action": "addAudioSample", "parameters": {{{{ "category": "drums", "subcategory": "snare", "trackIndex": 1, "startTick": 576 }}}} }}}},
    {{{{ "action": "addAudioSample", "parameters": {{{{ "category": "drums", "subcategory": "hihat", "trackIndex": 2, "startTick": 0 }}}} }}}},
    {{{{ "action": "addAudioSample", "parameters": {{{{ "category": "drums", "subcategory": "hihat", "trackIndex": 2, "startTick": 96 }}}} }}}},
    {{{{ "action": "addAudioSample", "parameters": {{{{ "category": "drums", "subcategory": "hihat", "trackIndex": 2, "startTick": 192 }}}} }}}},
    {{{{ "action": "addAudioSample", "parameters": {{{{ "category": "drums", "subcategory": "hihat", "trackIndex": 2, "startTick": 288 }}}} }}}}
  ],
  "confidence": 0.85,
  "reasoning": "Creating a boom-bap style beat with kick on 1 and 3, snare on 2 and 4, hi-hats on every beat"
}}}}

### Adding a pattern to a track:
User: "drop a piano pattern on track 2"
Response:
{{{{
  "actions": [
    {{{{ "action": "addPattern", "parameters": {{{{ "name": "Piano Pattern" }}}} }}}},
    {{{{ "action": "addChannel", "parameters": {{{{ "name": "Piano", "type": "synth", "preset": "piano" }}}} }}}}
  ],
  "confidence": 0.9,
  "reasoning": "Creating a piano pattern and instrument channel"
}}}}

Remember: 
- ALWAYS use the "actions" array format
- Return ONLY valid JSON, no markdown code blocks
- Use category/subcategory for samples, not specific IDs
- Be generous with the number of actions for complex requests`;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Convert musical time to ticks
 * @param bars Number of bars
 * @param beats Beats within the bar (0-indexed)
 * @param ppq Pulses per quarter note (default 96)
 * @param beatsPerBar Beats per bar (default 4)
 */
export function musicalTimeToTicks(
    bars: number,
    beats: number = 0,
    ppq: number = 96,
    beatsPerBar: number = 4
): number {
    return (bars * beatsPerBar + beats) * ppq;
}

/**
 * Convert ticks to musical time
 */
export function ticksToMusicalTime(
    ticks: number,
    ppq: number = 96,
    beatsPerBar: number = 4
): { bars: number; beats: number; ticks: number } {
    const totalBeats = Math.floor(ticks / ppq);
    const remainingTicks = ticks % ppq;
    const bars = Math.floor(totalBeats / beatsPerBar);
    const beats = totalBeats % beatsPerBar;

    return { bars, beats, ticks: remainingTicks };
}

/**
 * Convert seconds to ticks based on BPM
 */
export function secondsToTicks(seconds: number, bpm: number, ppq: number = 96): number {
    const beatsPerSecond = bpm / 60;
    const totalBeats = seconds * beatsPerSecond;
    return Math.round(totalBeats * ppq);
}

/**
 * Convert ticks to seconds based on BPM
 */
export function ticksToSeconds(ticks: number, bpm: number, ppq: number = 96): number {
    const totalBeats = ticks / ppq;
    const beatsPerSecond = bpm / 60;
    return totalBeats / beatsPerSecond;
}

/**
 * Resolve a sample by fuzzy matching
 * Tries to find the best match for a natural language sample description
 */
export function resolveSampleByDescription(
    description: string,
    catalog: SampleCatalog
): SampleEntry | null {
    const searchTerms = description.toLowerCase().split(/\s+/);

    let bestMatch: SampleEntry | null = null;
    let bestScore = 0;

    for (const category of catalog.categories) {
        for (const subcat of category.subcategories) {
            for (const sample of subcat.samples) {
                let score = 0;
                const sampleText = `${category.name} ${subcat.name} ${sample.name}`.toLowerCase();

                for (const term of searchTerms) {
                    if (sampleText.includes(term)) {
                        score += 1;
                        // Bonus for exact subcategory match
                        if (subcat.name.toLowerCase() === term) {
                            score += 2;
                        }
                        // Bonus for category match
                        if (category.name.toLowerCase() === term) {
                            score += 1;
                        }
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = sample;
                }
            }
        }
    }

    return bestScore > 0 ? bestMatch : null;
}
