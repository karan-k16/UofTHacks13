'use client';

import { useSearchParams } from 'next/navigation';
import Studio from '@/components/Studio/Studio';

export default function DemoPage() {
    const searchParams = useSearchParams();
    const autoStart = searchParams.get('autostart') === 'true';

    return <Studio isDemo={true} autoStart={autoStart} />;
}
