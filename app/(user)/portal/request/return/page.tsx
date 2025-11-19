"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  PackageOpen,
  Send,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { MOCK_USER_DETAIL_DATA } from '@/lib/demo';

export default function ReturnRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = MOCK_USER_DETAIL_DATA;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert('返却申請を受け付けました！返却手順のメールをお送りします。📦');
      router.push('/portal');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/portal" className="text-pantore-500 hover:text-pantore-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-pantore-900">デバイス返却申請</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-pantore-200">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 返却対象の確認 */}
          <div className="bg-pantore-50 p-4 rounded-xl border border-pantore-200 flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm text-pantore-500">
               <PackageOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-pantore-500 font-bold uppercase">返却対象デバイス</p>
              <p className="text-lg font-bold text-pantore-900">{user.currentDevice?.model || '不明なデバイス'}</p>
              <p className="text-sm text-pantore-600 font-mono">S/N: {user.currentDevice?.serial || '---'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pantore-800 flex items-center gap-2 pb-2 border-b border-pantore-100">
              <Calendar className="w-5 h-5 text-pantore-500" />
              返却詳細
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">返却予定日 <span className="text-red-500">*</span></label>
                <input required type="date" className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-400" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">返却理由 <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-400">
                  <option>退職に伴う返却</option>
                  <option>プロジェクト終了</option>
                  <option>新機種への交換</option>
                  <option>不要になった</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="w-6 h-6 border-2 border-pantore-300 rounded-lg peer-checked:bg-pantore-600 peer-checked:border-pantore-600 transition-all bg-white"></div>
                    <Check className="w-4 h-4 text-white absolute left-1 top-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <span className="font-bold text-pantore-800">返送用キット（段ボール・伝票）の送付を希望する</span>
                    <p className="text-xs text-pantore-500">※ 自宅などから郵送で返却する場合にチェックしてください</p>
                  </div>
               </label>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-pantore-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-pantore-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? '送信中...' : '返却を申請する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}