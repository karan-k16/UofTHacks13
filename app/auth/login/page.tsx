'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage('Check your email for the login link!');
        setIsSuccess(true);
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ps-bg-900">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="45" stroke="#ff6b35" strokeWidth="3" />
            <circle cx="50" cy="50" r="30" fill="#ff6b35" opacity="0.2" />
            <circle cx="50" cy="50" r="15" fill="#ff6b35" />
          </svg>
          <h1 className="text-2xl font-bold text-ps-text-primary">Pulse Studio</h1>
          <p className="text-ps-text-secondary text-sm mt-1">
            Sign in to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-ps-text-secondary mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 bg-ps-bg-700 border border-ps-bg-500 rounded text-ps-text-primary placeholder-ps-text-muted focus:border-ps-accent-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading-spinner w-4 h-4" />
                Sending...
              </span>
            ) : (
              'Send Magic Link'
            )}
          </button>
        </form>

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded text-sm text-center ${
              isSuccess
                ? 'bg-green-900/30 text-green-400 border border-green-800'
                : 'bg-red-900/30 text-red-400 border border-red-800'
            }`}
          >
            {message}
          </div>
        )}

        {/* Skip auth for demo */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-ps-text-muted hover:text-ps-text-primary text-xs"
          >
            Continue without signing in (demo mode)
          </button>
        </div>
      </div>
    </div>
  );
}

