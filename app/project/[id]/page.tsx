'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Studio from '@/components/Studio/Studio';

export default function ProjectPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const supabase = createClient();
    const { id } = params;

    useEffect(() => {
        // Basic auth check
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push(`/login?redirect=/project/${id}`);
            }
        };
        checkAuth();
    }, [router, supabase, id]);

    return <Studio isDemo={false} projectId={id} />;
}
