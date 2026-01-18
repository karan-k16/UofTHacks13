/**
 * Sample Resolver - Intelligent sample matching for AI commands
 * 
 * Provides fuzzy matching and search capabilities to help the AI
 * find samples even when the exact ID isn't provided.
 */

import type { SampleLibrary, SampleMetadata } from '@/lib/audio/SampleLibrary';

export interface SampleMatch {
    sample: SampleMetadata;
    score: number;
    matchType: 'exact' | 'id' | 'name' | 'category' | 'fuzzy';
}

/**
 * Find a sample by various matching strategies
 * 
 * @param library - The loaded sample library
 * @param query - Search query (can be ID, name, category, or description)
 * @returns Best matching sample or null
 */
export function findSample(
    library: SampleLibrary,
    query: string
): SampleMetadata | null {
    const matches = searchSamples(library, query, 1);
    const firstMatch = matches[0];
    return firstMatch ? firstMatch.sample : null;
}

/**
 * Search for samples with scoring
 * 
 * @param library - The loaded sample library
 * @param query - Search query
 * @param limit - Maximum results to return
 * @returns Array of matches sorted by score
 */
export function searchSamples(
    library: SampleLibrary,
    query: string,
    limit: number = 5
): SampleMatch[] {
    const normalizedQuery = query.toLowerCase().trim();
    const queryWords = normalizedQuery.split(/\s+/);
    const matches: SampleMatch[] = [];

    for (const [categoryName, subcategories] of Object.entries(library.categories)) {
        if (!subcategories) continue;

        for (const [subcategoryName, samples] of Object.entries(subcategories)) {
            for (const sample of samples) {
                const match = scoreSampleMatch(
                    sample,
                    categoryName,
                    subcategoryName,
                    normalizedQuery,
                    queryWords
                );

                if (match.score > 0) {
                    matches.push(match);
                }
            }
        }
    }

    // Sort by score (descending) and return top results
    return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Score how well a sample matches the query
 */
function scoreSampleMatch(
    sample: SampleMetadata,
    category: string,
    subcategory: string,
    query: string,
    queryWords: string[]
): SampleMatch {
    let score = 0;
    let matchType: SampleMatch['matchType'] = 'fuzzy';

    const sampleId = sample.id.toLowerCase();
    const sampleName = sample.name.toLowerCase();
    const categoryLower = category.toLowerCase();
    const subcategoryLower = subcategory.toLowerCase();

    // Exact ID match (highest priority)
    if (sampleId === query) {
        return { sample, score: 100, matchType: 'exact' };
    }

    // Partial ID match
    if (sampleId.includes(query) || query.includes(sampleId)) {
        score += 50;
        matchType = 'id';
    }

    // Exact name match
    if (sampleName === query) {
        return { sample, score: 95, matchType: 'name' };
    }

    // Name contains query
    if (sampleName.includes(query)) {
        score += 40;
        matchType = 'name';
    }

    // Category/subcategory match (e.g., "kick", "snare", "hihat")
    if (subcategoryLower === query) {
        score += 35;
        matchType = 'category';
    }
    if (categoryLower === query) {
        score += 30;
        matchType = 'category';
    }

    // Word-by-word matching
    for (const word of queryWords) {
        if (word.length < 2) continue;

        // Subcategory match (e.g., "kick", "snare")
        if (subcategoryLower.includes(word)) {
            score += 15;
        }

        // Category match (e.g., "drums", "fx")
        if (categoryLower.includes(word)) {
            score += 10;
        }

        // Name match
        if (sampleName.includes(word)) {
            score += 10;
        }

        // Common musical term aliases
        const aliases: Record<string, string[]> = {
            kick: ['bass drum', 'bd', 'bassdrum'],
            snare: ['snr', 'sd'],
            hihat: ['hi-hat', 'hh', 'hat'],
            clap: ['handclap', 'cp'],
            tom: ['floor tom', 'hi tom', 'mid tom'],
            cymbal: ['crash', 'ride'],
            bass: ['sub', 'low'],
            pad: ['atmosphere', 'ambient'],
            lead: ['synth lead', 'melody'],
            strings: ['orchestra', 'violin', 'cello'],
            brass: ['trumpet', 'trombone', 'horn'],
            piano: ['keys', 'keyboard'],
            guitar: ['gtr', 'acoustic'],
        };

        // Check aliases
        for (const [canonical, aliasList] of Object.entries(aliases)) {
            if (aliasList.includes(word) || word === canonical) {
                if (subcategoryLower.includes(canonical) || categoryLower.includes(canonical)) {
                    score += 12;
                }
            }
        }
    }

    // Tag matching (if sample has tags)
    if (sample.tags && sample.tags.length > 0) {
        for (const tag of sample.tags) {
            const tagLower = tag.toLowerCase();
            if (tagLower.includes(query) || query.includes(tagLower)) {
                score += 8;
            }
            for (const word of queryWords) {
                if (tagLower.includes(word)) {
                    score += 5;
                }
            }
        }
    }

    return { sample, score, matchType };
}

/**
 * Get a random sample from a category
 * Supports fuzzy subcategory matching (e.g., "hihat" matches "hihat_closed", "hihat_open")
 */
export function getRandomFromCategory(
    library: SampleLibrary,
    category: string,
    subcategory?: string
): SampleMetadata | null {
    const categoryData = library.categories[category.toLowerCase()];
    if (!categoryData) return null;

    let samples: SampleMetadata[] = [];
    const normalizedSubcat = subcategory?.toLowerCase();

    if (normalizedSubcat) {
        // First try exact match
        if (categoryData[normalizedSubcat]) {
            samples = categoryData[normalizedSubcat];
        } else {
            // Fuzzy match: find subcategories that contain or start with the query
            // e.g., "hihat" matches "hihat_closed", "hihat_open"
            // Also handle common aliases
            const aliases: Record<string, string[]> = {
                hihat: ['hihat_closed', 'hihat_open', 'hh', 'hat'],
                'hi-hat': ['hihat_closed', 'hihat_open'],
                hh: ['hihat_closed', 'hihat_open'],
                hat: ['hihat_closed', 'hihat_open'],
                perc: ['perc', 'percussion'],
                percussion: ['perc'],
            };

            const aliasMatches = aliases[normalizedSubcat] || [];

            for (const [subcatName, subcatSamples] of Object.entries(categoryData)) {
                const subcatLower = subcatName.toLowerCase();
                // Match if: exact match, starts with query, contains query, or matches an alias
                if (
                    subcatLower === normalizedSubcat ||
                    subcatLower.startsWith(normalizedSubcat) ||
                    subcatLower.includes(normalizedSubcat) ||
                    normalizedSubcat.startsWith(subcatLower) ||
                    aliasMatches.includes(subcatLower)
                ) {
                    samples.push(...subcatSamples);
                }
            }
        }
    }

    // If still no samples and we have a subcategory query, try without it
    if (samples.length === 0) {
        // Get all samples from all subcategories
        for (const subcat of Object.values(categoryData)) {
            samples.push(...subcat);
        }
    }

    if (samples.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * samples.length);
    return samples[randomIndex] ?? null;
}

/**
 * Get sample categories for AI context
 */
export function getCategoryStructure(library: SampleLibrary): Record<string, string[]> {
    const structure: Record<string, string[]> = {};

    for (const [category, subcategories] of Object.entries(library.categories)) {
        if (!subcategories) continue;
        structure[category] = Object.keys(subcategories);
    }

    return structure;
}

/**
 * Create a compact sample index for AI context
 * This is a smaller representation than the full library
 */
export function createCompactIndex(library: SampleLibrary): string {
    const lines: string[] = [];

    for (const [category, subcategories] of Object.entries(library.categories)) {
        if (!subcategories) continue;

        for (const [subcategory, samples] of Object.entries(subcategories)) {
            const sampleIds = samples.map(s => s.id);
            lines.push(`${category}/${subcategory}: ${sampleIds.join(', ')}`);
        }
    }

    return lines.join('\n');
}
