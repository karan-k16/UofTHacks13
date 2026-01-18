import { createClient } from '@/lib/supabase/client';
import type { Project, ProjectSummary, AudioAsset } from '@/domain/types';

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export const apiClient = {
    async getProjects(): Promise<ProjectSummary[]> {
        const response = await fetch('/api/projects');
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        const json = await response.json();
        return json.data;
    },

    async getProject(id: string): Promise<Project> {
        const supabase = createClient();
        const { data: project, error } = await supabase
            .from('projects')
            .select('data')
            .eq('id', id)
            .single();

        if (error || !project) {
            throw new Error(error?.message || 'Project not found');
        }

        // The 'data' column stores the Project JSON
        return project.data as Project;
    },

    async createProject(name: string, isDemo: boolean = false): Promise<Project> {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, isDemo }),
        });

        if (!response.ok) {
            throw new Error('Failed to create project');
        }

        const json = await response.json();
        return json.data;
    },

    async saveProject(project: Project): Promise<void> {
        const supabase = createClient();

        // We only update the 'data', 'updated_at', 'name', 'bpm' fields
        // We assume the user owns the project (RLS will enforce)
        const { error } = await supabase
            .from('projects')
            .update({
                data: project,
                name: project.name,
                bpm: project.bpm,
                updated_at: new Date().toISOString(),
                last_saved_at: new Date().toISOString(),
            })
            .eq('id', project.id);

        if (error) {
            throw new Error(error.message);
        }
    },

    async deleteProject(id: string): Promise<void> {
        const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete project');
        }
    },

    async renameProject(id: string, newName: string): Promise<void> {
        const supabase = createClient();

        const { error } = await supabase
            .from('projects')
            .update({
                name: newName,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            throw new Error(error.message);
        }
    },

    async uploadAsset(
        projectId: string,
        file: File | Blob,
        fileName: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<AudioAsset> {
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Create unique file path: userId/projectId/fileName
        const filePath = `${user.id}/${projectId}/${Date.now()}_${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('assets')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL (or signed URL if bucket is private)
        const { data: urlData } = supabase
            .storage
            .from('assets')
            .getPublicUrl(uploadData.path);

        // Get audio metadata
        let duration = 0;
        let sampleRate = 48000;
        let channels = 2;

        if (file instanceof Blob && file.type.includes('audio')) {
            try {
                const audioBuffer = await this.decodeAudioFile(file);
                duration = audioBuffer.duration;
                sampleRate = audioBuffer.sampleRate;
                channels = audioBuffer.numberOfChannels;
            } catch (error) {
                console.warn('Could not decode audio metadata:', error);
            }
        }

        // Create asset object
        const asset: AudioAsset = {
            id: crypto.randomUUID(),
            name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
            fileName: fileName,
            storageUrl: urlData.publicUrl,
            duration,
            sampleRate,
            channels,
            format: file.type || 'audio/wav',
            size: file.size,
            createdAt: new Date().toISOString(),
        };

        return asset;
    },

    async deleteAsset(storageUrl: string): Promise<void> {
        const supabase = createClient();

        // Extract path from URL
        // URL format: https://<project>.supabase.co/storage/v1/object/public/assets/<userId>/<projectId>/<file>
        const url = new URL(storageUrl);
        const pathMatch = url.pathname.match(/\/object\/public\/assets\/(.+)$/);

        if (!pathMatch) {
            throw new Error('Invalid storage URL');
        }

        // filePath should be: userId/projectId/filename (no 'assets/' prefix)
        const filePath = pathMatch[1];

        const { error } = await supabase
            .storage
            .from('assets')
            .remove([filePath]);

        if (error) {
            throw new Error(`Delete failed: ${error.message}`);
        }
    },

    async uploadRender(
        projectId: string,
        file: Blob,
        format: 'wav' | 'mp3'
    ): Promise<string> {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const fileName = `${projectId}_${Date.now()}.${format}`;
        const filePath = `${user.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('renders')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Render upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase
            .storage
            .from('renders')
            .getPublicUrl(uploadData.path);

        return urlData.publicUrl;
    },

    // Helper function to decode audio files
    async decodeAudioFile(file: Blob): Promise<AudioBuffer> {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        return await audioContext.decodeAudioData(arrayBuffer);
    },
};
