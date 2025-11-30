'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Utensils, Lock, Mail, ArrowRight, AlertCircle, User, Building
} from 'lucide-react';
import { checkDomainForTenant, standardSignup, signupAndRequestToJoin } from '../actions';

type TenantInfo = { tenantId: string; tenantName: string };

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [foundTenant, setFoundTenant] = useState<TenantInfo | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await checkDomainForTenant(email);
      setFoundTenant(result);
      setStep(2);
    });
  };

  const handleFinalSubmit = async (action: (formData: FormData) => Promise<any>) => {
    setError('');
    startTransition(async () => {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('name', name);
      if (foundTenant) {
        formData.append('tenantId', foundTenant.tenantId);
      }

      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setStep(3); // Go to success/confirmation step
      }
    });
  };
  
  if (step === 3) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-pantore-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-pantore-200 p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800">登録ありがとうございます！</h1>
                <p className="mt-4 text-gray-600">
                    ご入力いただいたメールアドレス宛に確認メールを送信しました。
                    メール内のリンクをクリックして、登録を完了してください。
                </p>
                <Link href="/login" className="inline-block mt-6 text-sm text-pantore-600 hover:underline">
                    ログインページに戻る
                </Link>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pantore-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-pantore-200 overflow-hidden">
        <div className="bg-pantore-600 p-8 text-center">
          <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-4">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">アカウント登録</h1>
        </div>

        <div className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-6">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {step === 1 && (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-pantore-800 ml-1">メールアドレス</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-pantore-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl"/>
                        </div>
                    </div>
                    <button type="submit" disabled={isPending} className="w-full bg-pantore-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                        {isPending ? '確認中...' : '続ける'} <ArrowRight className="w-5 h-5" />
                    </button>
                </form>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    {foundTenant && (
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                            <Building className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-sm text-blue-700">
                                「<span className="font-bold">{foundTenant.tenantName}</span>」が見つかりました。
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-pantore-800 ml-1">氏名</label>
                        <div className="relative">
                            <User className="w-5 h-5 text-pantore-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-pantore-800 ml-1">パスワード</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-pantore-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl"/>
                        </div>
                    </div>

                    {foundTenant ? (
                        <div className="space-y-3">
                            <button onClick={() => handleFinalSubmit(signupAndRequestToJoin)} disabled={isPending} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                                {isPending ? '処理中...' : `「${foundTenant.tenantName}」への参加をリクエスト`}
                            </button>
                            <button onClick={() => handleFinalSubmit(standardSignup)} disabled={isPending} className="w-full bg-gray-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                                {isPending ? '処理中...' : 'いいえ、新しい組織を作成する'}
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => handleFinalSubmit(standardSignup)} disabled={isPending} className="w-full bg-pantore-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                            {isPending ? '登録中...' : 'アカウントを作成する'}
                        </button>
                    )}
                </div>
            )}
             <div className="mt-8 text-center text-sm">
                <Link href="/login" className="text-pantore-600 hover:underline">
                    既にアカウントをお持ちですか？ ログイン
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}