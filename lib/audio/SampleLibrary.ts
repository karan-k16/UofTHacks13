/**
 * Sample Library Loader
 * Handles loading and managing preloaded sample library
 */

export interface SampleMetadata {
    id: string;
    name: string;
    filename: string;
    path: string;
    duration: number;
    tags: string[];
    license: string;
    author: string;
    freesoundId?: number;
}

export interface SampleCategory {
    [subcategory: string]: SampleMetadata[];
}

export interface SampleLibrary {
    libraryName: string;
    version: string;
    createdAt: string;
    totalSamples: number;
    categories: {
        drums?: SampleCategory;
        instruments?: SampleCategory;
        synth?: SampleCategory;
        orchestral?: SampleCategory;
        fx?: SampleCategory;
        [key: string]: SampleCategory | undefined;
    };
}

let cachedLibrary: SampleLibrary | null = null;

/**
 * Load the sample library metadata
 */
export async function loadSampleLibrary(): Promise<SampleLibrary | null> {
    if (cachedLibrary) {
        return cachedLibrary;
    }

    try {
        const response = await fetch('/samples/library.json');
        if (!response.ok) {
            console.warn('Sample library not found. Run download-samples.js to generate.');
            return null;
        }

        cachedLibrary = await response.json();
        return cachedLibrary;
    } catch (error) {
        console.error('Failed to load sample library:', error);
        return null;
    }
}

/**
 * Get all samples from a specific category
 */
export function getSamplesByCategory(
    library: SampleLibrary,
    category: string,
    subcategory?: string
): SampleMetadata[] {
    const cat = library.categories[category];
    if (!cat) return [];

    if (subcategory) {
        return cat[subcategory] || [];
    }

    // Return all samples from all subcategories
    return Object.values(cat).flat();
}

/**
 * Search samples by tag
 */
export function searchSamplesByTag(
    library: SampleLibrary,
    tag: string
): SampleMetadata[] {
    const results: SampleMetadata[] = [];
    const normalizedTag = tag.toLowerCase();

    for (const category of Object.values(library.categories)) {
        if (!category) continue;

        for (const samples of Object.values(category)) {
            for (const sample of samples) {
                if (sample.tags.some(t => t.toLowerCase().includes(normalizedTag))) {
                    results.push(sample);
                }
            }
        }
    }

    return results;
}

/**
 * Get random sample from category
 */
export function getRandomSample(
    library: SampleLibrary,
    category: string,
    subcategory?: string
): SampleMetadata | null {
    const samples = getSamplesByCategory(library, category, subcategory);
    if (samples.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * samples.length);
    return samples[randomIndex] ?? null;
}

/**
 * Get sample by ID
 */
export function getSampleById(
    library: SampleLibrary,
    id: string
): SampleMetadata | null {
    for (const category of Object.values(library.categories)) {
        if (!category) continue;

        for (const samples of Object.values(category)) {
            const sample = samples.find(s => s.id === id);
            if (sample) return sample;
        }
    }

    return null;
}

/**
 * Get all category names
 */
export function getCategoryNames(library: SampleLibrary): string[] {
    return Object.keys(library.categories);
}

/**
 * Get subcategory names for a category
 */
export function getSubcategoryNames(
    library: SampleLibrary,
    category: string
): string[] {
    const cat = library.categories[category];
    return cat ? Object.keys(cat) : [];
}

/**
 * Format category name for display
 */
export function formatCategoryName(name: string): string {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
