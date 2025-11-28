"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Camera } from 'lucide-react';
import Link from 'next/link';
import { type CreateRequestInput, type UserDetail, type OrganizationSettings } from '@/lib/types';
import { createRequestAction, fetchCurrentUserAction, fetchSettingsAction } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';

export default function RepairRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [formData, setFormData] = useState({ title: '', detail: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, settingsData] = await Promise.all([
          fetchCurrentUserAction(),
          fetchSettingsAction()
        ]);

        if (!userData) {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }

        setUser(userData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('ユーザー情報の取得に失敗しました。');
      return;
    }

    setIsSubmitting(true);

    const newRequest: CreateRequestInput = {
      type: 'breakdown',
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      detail: formData.title,
      note: formData.detail
    };

    try {
      await createRequestAction(newRequest);
      setTimeout(() => {
        alert('不具合報告を受け付けました。情シス担当から至急ご連絡します！🚑');
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

  if (!user || !settings) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/portal" className="text-pantore-500 hover:text-pantore-700"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-pantore-900">故障・不具合報告</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-pantore-200 border-t-4 border-t-red-500">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="font-bold text-red-800">緊急時の対応について</p>
              <p className="text-sm text-red-600">業務停止時は、申請後に {settings.contactLabel} {settings.contactValue} までご一報ください。</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-pantore-700">不具合の内容 <span className="text-red-500">*</span></label>
              <input required type="text" placeholder="例: 画面にヒビが入ってしまった" className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl"
                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-pantore-700">詳細 <span className="text-red-500">*</span></label>
              <textarea required rows={5} placeholder="発生状況などを詳しく..." className="w-full px-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl resize-none"
                value={formData.detail} onChange={e => setFormData({ ...formData, detail: e.target.value })} />
            </div>

            <div className="border-2 border-dashed border-pantore-300 rounded-xl p-6 text-center cursor-pointer hover:bg-pantore-50 text-pantore-400">
              <Camera className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs font-bold">写真を追加 (任意)</span>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-red-700 transition-all disabled:opacity-50">
              {isSubmitting ? '送信中...' : '報告を送信する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}