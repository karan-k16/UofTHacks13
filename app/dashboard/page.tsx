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
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
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

    const handleDeleteProject = async (projectId: string, projectName: string) => {
        if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
            return;
        }
        try {
            setDeletingId(projectId);
            await apiClient.deleteProject(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
        } catch (error) {
            console.error('Failed to delete project:', error);
            alert('Failed to delete project');
        } finally {
            setDeletingId(null);
        }
    };

    const handleStartRename = (project: ProjectSummary) => {
        setRenamingId(project.id);
        setRenameValue(project.name);
    };

    const handleCancelRename = () => {
        setRenamingId(null);
        setRenameValue('');
    };

    const handleConfirmRename = async (projectId: string) => {
        const trimmedName = renameValue.trim();
        if (!trimmedName) {
            alert('Project name cannot be empty');
            return;
        }
        try {
            await apiClient.renameProject(projectId, trimmedName);
            setProjects(projects.map(p => 
                p.id === projectId ? { ...p, name: trimmedName } : p
            ));
            setRenamingId(null);
            setRenameValue('');
        } catch (error) {
            console.error('Failed to rename project:', error);
            alert('Failed to rename project');
        }
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
                            <div
                                key={project.id}
                                className="relative p-6 bg-ps-bg-800 rounded-xl border border-ps-bg-700 hover:border-ps-accent-primary/50 hover:shadow-lg transition-all group"
                            >
                                {/* Action Buttons - visible on hover */}
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartRename(project);
                                        }}
                                        className="p-1.5 rounded-md bg-ps-bg-700 hover:bg-ps-bg-600 text-ps-text-secondary hover:text-ps-text-primary transition-colors"
                                        title="Rename project"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProject(project.id, project.name);
                                        }}
                                        disabled={deletingId === project.id}
                                        className="p-1.5 rounded-md bg-ps-bg-700 hover:bg-red-500/20 text-ps-text-secondary hover:text-red-400 transition-colors disabled:opacity-50"
                                        title="Delete project"
                                    >
                                        {deletingId === project.id ? (
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Project Content */}
                                <div className="flex justify-between items-start mb-4">
                                    {renamingId === project.id ? (
                                        <div className="flex-1 pr-4" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleConfirmRename(project.id);
                                                    if (e.key === 'Escape') handleCancelRename();
                                                }}
                                                className="w-full bg-ps-bg-700 border border-ps-bg-600 rounded px-2 py-1 text-lg font-semibold focus:outline-none focus:border-ps-accent-primary"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleConfirmRename(project.id)}
                                                    className="text-xs px-2 py-1 bg-ps-accent-primary text-white rounded hover:bg-ps-accent-primary/80 transition-colors"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelRename}
                                                    className="text-xs px-2 py-1 bg-ps-bg-600 text-ps-text-secondary rounded hover:bg-ps-bg-500 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <h3 className="text-lg font-semibold truncate pr-4">
                                            {project.name}
                                        </h3>
                                    )}
                                    <span className="text-xs bg-ps-bg-700 px-2 py-1 rounded text-ps-text-muted shrink-0">
                                        {project.bpm} BPM
                                    </span>
                                </div>
                                <div className="text-sm text-ps-text-secondary flex justify-between items-end">
                                    <span>Modified {new Date(project.updatedAt).toLocaleDateString()}</span>
                                    <Link
                                        href={`/project/${project.id}`}
                                        className="text-sm font-medium px-3 py-1.5 bg-ps-accent-primary/10 text-ps-accent-primary rounded-md hover:bg-ps-accent-primary hover:text-white transition-all"
                                    >
                                        Open Studio →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
