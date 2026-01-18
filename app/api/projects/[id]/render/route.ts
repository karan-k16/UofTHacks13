import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Project, ApiResponse, RenderResult } from '@/domain/types';

// POST /api/projects/:id/render - Render project to WAV/MP3
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch project
    const { data: projectRow, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !projectRow) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = projectRow.data as Project;

    // Note: Server-side rendering would require a different approach
    // For now, we return an endpoint for client-side rendering with upload
    
    // Generate signed URLs for upload
    const timestamp = Date.now();
    const wavPath = `renders/${user.id}/${project.id}/${timestamp}.wav`;
    const mp3Path = `renders/${user.id}/${project.id}/${timestamp}.mp3`;

    // Create signed upload URLs using service role
    const { data: wavSignedUrl, error: wavError } = await serviceClient.storage
      .from('renders')
      .createSignedUploadUrl(wavPath);

    const { data: mp3SignedUrl, error: mp3Error } = await serviceClient.storage
      .from('renders')
      .createSignedUploadUrl(mp3Path);

    if (wavError || mp3Error) {
      console.error('Error creating signed URLs:', wavError || mp3Error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to create upload URLs' },
        { status: 500 }
      );
    }

    // Return upload URLs for client-side rendering
    return NextResponse.json<ApiResponse<{
      wavUploadUrl: string;
      mp3UploadUrl: string;
      wavPath: string;
      mp3Path: string;
    }>>({
      data: {
        wavUploadUrl: wavSignedUrl.signedUrl,
        mp3UploadUrl: mp3SignedUrl.signedUrl,
        wavPath,
        mp3Path,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/projects/:id/render:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/projects/:id/render - Get download URLs for rendered files
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

    // List rendered files for this project
    const { data: files, error } = await supabase.storage
      .from('renders')
      .list(`renders/${user.id}/${id}`);

    if (error) {
      console.error('Error listing renders:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to list renders' },
        { status: 500 }
      );
    }

    // Get signed URLs for the most recent renders
    const wavFile = files?.filter((f) => f.name.endsWith('.wav')).sort().pop();
    const mp3File = files?.filter((f) => f.name.endsWith('.mp3')).sort().pop();

    const result: Partial<RenderResult> = {};

    if (wavFile) {
      const { data: wavUrl } = await supabase.storage
        .from('renders')
        .createSignedUrl(`renders/${user.id}/${id}/${wavFile.name}`, 3600);
      if (wavUrl) result.wavUrl = wavUrl.signedUrl;
    }

    if (mp3File) {
      const { data: mp3Url } = await supabase.storage
        .from('renders')
        .createSignedUrl(`renders/${user.id}/${id}/${mp3File.name}`, 3600);
      if (mp3Url) result.mp3Url = mp3Url.signedUrl;
    }

    return NextResponse.json<ApiResponse<Partial<RenderResult>>>({ data: result });
  } catch (error) {
    console.error('Error in GET /api/projects/:id/render:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

