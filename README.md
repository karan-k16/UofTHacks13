# Pulse Studio

A professional browser-based Digital Audio Workstation (DAW) built with modern web technologies.

![Pulse Studio](public/icons/logo.svg)

## Features

- **Playlist Timeline** - Arrange pattern clips and audio on multiple tracks
- **Channel Rack** - Step sequencer with 16+ step patterns per channel
- **Piano Roll** - MIDI note editing with velocity control
- **Mixer** - Full mixing console with inserts, sends, and routing
- **Built-in Instruments** - Basic synth and sampler instruments
- **Effects** - EQ, Compressor, Reverb, and Delay
- **Audio Recording** - Record from microphone directly to tracks
- **Export** - Render to WAV and MP3

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand with Immer
- **Audio Engine**: Tone.js
- **Docking Layout**: react-mosaic-component
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with RLS)
- **Storage**: Supabase Storage (samples, renders)
- **Authentication**: Supabase Auth (Magic Links)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/pulse-studio.git
cd pulse-studio
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy `env.example.txt` to `.env.local` and fill in your Supabase credentials:

```bash
cp env.example.txt .env.local
```

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up the database:

Run the SQL migrations in your Supabase dashboard or using the Supabase CLI:

```bash
# Using Supabase CLI
supabase db push
```

Or manually run the SQL files in:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`

5. Create Storage Buckets:

In your Supabase dashboard, create two storage buckets:
- `samples` - For uploaded audio samples
- `renders` - For exported audio files

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Mode

Click "Start Creating" on the home page to load a demo project. The app works fully in demo mode without authentication - projects are stored locally in memory.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play/Pause |
| `Enter` | Stop and return to start |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + S` | Save project |
| `Delete` | Delete selection |
| `Escape` | Clear selection |
| `G` | Toggle snap to grid |
| `M` | Toggle metronome |
| `Ctrl/Cmd + Scroll` | Zoom timeline |

## Project Structure

```
pulse-studio/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   └── page.tsx           # Main app page
├── components/
│   ├── layout/            # Layout components
│   ├── panels/            # DAW panels (Browser, Channel Rack, etc.)
│   ├── transport/         # Transport controls
│   └── common/            # Reusable UI components
├── lib/
│   ├── audio/             # Audio engine (Tone.js wrapper)
│   ├── supabase/          # Supabase clients
│   ├── export/            # Audio export utilities
│   └── utils/             # General utilities
├── state/
│   ├── store.ts           # Zustand store
│   ├── shortcuts.ts       # Keyboard shortcuts
│   └── undoRedo.ts        # Undo/Redo logic
├── domain/
│   ├── types.ts           # TypeScript types
│   ├── validators.ts      # Validation functions
│   └── operations.ts      # Domain operations
├── supabase/
│   └── migrations/        # SQL migrations
├── public/
│   └── icons/             # SVG icons
└── tests/
    ├── unit/              # Unit tests (Vitest)
    └── e2e/               # E2E tests (Playwright)
```

## Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Production build
npm start            # Start production server

# Testing
npm test             # Run unit tests
npm run test:e2e     # Run E2E tests

# Code Quality
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

## Audio Engine Architecture

The audio engine wraps Tone.js and provides:

- **Transport**: Play, stop, seek, loop control
- **Scheduling**: Pattern-based event scheduling using Tone.Transport
- **Instruments**: PolySynth and Sampler instruments
- **Effects**: EQ3, Compressor, Reverb, FeedbackDelay
- **Mixer**: Channel routing, gain staging, metering
- **Offline Rendering**: Render to WAV using Tone.Offline

## Data Model

### Project
- Patterns (step sequencer + piano roll notes)
- Channels (instruments)
- Playlist (tracks + clips)
- Mixer (tracks + inserts + sends)
- Assets (audio files)

### Persistence
- Projects stored as JSONB in PostgreSQL
- Audio files in Supabase Storage
- Row Level Security ensures data isolation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [Tone.js](https://tonejs.github.io/) - Web Audio framework
- [react-mosaic-component](https://github.com/nomcopter/react-mosaic) - Docking layout
- [Supabase](https://supabase.com/) - Backend as a Service
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

Built with ❤️ by the Pulse Studio team

