"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Camera } from 'lucide-react';
import Link from 'next/link';
import { MOCK_REQUESTS, CURRENT_USER, MOCK_SETTINGS, type Request } from '@/lib/demo';

export default function RepairRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', detail: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newRequest: Request = {
      id: `REQ-${Date.now()}`,
      type: 'breakdown',
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userDept: CURRENT_USER.dept,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      detail: formData.title,
      note: formData.detail
    };

    MOCK_REQUESTS.unshift(newRequest);

    setTimeout(() => {
      alert('不具合報告を受け付けました。情シス担当から至急ご連絡します！🚑');
      router.push('/portal');
    }, 800);
  };

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
               <p className="text-sm text-red-600">業務停止時は、申請後に {MOCK_SETTINGS.contactLabel} {MOCK_SETTINGS.contactValue} までご一報ください。</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">不具合の内容 <span className="text-red-500">*</span></label>
                <input required type="text" placeholder="例: 画面にヒビが入ってしまった" className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl" 
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">詳細 <span className="text-red-500">*</span></label>
                <textarea required rows={5} placeholder="発生状況などを詳しく..." className="w-full px-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl resize-none"
                  value={formData.detail} onChange={e => setFormData({...formData, detail: e.target.value})} />
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