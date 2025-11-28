"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, PackageOpen, Check } from 'lucide-react';
import Link from 'next/link';
import { type CreateRequestInput, type UserDetail } from '@/lib/types';
import { createRequestAction, fetchCurrentUserAction } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';

export default function ReturnRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [formData, setFormData] = useState({ date: '', reason: '退職に伴う返却', kit: false });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await fetchCurrentUserAction();
        if (!userData) {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('ユーザー情報の取得に失敗しました。');
      return;
    }

    setIsSubmitting(true);

    const newRequest: CreateRequestInput = {
      type: 'return',
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      detail: formData.reason,
      note: `返却予定: ${formData.date} ${formData.kit ? '(返送キット希望)' : ''}`
    };

    try {
      await createRequestAction(newRequest);
      setTimeout(() => {
        alert('返却申請を受け付けました！📦');
        router.push('/portal');
      }, 800);
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('申請の送信に失敗しました。');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">読み込み中...</div>;
  }

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/portal" className="text-pantore-500 hover:text-pantore-700"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-pantore-900">デバイス返却申請</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-pantore-200">
        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="bg-pantore-50 p-4 rounded-xl border border-pantore-200 flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm text-pantore-500"><PackageOpen className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-pantore-500 font-bold uppercase">返却対象デバイス</p>
              <p className="text-lg font-bold text-pantore-900">{user.currentDevice?.model || '不明'}</p>
              <p className="text-sm text-pantore-600 font-mono">S/N: {user.currentDevice?.serial || '---'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">返却予定日 <span className="text-red-500">*</span></label>
                <input required type="date" className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl"
                  value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">返却理由 <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl"
                  value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}>
                  <option>退職に伴う返却</option><option>プロジェクト終了</option><option>新機種への交換</option><option>不要になった</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer group pt-2">
              <input type="checkbox" className="w-5 h-5 accent-pantore-600" checked={formData.kit} onChange={e => setFormData({ ...formData, kit: e.target.checked })} />
              <span className="font-bold text-pantore-800">返送用キット（段ボール・伝票）の送付を希望する</span>
            </label>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full bg-pantore-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-pantore-700 transition-all disabled:opacity-50">
              {isSubmitting ? '送信中...' : '返却を申請する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}