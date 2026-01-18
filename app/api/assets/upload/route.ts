import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { ApiResponse, AudioAsset } from '@/domain/types';
import { v4 as uuidv4 } from 'uuid';

// POST /api/assets/upload - Get signed URL for uploading assets
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const { fileName, fileType, fileSize, projectId } = body;

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Missing required fields: fileName, fileType, fileSize' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/ogg',
      'audio/webm',
      'audio/flac',
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Invalid file type. Only audio files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (fileSize > maxSize) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Generate unique file path
    const assetId = uuidv4();
    const extension = fileName.split('.').pop() || 'wav';
    const storagePath = `samples/${user.id}/${assetId}.${extension}`;

    // Create signed upload URL using service role client
    const { data: signedUrl, error: signedUrlError } = await serviceClient.storage
      .from('samples')
      .createSignedUploadUrl(storagePath);

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    // Create asset metadata record
    const assetMetadata: Partial<AudioAsset> = {
      id: assetId,
      name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
      fileName,
      storageUrl: storagePath,
      size: fileSize,
      format: extension,
      createdAt: new Date().toISOString(),
    };

    // Insert asset metadata
    const { error: insertError } = await supabase.from('assets').insert({
      id: assetId,
      owner_id: user.id,
      project_id: projectId || null,
      name: assetMetadata.name,
      file_name: fileName,
      storage_path: storagePath,
      file_type: fileType,
      file_size: fileSize,
      created_at: assetMetadata.createdAt,
    });

    if (insertError) {
      console.error('Error inserting asset metadata:', insertError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to create asset record' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{
      uploadUrl: string;
      assetId: string;
      storagePath: string;
    }>>({
      data: {
        uploadUrl: signedUrl.signedUrl,
        assetId,
        storagePath,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/assets/upload:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/assets/upload - List user's assets
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

    // Get project ID from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Fetch assets
    let query = supabase
      .from('assets')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: assets, error } = await query;

    if (error) {
      console.error('Error fetching assets:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      );
    }

    // Generate signed URLs for each asset
    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => {
        const { data: signedUrl } = await supabase.storage
          .from('samples')
          .createSignedUrl(asset.storage_path, 3600);

        return {
          id: asset.id,
          name: asset.name,
          fileName: asset.file_name,
          storageUrl: signedUrl?.signedUrl || '',
          size: asset.file_size,
          format: asset.file_type,
          createdAt: asset.created_at,
        } as Partial<AudioAsset>;
      })
    );

    return NextResponse.json<ApiResponse<Partial<AudioAsset>[]>>({
      data: assetsWithUrls,
    });
  } catch (error) {
    console.error('Error in GET /api/assets/upload:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

