'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

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

            // If auto-confirm is enabled, we might get a session immediately
            if (data.session) {
                router.push('/dashboard');
            } else {
                setMessage('Success! Please check your email for the confirmation link.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-ps-bg-900 text-ps-text-primary">
            <div className="w-full max-w-md p-8 bg-ps-bg-800 rounded-xl shadow-2xl border border-ps-bg-700">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-4">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-ps-accent-primary to-ps-accent-secondary hover:opacity-80 transition-opacity">
                            Pulse Studio
                        </h1>
                    </Link>
                    <h2 className="text-2xl font-semibold text-ps-text-primary mb-2">
                        Create Account
                    </h2>
                    <p className="text-ps-text-secondary">
                        Sign up to start creating music
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-ps-text-secondary mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-ps-bg-900 border border-ps-bg-600 rounded-lg focus:ring-2 focus:ring-ps-accent-primary focus:border-transparent outline-none text-ps-text-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-ps-text-secondary mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-ps-bg-900 border border-ps-bg-600 rounded-lg focus:ring-2 focus:ring-ps-accent-primary focus:border-transparent outline-none text-ps-text-primary"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400 text-sm">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-ps-accent-primary text-white font-semibold rounded-lg hover:shadow-glow-orange transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-ps-bg-700 text-center text-sm text-ps-text-secondary">
                    <p>
                        Already have an account?{' '}
                        <button
                            onClick={() => router.push('/login')}
                            className="text-ps-accent-primary hover:text-ps-accent-secondary font-semibold hover:underline transition-colors ml-1"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
