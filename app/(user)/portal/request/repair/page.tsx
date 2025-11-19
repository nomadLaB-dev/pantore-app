"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Camera,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { MOCK_USER_DETAIL_DATA } from '@/lib/demo';

export default function RepairRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = MOCK_USER_DETAIL_DATA;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert('不具合報告を受け付けました。情シス担当から至急ご連絡します！🚑');
      router.push('/portal');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/portal" className="text-pantore-500 hover:text-pantore-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-pantore-900">故障・不具合報告</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-pantore-200 border-t-4 border-t-red-500">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
               <p className="font-bold text-red-800">緊急時の対応について</p>
               <p className="text-sm text-red-600">業務が完全に停止してしまう場合（起動しない等）は、申請後に内線 9999（情シス）までご一報ください。</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">不具合の内容（タイトル） <span className="text-red-500">*</span></label>
                <input required type="text" placeholder="例: 画面にヒビが入ってしまった" className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">発生状況・詳細 <span className="text-red-500">*</span></label>
                <textarea 
                  required 
                  rows={5} 
                  placeholder="どのような状況で発生しましたか？（例：今朝出社して電源を入れたら...）"
                  className="w-full px-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
            </div>

            <div className="space-y-2">
               <label className="text-sm font-bold text-pantore-700">写真のアップロード（任意）</label>
               <div className="border-2 border-dashed border-pantore-300 rounded-xl p-8 text-center cursor-pointer hover:bg-pantore-50 hover:border-pantore-400 transition-colors group">
                  <Camera className="w-8 h-8 text-pantore-400 mx-auto mb-2 group-hover:text-pantore-600" />
                  <p className="text-sm text-pantore-500 font-bold group-hover:text-pantore-700">クリックして写真を選択</p>
                  <p className="text-xs text-pantore-400 mt-1">またはドラッグ＆ドロップ</p>
               </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? '送信中...' : '報告を送信する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}