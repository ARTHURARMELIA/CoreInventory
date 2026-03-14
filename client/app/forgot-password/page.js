'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl">
          <h1 className="mb-4 text-center text-xl font-bold text-sky-400">Check your email</h1>
          <p className="mb-4 text-center text-slate-400">
            If an account exists for {email}, we sent an OTP. Use it on the reset page.
          </p>
          <Link
            href={`/reset-password?email=${encodeURIComponent(email)}`}
            className="block w-full rounded-lg bg-sky-600 py-2.5 text-center font-medium text-white hover:bg-sky-500"
          >
            Enter OTP
          </Link>
          <p className="mt-4 text-center text-sm text-slate-400">
            <Link href="/login" className="text-sky-400 hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-sky-400">CoreInventory</h1>
        <h2 className="mb-4 text-lg font-medium text-slate-200">Forgot password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <div>
            <label className="mb-1 block text-sm text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          <Link href="/login" className="text-sky-400 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
