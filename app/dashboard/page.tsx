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
            <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a] text-white">
                <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-[#ff6b6b]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-[#888]">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <header className="h-16 border-b border-[#1a1a1a] flex items-center justify-between px-8 bg-gradient-to-r from-[#0d0d0d] to-[#111]">
                <div className="flex items-center gap-3">
                    {/* Logo matching landing page */}
                    <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-lg font-semibold text-white tracking-tight">PULSE</span>
                    </Link>
                    <div className="w-px h-6 bg-[#222] mx-2" />
                    <span className="text-sm text-[#666]">Dashboard</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-[#888]">{userEmail}</span>
                    <button
                        onClick={handleSignOut}
                        className="text-sm text-[#666] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1a1a1a]"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-8 py-12">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-2xl font-semibold text-white mb-1">Your Projects</h1>
                        <p className="text-sm text-[#666]">Create and manage your music projects</p>
                    </div>
                    <button
                        onClick={handleCreateProject}
                        disabled={creating}
                        className="px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 bg-gradient-to-r from-[#ff6b6b] to-[#ff8585] text-white shadow-lg shadow-[#ff6b6b]/25 hover:shadow-[#ff6b6b]/40 hover:scale-[1.02]"
                    >
                        {creating ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating...
                            </span>
                        ) : '+ New Project'}
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-[#222] rounded-2xl bg-[#0d0d0d]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#222] flex items-center justify-center">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                            </svg>
                        </div>
                        <p className="text-[#888] mb-2">No projects yet</p>
                        <button
                            onClick={handleCreateProject}
                            className="text-[#ff6b6b] hover:text-[#ff8585] transition-colors font-medium"
                        >
                            Create your first project →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="relative p-5 bg-gradient-to-br from-[#111] to-[#0d0d0d] rounded-xl border border-[#1a1a1a] hover:border-[#ff6b6b]/30 hover:shadow-lg hover:shadow-[#ff6b6b]/5 transition-all group"
                            >
                                {/* Action Buttons - visible on hover */}
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartRename(project);
                                        }}
                                        className="p-1.5 rounded-md bg-[#1a1a1a] hover:bg-[#222] text-[#666] hover:text-white transition-colors"
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
                                        className="p-1.5 rounded-md bg-[#1a1a1a] hover:bg-red-500/20 text-[#666] hover:text-red-400 transition-colors disabled:opacity-50"
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
                                                className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-1.5 text-lg font-semibold focus:outline-none focus:border-[#ff6b6b] text-white"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleConfirmRename(project.id)}
                                                    className="text-xs px-3 py-1.5 bg-[#ff6b6b] text-white rounded-lg hover:bg-[#ff8585] transition-colors font-medium"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelRename}
                                                    className="text-xs px-3 py-1.5 bg-[#1a1a1a] text-[#888] rounded-lg hover:bg-[#222] transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <h3 className="text-lg font-semibold truncate pr-4 text-white">
                                            {project.name}
                                        </h3>
                                    )}
                                    <span className="text-[10px] bg-[#1a1a1a] px-2.5 py-1 rounded-full text-[#888] shrink-0 font-mono border border-[#222]">
                                        {project.bpm} BPM
                                    </span>
                                </div>
                                <div className="text-sm text-[#666] flex justify-between items-end">
                                    <span className="text-xs">Modified {new Date(project.updatedAt).toLocaleDateString()}</span>
                                    <Link
                                        href={`/project/${project.id}`}
                                        className="text-sm font-medium px-4 py-2 bg-[#1a1a1a] text-[#ff6b6b] rounded-lg hover:bg-[#ff6b6b] hover:text-white transition-all border border-[#222] hover:border-[#ff6b6b]"
                                    >
                                        Open →
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
