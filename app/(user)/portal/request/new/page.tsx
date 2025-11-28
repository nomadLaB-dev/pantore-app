"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Laptop, Send } from 'lucide-react';
import Link from 'next/link';
import { type CreateRequestInput, type UserDetail } from '@/lib/types';
import { createRequestAction, fetchCurrentUserAction } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';

export default function NewRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    purpose: '新規入社・配属',
    os: 'Windows (標準)',
    spec: ''
  });

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

    // 新しい申請データを作成
    const newRequest: CreateRequestInput = {
      type: 'new_hire',
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      detail: `${formData.os} / ${formData.purpose}`,
      note: formData.spec ? `希望スペック: ${formData.spec} / 利用開始: ${formData.date}` : `利用開始: ${formData.date}`
    };

    try {
      await createRequestAction(newRequest);
      setTimeout(() => {
        alert('申請を受け付けました！承認をお待ちください。🎉');
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
        <h1 className="text-2xl font-bold text-pantore-900">新規貸出申請</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-pantore-200">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pantore-800 flex items-center gap-2 pb-2 border-b border-pantore-100"><Calendar className="w-5 h-5 text-pantore-500" /> 利用期間・用途</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">利用開始希望日 <span className="text-red-500">*</span></label>
                <input required type="date" className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl"
                  value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">利用目的 <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl"
                  value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })}>
                  <option>新規入社・配属</option><option>開発・検証用端末</option><option>イベント・出張用</option><option>その他</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pantore-800 flex items-center gap-2 pb-2 border-b border-pantore-100"><Laptop className="w-5 h-5 text-pantore-500" /> 希望スペック</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Windows (標準)', 'macOS (開発用)'].map(os => (
                <label key={os} className="cursor-pointer group">
                  <input type="radio" name="os" className="peer sr-only" checked={formData.os === os} onChange={() => setFormData({ ...formData, os })} />
                  <div className="p-4 rounded-xl border-2 border-pantore-200 peer-checked:border-pantore-500 peer-checked:bg-pantore-50 hover:bg-pantore-50 transition-all">
                    <span className="block font-bold text-pantore-900">{os}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-pantore-700">具体的なスペック要望 (任意)</label>
              <textarea rows={3} className="w-full px-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl resize-none"
                placeholder="例: メモリ32GB以上希望" value={formData.spec} onChange={e => setFormData({ ...formData, spec: e.target.value })} />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full bg-pantore-600 text-white font-bold py-4 rounded-xl hover:bg-pantore-700 flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
              {isSubmitting ? '送信中...' : <><Send className="w-5 h-5" /> 申請を送信する</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}