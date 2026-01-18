import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createProject, createDemoProject } from '@/domain/operations';
import type { Project, ApiResponse, ProjectSummary } from '@/domain/types';

// GET /api/projects - List all projects for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, bpm, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    const summaries: ProjectSummary[] = projects.map((p) => ({
      id: p.id,
      name: p.name,
      bpm: p.bpm,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json<ApiResponse<ProjectSummary[]>>({ data: summaries });
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name = 'Untitled Project', isDemo = false } = body;

    // Create project data
    const project = isDemo
      ? createDemoProject(user.id)
      : createProject(name, user.id);

    // Insert into database
    const { data: inserted, error } = await supabase
      .from('projects')
      .insert({
        id: project.id,
        owner_id: user.id,
        name: project.name,
        bpm: project.bpm,
        ppq: project.ppq,
        data: project,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Project>>(
      { data: inserted.data as Project },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

