"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Utensils,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData, // Send form data directly
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'An unexpected error occurred.');
        setIsLoading(false);
        return;
      }

      // On success, redirect to the portal
      router.push('/portal');
      router.refresh(); // Force a refresh to ensure server-side data is up-to-date

    } catch (e) {
      setError('Failed to connect to the server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pantore-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-pantore-200 overflow-hidden">

        <div className="bg-pantore-600 p-8 text-center">
          <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm shadow-inner">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Pantore</h1>
          <p className="text-pantore-100 text-sm mt-1 opacity-90">社内資産管理システム</p>
        </div>

        <div className="p-8 pt-10">
          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-pantore-800 ml-1">メールアドレス</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-pantore-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="yoshito.s.0717@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-pantore-800 ml-1">パスワード</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-pantore-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••"
                  className="w-full pl-10 pr-12 py-3 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pantore-400 hover:text-pantore-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-pantore-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-pantore-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                'ログイン中...'
              ) : (
                <>
                  ログインする
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm mt-8">
            <Link href="/signup" className="text-pantore-600 hover:underline">
              アカウントをお持ちでないですか？ 新規登録
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}