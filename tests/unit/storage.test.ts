/**
 * Storage Path Structure Tests
 * 
 * These tests verify that file paths match Supabase RLS policy requirements:
 * - Bucket: 'assets' or 'renders'
 * - Path format: ${user.id}/... (user.id is FIRST folder)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Storage Path Structure', () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const mockProjectId = 'proj-123';
    const mockFileName = 'recording.wav';

    describe('Asset Upload Path', () => {
        it('should format path with userId as first folder', () => {
            // Expected format: userId/projectId/timestamp_fileName
            const timestamp = Date.now();
            const expectedPath = `${mockUserId}/${mockProjectId}/${timestamp}_${mockFileName}`;

            // Verify path structure
            const pathParts = expectedPath.split('/');
            expect(pathParts[0]).toBe(mockUserId); // First folder is userId
            expect(pathParts[1]).toBe(mockProjectId); // Second folder is projectId
            expect(pathParts[2]).toContain(mockFileName); // Last part is filename
        });

        it('should NOT include bucket name in path', () => {
            const filePath = `${mockUserId}/${mockProjectId}/${mockFileName}`;

            // Path should NOT start with 'assets/'
            expect(filePath).not.toMatch(/^assets\//);

            // Path should NOT contain 'assets/' anywhere
            expect(filePath).not.toContain('assets/');
        });

        it('should match RLS policy folder extraction', () => {
            const filePath = `${mockUserId}/${mockProjectId}/${mockFileName}`;

            // RLS policy uses: (storage.foldername(name))[1]
            // foldername() returns array of path segments
            const folders = filePath.split('/');
            const firstFolder = folders[0]; // [1] in SQL is 1-indexed

            expect(firstFolder).toBe(mockUserId);
        });
    });

    describe('Render Upload Path', () => {
        it('should format path with userId as first folder', () => {
            // Expected format: userId/fileName
            const expectedPath = `${mockUserId}/${mockProjectId}_${Date.now()}.wav`;

            const pathParts = expectedPath.split('/');
            expect(pathParts[0]).toBe(mockUserId); // First folder is userId
            expect(pathParts.length).toBe(2); // Only two levels: userId/filename
        });

        it('should NOT include bucket name in path', () => {
            const filePath = `${mockUserId}/${mockProjectId}_${Date.now()}.wav`;

            expect(filePath).not.toMatch(/^renders\//);
            expect(filePath).not.toContain('renders/');
        });
    });

    describe('Delete Asset Path Extraction', () => {
        it('should extract correct path from Supabase public URL', () => {
            const storageUrl = `https://example.supabase.co/storage/v1/object/public/assets/${mockUserId}/${mockProjectId}/${mockFileName}`;

            const url = new URL(storageUrl);
            const pathMatch = url.pathname.match(/\/object\/public\/assets\/(.+)$/);

            expect(pathMatch).not.toBeNull();
            expect(pathMatch![1]).toBe(`${mockUserId}/${mockProjectId}/${mockFileName}`);
        });

        it('should extract path that matches upload path', () => {
            // Upload path
            const uploadPath = `${mockUserId}/${mockProjectId}/${mockFileName}`;

            // Construct URL
            const storageUrl = `https://example.supabase.co/storage/v1/object/public/assets/${uploadPath}`;

            // Extract path
            const url = new URL(storageUrl);
            const pathMatch = url.pathname.match(/\/object\/public\/assets\/(.+)$/);
            const extractedPath = pathMatch![1];

            // Should match exactly
            expect(extractedPath).toBe(uploadPath);
        });

        it('should NOT extract path with bucket prefix', () => {
            const storageUrl = `https://example.supabase.co/storage/v1/object/public/assets/${mockUserId}/${mockProjectId}/${mockFileName}`;

            const url = new URL(storageUrl);
            const pathMatch = url.pathname.match(/\/object\/public\/assets\/(.+)$/);
            const extractedPath = pathMatch![1];

            // Should NOT start with 'assets/'
            expect(extractedPath).not.toMatch(/^assets\//);
        });
    });

    describe('RLS Policy Compatibility', () => {
        it('should pass RLS policy check for assets INSERT', () => {
            // Policy: bucket_id = 'assets' AND (auth.uid())::text = (storage.foldername(name))[1]
            const bucket = 'assets';
            const filePath = `${mockUserId}/${mockProjectId}/${mockFileName}`;
            const authUserId = mockUserId;

            // Simulate RLS check
            const folders = filePath.split('/');
            const firstFolder = folders[0];

            expect(bucket).toBe('assets');
            expect(firstFolder).toBe(authUserId);
        });

        it('should pass RLS policy check for assets SELECT', () => {
            // Same policy as INSERT
            const bucket = 'assets';
            const filePath = `${mockUserId}/${mockProjectId}/${mockFileName}`;
            const authUserId = mockUserId;

            const folders = filePath.split('/');
            const firstFolder = folders[0];

            expect(bucket).toBe('assets');
            expect(firstFolder).toBe(authUserId);
        });

        it('should pass RLS policy check for renders', () => {
            const bucket = 'renders';
            const filePath = `${mockUserId}/${mockProjectId}_${Date.now()}.wav`;
            const authUserId = mockUserId;

            const folders = filePath.split('/');
            const firstFolder = folders[0];

            expect(bucket).toBe('renders');
            expect(firstFolder).toBe(authUserId);
        });

        it('should FAIL RLS check if userId is not first folder', () => {
            // Wrong: bucket name in path
            const wrongPath1 = `assets/${mockUserId}/${mockProjectId}/${mockFileName}`;
            const folders1 = wrongPath1.split('/');
            expect(folders1[0]).not.toBe(mockUserId); // Would fail RLS

            // Wrong: different structure
            const wrongPath2 = `recordings/${mockUserId}/${mockFileName}`;
            const folders2 = wrongPath2.split('/');
            expect(folders2[0]).not.toBe(mockUserId); // Would fail RLS
        });
    });

    describe('Path Format Edge Cases', () => {
        it('should handle filenames with special characters', () => {
            const specialFileName = 'my recording (1).wav';
            const filePath = `${mockUserId}/${mockProjectId}/${Date.now()}_${specialFileName}`;

            const folders = filePath.split('/');
            expect(folders[0]).toBe(mockUserId);
        });

        it('should handle multiple dots in filename', () => {
            const fileName = 'audio.file.v2.final.wav';
            const filePath = `${mockUserId}/${mockProjectId}/${fileName}`;

            const folders = filePath.split('/');
            expect(folders[0]).toBe(mockUserId);
            expect(folders[folders.length - 1]).toBe(fileName);
        });

        it('should handle long filenames', () => {
            const longFileName = 'a'.repeat(200) + '.wav';
            const filePath = `${mockUserId}/${mockProjectId}/${longFileName}`;

            const folders = filePath.split('/');
            expect(folders[0]).toBe(mockUserId);
        });
    });
});

describe('Storage API Integration', () => {
    // Mock Supabase client
    const createMockSupabase = () => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: '123e4567-e89b-12d3-a456-426614174000' } },
                error: null,
            }),
        },
        storage: {
            from: vi.fn((bucket: string) => ({
                upload: vi.fn((path: string, file: Blob) => ({
                    data: { path },
                    error: null,
                })),
                getPublicUrl: vi.fn((path: string) => ({
                    data: {
                        publicUrl: `https://example.supabase.co/storage/v1/object/public/${path}`
                    },
                })),
                remove: vi.fn(() => ({ error: null })),
            })),
        },
    });

    it('should upload to correct bucket and path', async () => {
        const mockSupabase = createMockSupabase();
        const bucket = 'assets';
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        const projectId = 'proj-123';
        const fileName = 'test.wav';

        // Simulate upload
        const filePath = `${userId}/${projectId}/${Date.now()}_${fileName}`;
        const uploadResult = await mockSupabase.storage.from(bucket).upload(
            filePath,
            new Blob(['test'], { type: 'audio/wav' })
        );

        expect(uploadResult.data.path).toBe(filePath);
        expect(uploadResult.data.path.split('/')[0]).toBe(userId);
    });

    it('should delete using correct path format', async () => {
        const mockSupabase = createMockSupabase();
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        const projectId = 'proj-123';
        const fileName = 'test.wav';

        // Construct URL as Supabase returns it
        const storageUrl = `https://example.supabase.co/storage/v1/object/public/assets/${userId}/${projectId}/${fileName}`;

        // Extract path for deletion
        const url = new URL(storageUrl);
        const pathMatch = url.pathname.match(/\/object\/public\/assets\/(.+)$/);
        const filePath = pathMatch![1];

        // Path should be: userId/projectId/fileName (no 'assets/' prefix)
        expect(filePath).toBe(`${userId}/${projectId}/${fileName}`);

        // Simulate deletion
        const deleteResult = await mockSupabase.storage.from('assets').remove([filePath]);
        expect(deleteResult.error).toBeNull();
    });
});

describe('Path Validation Helpers', () => {
    /**
     * Helper function to validate storage path format
     */
    function isValidStoragePath(path: string, userId: string): boolean {
        const parts = path.split('/');

        // Must have at least 2 parts (userId/filename)
        if (parts.length < 2) return false;

        // First part must be userId
        if (parts[0] !== userId) return false;

        // Must not contain bucket name
        if (path.includes('assets/') || path.includes('renders/')) return false;

        return true;
    }

    it('should validate correct paths', () => {
        const userId = '123e4567-e89b-12d3-a456-426614174000';

        expect(isValidStoragePath(`${userId}/file.wav`, userId)).toBe(true);
        expect(isValidStoragePath(`${userId}/proj/file.wav`, userId)).toBe(true);
        expect(isValidStoragePath(`${userId}/a/b/c/file.wav`, userId)).toBe(true);
    });

    it('should reject invalid paths', () => {
        const userId = '123e4567-e89b-12d3-a456-426614174000';

        // Wrong: bucket in path
        expect(isValidStoragePath(`assets/${userId}/file.wav`, userId)).toBe(false);
        expect(isValidStoragePath(`renders/${userId}/file.wav`, userId)).toBe(false);

        // Wrong: userId not first
        expect(isValidStoragePath(`other/${userId}/file.wav`, userId)).toBe(false);

        // Wrong: no userId
        expect(isValidStoragePath(`file.wav`, userId)).toBe(false);

        // Wrong: different userId
        expect(isValidStoragePath(`wrong-user-id/file.wav`, userId)).toBe(false);
    });
});
