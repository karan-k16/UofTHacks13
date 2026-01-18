/**
 * Regenerate Sample Library JSON
 * Scans the actual files in public/samples and regenerates library.json
 * 
 * Usage: node scripts/regenerate-library.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'samples');
const METADATA_FILE = path.join(OUTPUT_DIR, 'library.json');

// Categories and their subcategories to scan
const CATEGORY_STRUCTURE = {
    'drums': ['kick', 'snare', 'hihat_closed', 'hihat_open', 'clap', 'perc'],
    'instruments': ['piano', 'epiano', 'bass', 'guitar_clean', 'guitar_pluck'],
    'synth': ['wavetables', 'presets'],
    'orchestral': ['strings', 'brass', 'woodwinds'],
    'fx': []  // Direct files in fx folder
};

function scanDirectory(dirPath) {
    const samples = [];

    if (!fs.existsSync(dirPath)) {
        return samples;
    }

    const files = fs.readdirSync(dirPath).filter(f =>
        f.endsWith('.mp3') || f.endsWith('.ogg') || f.endsWith('.wav')
    ).sort();

    files.forEach((file, index) => {
        const filePath = path.join(dirPath, file);
        const relativePath = path.relative(OUTPUT_DIR, filePath).replace(/\\/g, '/');

        // Extract name from filename (remove number prefix and extension)
        const nameMatch = file.match(/^\\d+[-_](.+)\\.(mp3|ogg|wav)$/i);
        const displayName = nameMatch
            ? nameMatch[1].replace(/[-_]/g, ' ').replace(/\\s+/g, ' ').trim()
            : file.replace(/\\.(mp3|ogg|wav)$/i, '');

        samples.push({
            id: `${relativePath.replace(/[\\/\\.]/g, '_')}_${index}`,
            name: displayName,
            filename: file,
            path: `/samples/${relativePath}`,
            duration: 1.0,  // Default duration (actual duration requires audio parsing)
            tags: [],
            license: 'Unknown',
            author: 'Unknown'
        });
    });

    return samples;
}

function main() {
    console.log('🔄 Regenerating library.json from disk files...\\n');

    const metadata = {
        libraryName: 'StockFactoryPack',
        version: '1.0.1',
        createdAt: new Date().toISOString(),
        totalSamples: 0,
        categories: {}
    };

    for (const [category, subcategories] of Object.entries(CATEGORY_STRUCTURE)) {
        metadata.categories[category] = {};

        if (subcategories.length === 0) {
            // Direct files in category folder
            const categoryPath = path.join(OUTPUT_DIR, category);
            const samples = scanDirectory(categoryPath);
            if (samples.length > 0) {
                metadata.categories[category]['default'] = samples;
                metadata.totalSamples += samples.length;
                console.log(`  ${category}: ${samples.length} samples`);
            }
        } else {
            // Scan subcategories
            for (const sub of subcategories) {
                const subPath = path.join(OUTPUT_DIR, category, sub);
                const samples = scanDirectory(subPath);
                if (samples.length > 0) {
                    metadata.categories[category][sub] = samples;
                    metadata.totalSamples += samples.length;
                    console.log(`  ${category}/${sub}: ${samples.length} samples`);
                }
            }
        }

        // Check for additional subdirectories not in CATEGORY_STRUCTURE
        const categoryPath = path.join(OUTPUT_DIR, category);
        if (fs.existsSync(categoryPath)) {
            const dirs = fs.readdirSync(categoryPath).filter(f => {
                const fullPath = path.join(categoryPath, f);
                return fs.statSync(fullPath).isDirectory() && !subcategories.includes(f);
            });

            for (const dir of dirs) {
                const subPath = path.join(categoryPath, dir);
                const samples = scanDirectory(subPath);
                if (samples.length > 0) {
                    metadata.categories[category][dir] = samples;
                    metadata.totalSamples += samples.length;
                    console.log(`  ${category}/${dir}: ${samples.length} samples (discovered)`);
                }
            }
        }
    }

    // Also check for any top-level categories we might have missed
    const topLevelDirs = fs.readdirSync(OUTPUT_DIR).filter(f => {
        const fullPath = path.join(OUTPUT_DIR, f);
        return fs.statSync(fullPath).isDirectory() && !Object.keys(CATEGORY_STRUCTURE).includes(f);
    });

    for (const dir of topLevelDirs) {
        const categoryPath = path.join(OUTPUT_DIR, dir);
        metadata.categories[dir] = {};

        const subDirs = fs.readdirSync(categoryPath).filter(f =>
            fs.statSync(path.join(categoryPath, f)).isDirectory()
        );

        if (subDirs.length > 0) {
            for (const sub of subDirs) {
                const samples = scanDirectory(path.join(categoryPath, sub));
                if (samples.length > 0) {
                    metadata.categories[dir][sub] = samples;
                    metadata.totalSamples += samples.length;
                    console.log(`  ${dir}/${sub}: ${samples.length} samples (discovered)`);
                }
            }
        } else {
            const samples = scanDirectory(categoryPath);
            if (samples.length > 0) {
                metadata.categories[dir]['default'] = samples;
                metadata.totalSamples += samples.length;
                console.log(`  ${dir}: ${samples.length} samples (discovered)`);
            }
        }
    }

    // Save the updated metadata
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 4));

    console.log(`\\n✅ Regenerated library.json`);
    console.log(`Total samples indexed: ${metadata.totalSamples}`);
}

main();
