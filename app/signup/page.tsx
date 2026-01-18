'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;

            if (data.session) {
                router.push('/dashboard');
            } else {
                setMessage('Check your email for the confirmation link.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center text-white relative px-6">
            {/* Minimal Logo / Link back to home */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute top-12 left-12"
            >
                <Link href="/" className="flex items-center gap-2 group">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ff7a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 17L12 22L22 17" stroke="#ff7a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="#ff7a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[13px] text-[#666] group-hover:text-white transition-colors tracking-wide">PULSE</span>
                </Link>
            </motion.div>

            <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="w-full max-w-[400px] space-y-8"
            >
                <div className="text-center space-y-4">
                    <h1
                        className="text-[48px] leading-tight text-white mb-2"
                        style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
                    >
                        Start Creating
                    </h1>
                    <p className="text-[#BAB8B8] text-[15px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Create an account to begin your journey.
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[13px] text-[#666] ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Email address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3 bg-[#1a1a1a] border border-[#333] rounded-full focus:border-[#ff7a7a] focus:ring-1 focus:ring-[#ff7a7a] outline-none text-[14px] text-white transition-all"
                            placeholder="name@company.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[13px] text-[#666] ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3 bg-[#1a1a1a] border border-[#333] rounded-full focus:border-[#ff7a7a] focus:ring-1 focus:ring-[#ff7a7a] outline-none text-[14px] text-white transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-[13px] text-[#ff7a7a] text-center bg-[#ff7a7a]/5 py-2 rounded-lg border border-[#ff7a7a]/20">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="text-[13px] text-green-400 text-center bg-green-400/5 py-2 rounded-lg border border-green-400/20">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-white text-black font-medium rounded-full hover:bg-[#ff7a7a] hover:text-white transition-all disabled:opacity-50 text-[14px]"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-[13px] text-[#666]">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-[#ff7a7a] hover:underline transition-colors ml-1 font-medium"
                        >
                            Sign in instead
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
