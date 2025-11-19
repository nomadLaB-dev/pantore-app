"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Utensils, 
  Lock, 
  Mail, 
  ArrowRight,
  AlertCircle 
} from 'lucide-react';

// ユーザーリストをインポート
import { MOCK_USERS_LIST } from '@/lib/demo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // 1. パスワードチェック (デモ用共通パス)
      if (password !== '0000') {
        setError('パスワードが間違っています（ヒント: 0000）');
        setIsLoading(false);
        return;
      }

      // 2. ユーザー検索
      const user = MOCK_USERS_LIST.find(u => u.email === email);

      if (user) {
        // ✨ ログイン成功！ローカルストレージにユーザー情報を保存
        localStorage.setItem('pantore_current_user', JSON.stringify(user));

        // 3. 権限振り分け
        if (user.role === 'admin') {
          router.push('/'); // 管理者へ
        } else {
          router.push('/portal'); // 一般ユーザーへ
        }
      } else {
        setError('ユーザーが見つかりません。登録済みのメールアドレスを入力してください。');
        setIsLoading(false);
      }
    }, 800);
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
          <form onSubmit={handleLogin} className="space-y-6">
            
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
                  type="email" 
                  required
                  placeholder="yoshito.s.0717@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-pantore-800 ml-1">パスワード</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-pantore-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  required
                  placeholder="••••"
                  className="w-full pl-10 pr-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-500 transition-all font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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

          <div className="mt-8 text-center">
            <p className="text-xs text-pantore-400 mb-2">動作確認用アカウント (Pass: 0000)</p>
            <div className="flex flex-col gap-1 text-xs text-pantore-500 bg-pantore-50 p-3 rounded-lg border border-pantore-100">
               <span>👑 yoshito.s.0717@gmail.com (Admin)</span>
               <span>👩 hanako.sato@tech-sol.co.jp (Manager)</span>
               <span>🎨 kenji.ijuin@parent-corp.jp (User)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}