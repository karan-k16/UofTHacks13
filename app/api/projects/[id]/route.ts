import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Project, ApiResponse } from '@/domain/types';

// GET /api/projects/:id - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (error || !project) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Project>>({ data: project.data as Project });
  } catch (error) {
    console.error('Error in GET /api/projects/:id:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/:id - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const projectData: Project = await request.json();

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing || existing.owner_id !== user.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update project
    const updatedAt = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from('projects')
      .update({
        name: projectData.name,
        bpm: projectData.bpm,
        ppq: projectData.ppq,
        data: { ...projectData, updatedAt },
        updated_at: updatedAt,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Project>>({ data: updated.data as Project });
  } catch (error) {
    console.error('Error in PUT /api/projects/:id:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/:id - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete project (RLS will ensure ownership)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      data: { success: true },
    });
  } catch (error) {
    console.error('Error in DELETE /api/projects/:id:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

