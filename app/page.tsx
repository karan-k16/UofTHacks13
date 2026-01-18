'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-ps-bg-900 text-ps-text-primary">
      <div className="text-center max-w-2xl px-4">
        <svg
          className="w-32 h-32 mx-auto mb-6"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" stroke="#ff6b35" strokeWidth="3" />
          <circle cx="50" cy="50" r="30" fill="#ff6b35" opacity="0.2" />
          <circle cx="50" cy="50" r="15" fill="#ff6b35" />
          <path
            d="M35 50 L50 35 L65 50 L50 65 Z"
            fill="#ff6b35"
            opacity="0.6"
          />
        </svg>

        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Pulse Studio
        </h1>
        <p className="text-xl text-ps-text-secondary mb-12">
          Professional Digital Audio Workstation in your browser.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/demo')}
            className="btn btn-primary px-8 py-3 text-lg font-semibold rounded-lg hover:shadow-glow-orange transition-all"
          >
            Try Demo
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 text-lg font-semibold rounded-lg bg-ps-bg-700 hover:bg-ps-bg-600 text-ps-text-primary transition-all"
          >
            Login / Sign Up
          </button>
        </div>

        <div className="mt-16 text-ps-text-muted text-sm border-t border-ps-bg-700 pt-8">
          <p>Created for UofTHacks 12</p>
        </div>
      </div>
    </div>
  );
}
