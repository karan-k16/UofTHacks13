'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api/client';
import type { ProjectSummary } from '@/domain/types';
import Link from 'next/link';

export default function DashboardPage() {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUserEmail(user.email || null);
            loadProjects();
        };
        checkUser();
    }, [router, supabase]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getProjects();
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        try {
            setCreating(true);
            const newProject = await apiClient.createProject('Untitled Project');
            router.push(`/project/${newProject.id}`);
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project');
            setCreating(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-ps-bg-900 text-ps-text-primary">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ps-bg-900 text-ps-text-primary">
            {/* Header */}
            <header className="h-16 border-b border-ps-bg-700 flex items-center justify-between px-8 bg-ps-bg-800">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-ps-accent-primary to-ps-accent-secondary">
                        Pulse Studio
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-ps-text-secondary">{userEmail}</span>
                    <button
                        onClick={handleSignOut}
                        className="text-sm text-ps-text-muted hover:text-white transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold">Your Projects</h1>
                    <button
                        onClick={handleCreateProject}
                        disabled={creating}
                        className="btn btn-primary px-6 py-2 rounded-lg font-semibold hover:shadow-glow-orange transition-all disabled:opacity-50"
                    >
                        {creating ? 'Creating...' : 'New Project'}
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-ps-bg-700 rounded-xl">
                        <p className="text-ps-text-secondary mb-4">No projects yet</p>
                        <button
                            onClick={handleCreateProject}
                            className="text-ps-accent-primary hover:underline"
                        >
                            Create your first project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/project/${project.id}`}
                                className="block p-6 bg-ps-bg-800 rounded-xl border border-ps-bg-700 hover:border-ps-accent-primary/50 hover:shadow-lg transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold truncate pr-4">
                                        {project.name}
                                    </h3>
                                    <span className="text-xs bg-ps-bg-700 px-2 py-1 rounded text-ps-text-muted">
                                        {project.bpm} BPM
                                    </span>
                                </div>
                                <div className="text-sm text-ps-text-secondary flex justify-between items-end">
                                    <span>Modified {new Date(project.updatedAt).toLocaleDateString()}</span>
                                    <span className="text-ps-accent-tertiary text-xs">Open Studio →</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
