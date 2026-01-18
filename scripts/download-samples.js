/**
 * Freesound Sample Downloader
 * Downloads samples from Freesound API based on category specifications
 * 
 * Usage: node scripts/download-samples.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const FREESOUND_API_KEY = 'KcrANIECzS9Vs2zAX7LhLKOuQB8lez3X8AV6P7kF';
const BASE_URL = 'https://freesound.org/apiv2';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'samples');
const METADATA_FILE = path.join(OUTPUT_DIR, 'library.json');

// Sample specification
const SAMPLE_SPEC = {
    libraryName: "StockFactoryPack",
    targets: [
        // Drums
        { category: "drums/kick", count: 12, query: "kick drum", filter: "tag:kick OR tag:drum", duration_max: 2 },
        { category: "drums/snare", count: 12, query: "snare drum", filter: "tag:snare OR tag:drum", duration_max: 2 },
        { category: "drums/hihat_closed", count: 12, query: "closed hihat", filter: "tag:hihat OR tag:closed-hat", duration_max: 1 },
        { category: "drums/hihat_open", count: 12, query: "open hihat", filter: "tag:hihat OR tag:open-hat", duration_max: 2 },
        { category: "drums/clap", count: 12, query: "clap hand", filter: "tag:clap OR tag:handclap", duration_max: 1 },
        { category: "drums/perc", count: 12, query: "percussion one shot", filter: "tag:percussion", duration_max: 3 },

        // Instruments
        { category: "instruments/piano", count: 12, query: "piano note", filter: "tag:piano", duration_max: 10 },
        { category: "instruments/epiano", count: 12, query: "electric piano", filter: "tag:electric-piano OR tag:rhodes", duration_max: 10 },
        { category: "instruments/bass", count: 12, query: "bass note", filter: "tag:bass OR tag:synth-bass", duration_max: 10 },
        { category: "instruments/guitar_clean", count: 12, query: "clean guitar", filter: "tag:guitar AND tag:clean", duration_max: 10 },
        { category: "instruments/guitar_pluck", count: 12, query: "guitar pluck", filter: "tag:guitar AND tag:pluck", duration_max: 5 },

        // Synth
        { category: "synth/wavetables", count: 64, query: "synthesizer wave", filter: "tag:synthesizer OR tag:synth", duration_max: 5 },
        { category: "synth/presets/lead", count: 12, query: "synth lead", filter: "tag:synth AND tag:lead", duration_max: 10 },
        { category: "synth/presets/bass", count: 12, query: "synth bass", filter: "tag:synth AND tag:bass", duration_max: 10 },

        // Orchestral
        { category: "orchestral/strings", count: 6, query: "strings sustain", filter: "tag:strings OR tag:violin OR tag:cello", duration_min: 2 },
        { category: "orchestral/brass", count: 6, query: "brass sustain", filter: "tag:brass OR tag:trumpet OR tag:horn", duration_min: 2 },
        { category: "orchestral/woodwinds", count: 6, query: "woodwind sustain", filter: "tag:woodwind OR tag:flute OR tag:clarinet", duration_min: 2 },

        // FX
        { category: "fx", count: 6, query: "sound effect", filter: "tag:sound-effect OR tag:fx", duration_max: 5 }
    ]
};

// Utility: Download file from URL
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { }); // Delete the file async
            reject(err);
        });
    });
}

// Utility: API request
function apiRequest(endpoint, params = {}) {
    return new Promise((resolve, reject) => {
        const queryString = new URLSearchParams({
            ...params,
            token: FREESOUND_API_KEY
        }).toString();

        const url = `${BASE_URL}${endpoint}?${queryString}`;

        https.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                if (response.statusCode !== 200) {
                    reject(new Error(`API Error: ${response.statusCode} - ${data}`));
                    return;
                }

                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(new Error('Failed to parse JSON response'));
                }
            });
        }).on('error', reject);
    });
}

// Search for sounds matching criteria
async function searchSounds(query, filter, count, durationMin, durationMax) {
    const params = {
        query: query,
        filter: filter,
        sort: 'rating_desc',
        fields: 'id,name,previews,duration,tags,license,username',
        page_size: Math.min(count * 3, 150) // Get more than needed for filtering
    };

    if (durationMin) {
        params.filter += ` duration:[${durationMin} TO *]`;
    }
    if (durationMax) {
        params.filter += ` duration:[* TO ${durationMax}]`;
    }

    try {
        const results = await apiRequest('/search/text/', params);
        return results.results || [];
    } catch (error) {
        console.error(`Search failed for "${query}":`, error.message);
        return [];
    }
}

// Download samples for a category
async function downloadCategory(target, metadata) {
    console.log(`\n📁 Processing: ${target.category}`);
    console.log(`   Target: ${target.count} samples`);

    const categoryPath = path.join(OUTPUT_DIR, target.category);

    // Ensure directory exists
    if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
    }

    // Search for sounds
    console.log(`   🔍 Searching Freesound...`);
    const sounds = await searchSounds(
        target.query,
        target.filter,
        target.count,
        target.duration_min,
        target.duration_max
    );

    if (sounds.length === 0) {
        console.log(`   ⚠️  No sounds found!`);
        return;
    }

    console.log(`   Found ${sounds.length} candidates`);

    // Download up to the target count
    const downloadedSamples = [];
    let downloadCount = 0;

    for (const sound of sounds) {
        if (downloadCount >= target.count) break;

        try {
            // Prefer high quality preview (mp3-hq or ogg)
            const previewUrl = sound.previews['preview-hq-mp3'] ||
                sound.previews['preview-hq-ogg'] ||
                sound.previews['preview-lq-mp3'];

            if (!previewUrl) {
                console.log(`   ⚠️  No preview available for: ${sound.name}`);
                continue;
            }

            // Sanitize filename
            const sanitizedName = sound.name
                .replace(/[^a-z0-9_\-\.]/gi, '_')
                .replace(/_+/g, '_')
                .substring(0, 50);

            const ext = previewUrl.includes('.ogg') ? '.ogg' : '.mp3';
            const filename = `${String(downloadCount + 1).padStart(2, '0')}_${sanitizedName}${ext}`;
            const filepath = path.join(categoryPath, filename);

            // Download
            console.log(`   ⬇️  Downloading: ${filename}`);
            await downloadFile(previewUrl, filepath);

            // Add to metadata
            downloadedSamples.push({
                id: `${target.category.replace(/\//g, '_')}_${downloadCount}`,
                name: sound.name,
                filename: filename,
                path: `/samples/${target.category}/${filename}`,
                duration: sound.duration,
                tags: sound.tags,
                license: sound.license,
                author: sound.username,
                freesoundId: sound.id
            });

            downloadCount++;

            // Add small delay to be respectful to API
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`   ❌ Failed to download ${sound.name}:`, error.message);
        }
    }

    console.log(`   ✅ Downloaded ${downloadCount}/${target.count} samples`);

    // Add to metadata
    const categoryName = target.category.split('/').pop();
    const mainCategory = target.category.split('/')[0];

    if (!metadata.categories[mainCategory]) {
        metadata.categories[mainCategory] = {};
    }

    metadata.categories[mainCategory][categoryName] = downloadedSamples;
    metadata.totalSamples += downloadCount;
}

// Main function
async function main() {
    console.log('🎵 Freesound Sample Downloader');
    console.log('================================\n');

    // Initialize metadata
    const metadata = {
        libraryName: SAMPLE_SPEC.libraryName,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        totalSamples: 0,
        categories: {}
    };

    // Process each category
    for (const target of SAMPLE_SPEC.targets) {
        await downloadCategory(target, metadata);
    }

    // Save metadata
    console.log('\n💾 Saving metadata...');
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));

    console.log('\n✨ Download Complete!');
    console.log(`Total samples downloaded: ${metadata.totalSamples}`);
    console.log(`Metadata saved to: ${METADATA_FILE}`);
}

// Run
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
