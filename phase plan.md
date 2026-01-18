# Pulse Studio — Phase Plan (5-Person Parallel Work Split)

## Current State (reconciled vs `FEATURES.md`)

Some items marked “missing” in `FEATURES.md` are already implemented in code:

- **Instrument settings editor exists** (`InstrumentSettingsModal`) and updates channel synth/sampler params.
- **Sampler sample assignment exists** via drag/drop + modal.
- **Audio clips exist** (`clip.type === 'audio'`) via dropping samples; playback scheduling exists in the audio engine.
- **Export dialog exists** and exports **WAV** via offline rendering.
- **Supabase backend routes exist** (projects/assets/auth), but the main app flow still runs “demo/local” for save/load.

## What’s still actually missing (real gaps)

### Audio recording workflow (core gap)
- Recorder class exists but **store/UI does not wire it**.
- Missing: input selection, level monitoring UI, punch in/out, count-in, metronome during record, recorded clip inserted into playlist as audio.

### Tone.js integration cleanup (stability gap)
- App currently uses **CDN workaround** in multiple places even though `tone` is installed.
- Needs one consistent strategy for Tone usage across `AudioEngine`, `OfflineRenderer`, and any preview/recorder code paths.

### Playlist editing polish
- Missing: loop region markers + selection, cutting/splitting, drag-box selection, clip color editing, better audio clip previews/waveforms.

### Piano roll advanced tools
- Missing: quantize UI (logic exists but UI is absent), drag-box selection, ghost notes, arpeggiator/chord mode.

### Mixer workflow
- Missing: send routing UI, effect presets, effect drag reordering, master output UX polish.

### Browser panel
- “Presets” tab is not functional yet.
- Missing: search/filter, favorites/tags.

### Cloud “real app” mode
- Missing: project save/load/autosave wiring in the actual UI flow.
- Missing: sample storage in Supabase (client-side upload path), render uploads (server route provides signed URLs but client doesn’t use them).

---

## Team of 5 — Ownership Split (to work in parallel with minimal merge conflicts)

### Person 1 — Audio Core / Tone.js
**Owns**: `lib/audio/*`, audio init path in `app/page.tsx`

**Goal**: Audio always initializes and stays consistent; single Tone strategy; playback/export/recording behave reliably.

### Person 2 — Playlist & Arrangement UX
**Owns**: `components/panels/Playlist.tsx` (and small shared UI helpers as needed)

**Goal**: Arrangement editing is fluid (loop, split, select, color, waveforms).

### Person 3 — Mixer, FX, Routing
**Owns**: `components/panels/Mixer.tsx` + related mixer UI components

**Goal**: Mixing feels real (sends, master controls, presets, reorder).

### Person 4 — Supabase / Persistence / Auth
**Owns**: `app/api/**`, `lib/supabase/**`, auth flows, project lifecycle wiring

**Goal**: Login → project list → save/load/autosave → assets/renders stored and retrievable.

### Person 5 — QA / DevEx / Docs
**Owns**: `tests/**`, docs updates (`README`, `FEATURES`), sanity/perf checks

**Goal**: Core flows are testable, regression-resistant, and accurately documented.

**Parallel-work rule**: Each person primarily edits their owned folders. Cross-cutting changes happen through agreed interfaces in `domain/types.ts` and `state/store.ts`.

---

## Phased Plan (everyone contributes every phase)

### Phase 0 — Interfaces & Alignment (0.5–1 day)
**Goal**: prevent merge conflicts and avoid building on shifting assumptions.

- **Person 1**: Decide the Tone strategy (npm import vs CDN), define “single source of truth” for Tone access.
- **Person 4**: Define the project persistence contract (which routes are used when; payload shapes; error handling).
- **Person 2**: Define clip editing primitives (split semantics, clip color persistence, box selection state shape).
- **Person 3**: Define send UI requirements + effect reorder/preset model.
- **Person 5**: Write a “Definition of Done” checklist + outline E2E happy paths.

**Deliverable**: a short spec everyone agrees on so Phase 1 can run independently.

### Phase 1 — Stabilize Foundations
**Goal**: make sure audio/auth/project plumbing is solid so later features aren’t wasted.

- **Person 1 (Audio)**: unify Tone loading; make `AudioEngine` / `OfflineRenderer` / recorder consistent; remove duplicate loaders.
- **Person 4 (Cloud)**: wire auth state into the app flow (demo still exists, but “real mode” works end-to-end for listing projects).
- **Person 2 (Playlist)**: add loop region UI scaffolding (visual markers + store wiring), no splitting yet.
- **Person 3 (Mixer)**: add send routing UI skeleton (read-only view + placeholder), prep for controls in Phase 2.
- **Person 5 (QA)**: add smoke tests for start, play/pause, create clip, export WAV.

**Exit criteria**:
- Audio reliably initializes.
- Logged-in users can list projects.
- No major UI regressions; core actions remain stable.

### Phase 2 — Core Workflow Completion (“DAW feels complete”)
**Goal**: deliver the main demo flows end-to-end.

- **Person 1 (Audio)**: implement recording pipeline (mic select, monitoring, record to WAV, create audio asset + playlist audio clip, metronome/count-in hooks).
- **Person 2 (Playlist)**: splitting/cutting, drag-box selection, clip color editing, better audio clip waveforms/previews.
- **Person 3 (Mixer)**: real send controls (pre/post optional), master output UX, effect reorder, effect presets persisted in project JSON.
- **Person 4 (Cloud)**: autosave + save/load integration into store actions; assets upload to Supabase Storage (signed upload route); optional render upload integration.
- **Person 5 (QA)**: regression suite for playlist editing + recording + save/load; unit tests around domain ops (split/quantize).

**Exit criteria**:
- Record → clip appears → plays back.
- Save/load preserves recorded audio + arrangement.
- Common editing operations are usable.

### Phase 3 — Export & “Production Mode”
**Goal**: match README claims (WAV + MP3) and enable optional cloud-stored renders.

- **Person 1**: harden offline rendering timing and long-project stability.
- **Person 2**: loop-range export selection UX (export loop vs full song).
- **Person 3**: stems export UX (per-track) if desired, or polish master export.
- **Person 4**: MP3 export option using `lib/export/mp3Encoder.ts` + optional upload to `renders` via signed URL route.
- **Person 5**: E2E tests for WAV/MP3 export + (optional) uploaded render retrieval.

**Exit criteria**:
- WAV and MP3 export both work.
- Optional: exported files can be uploaded and later fetched via signed URLs.

### Phase 4 — Nice-to-have / Polish
**Goal**: only after core demo flows are reliable.

- **Person 2**: piano roll ghost notes / chord / arp (if time).
- **Person 3**: mixer QoL (preset browser polish, reorder UX).
- **Person 4**: sharing/versioning (basic snapshot list).
- **Person 1**: performance improvements (buffer cache, scheduling, UI sync).
- **Person 5**: documentation/help content + perf benchmarks.

---

## Notes
- `FEATURES.md` should be updated to reflect that instrument settings, sampler assignment, audio clips, and WAV export are already present.
- The biggest “demo-risk” items are: recording integration, consistent Tone initialization, and real save/load wiring.
