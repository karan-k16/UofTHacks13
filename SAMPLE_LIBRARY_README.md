# Sample Library Setup

This guide explains how to download and set up the preloaded sample library for Pulse Studio.

## Quick Start

1. **Run the download script:**
   ```bash
   cd C:\Users\khann\OneDrive\Documents\GitHub\UofTHacks
   node scripts/download-samples.js
   ```

2. **Wait for completion:**
   - The script will download samples from Freesound API
   - Downloads are organized by category (drums, instruments, synth, orchestral, fx)
   - Progress is shown for each category
   - Takes approximately 10-15 minutes depending on connection

3. **Samples are saved to:**
   ```
   public/samples/
   ├── drums/
   │   ├── kick/
   │   ├── snare/
   │   ├── hihat_closed/
   │   ├── hihat_open/
   │   ├── clap/
   │   └── perc/
   ├── instruments/
   │   ├── piano/
   │   ├── epiano/
   │   ├── bass/
   │   ├── guitar_clean/
   │   └── guitar_pluck/
   ├── synth/
   │   ├── wavetables/
   │   └── presets/
   │       ├── lead/
   │       └── bass/
   ├── orchestral/
   │   ├── strings/
   │   ├── brass/
   │   └── woodwinds/
   └── fx/
   ```

## Sample Library Specification

The download script uses these search criteria:

### Drums (12 samples each)
- **Kicks**: One-shot kick drums, peak normalized
- **Snares**: One-shot snare drums, peak normalized
- **Hi-hats (Closed)**: Short closed hi-hat sounds
- **Hi-hats (Open)**: Open hi-hat sounds
- **Claps**: Hand clap samples
- **Percussion**: Various percussion one-shots

### Instruments (12 samples each)
- **Piano**: Acoustic piano notes
- **Electric Piano**: Rhodes/electric piano sounds
- **Bass**: Bass guitar and synth bass
- **Clean Guitar**: Clean guitar samples
- **Plucked Guitar**: Guitar pluck sounds

### Synth
- **Wavetables** (64 samples): Various synthesizer waveforms
- **Lead Presets** (12 samples): Synth lead sounds
- **Bass Presets** (12 samples): Synth bass sounds

### Orchestral (6 samples each)
- **Strings**: Violin, cello, string ensemble
- **Brass**: Trumpet, horn, brass ensemble
- **Woodwinds**: Flute, clarinet, woodwind ensemble

### FX (6 samples)
- Various sound effects

## Using the Sample Library

Once downloaded, samples will be available in the Browser panel:

1. Open Pulse Studio
2. Navigate to the Browser panel (left side)
3. Click the **Samples** tab
4. Switch to **📚 Library** view
5. Browse by category (Drums, Instruments, Synth, etc.)
6. Filter by subcategory (Kick, Snare, Piano, etc.)
7. Click a sample to load it

## API Information

- **API**: Freesound API v2
- **License**: All samples are from Freesound with appropriate licenses
- **Attribution**: Sample metadata includes author and license info
- **Quality**: High-quality preview files (MP3 HQ or OGG)

## Metadata

The download script generates `public/samples/library.json` with:
- Sample names and filenames
- Duration information
- Tags for searchability
- License and attribution
- Freesound IDs for reference

## Customization

To modify the sample library:

1. Edit `scripts/download-samples.js`
2. Modify the `SAMPLE_SPEC.targets` array
3. Change `count`, `query`, or `filter` parameters
4. Re-run the download script

## Troubleshooting

**Script fails with API error:**
- Check internet connection
- Verify Freesound API key is valid
- API might be rate-limited, wait and retry

**Not enough samples downloaded:**
- Some categories may have fewer available samples
- Try adjusting search queries in the script
- Check Freesound.org for available samples

**Samples not appearing in app:**
- Ensure `library.json` was created in `public/samples/`
- Check browser console for loading errors
- Refresh the page after downloading

## File Structure

```
scripts/
  └── download-samples.js        # Download script

public/samples/
  ├── library.json                # Metadata file
  ├── drums/
  ├── instruments/
  ├── synth/
  ├── orchestral/
  └── fx/

lib/audio/
  └── SampleLibrary.ts            # Sample library loader

components/panels/
  └── Browser.tsx                 # Updated with library view
```

## License & Attribution

All samples downloaded from Freesound are subject to their respective licenses:
- Creative Commons licenses (CC0, CC BY, CC BY-NC, etc.)
- Attribution information is stored in metadata
- View license details in the sample metadata

Always respect the original creators' licenses when using these samples.
