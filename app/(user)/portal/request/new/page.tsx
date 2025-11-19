"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Laptop, 
  MessageSquare,
  Send,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function NewRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // モック送信処理
    setTimeout(() => {
      alert('申請を受け付けました！承認をお待ちください。🎉');
      router.push('/portal'); // ダッシュボードに戻る
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <Link href="/portal" className="text-pantore-500 hover:text-pantore-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-pantore-900">新規貸出申請</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-pantore-200">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pantore-800 flex items-center gap-2 pb-2 border-b border-pantore-100">
              <Calendar className="w-5 h-5 text-pantore-500" />
              利用期間・用途
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">利用開始希望日 <span className="text-red-500">*</span></label>
                <input required type="date" className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-400" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-pantore-700">利用目的 <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-400">
                  <option>新規入社・配属</option>
                  <option>開発・検証用端末</option>
                  <option>イベント・出張用</option>
                  <option>その他</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: デバイス要件 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pantore-800 flex items-center gap-2 pb-2 border-b border-pantore-100">
              <Laptop className="w-5 h-5 text-pantore-500" />
              希望スペック
            </h3>
            
            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="cursor-pointer group">
                    <input type="radio" name="os" className="peer sr-only" defaultChecked />
                    <div className="p-4 rounded-xl border-2 border-pantore-200 peer-checked:border-pantore-500 peer-checked:bg-pantore-50 transition-all hover:bg-pantore-50">
                      <span className="block font-bold text-pantore-900">Windows (標準)</span>
                      <span className="text-xs text-pantore-500">事務・営業向け / Microsoft Office搭載</span>
                    </div>
                  </label>
                  <label className="cursor-pointer group">
                    <input type="radio" name="os" className="peer sr-only" />
                    <div className="p-4 rounded-xl border-2 border-pantore-200 peer-checked:border-pantore-500 peer-checked:bg-pantore-50 transition-all hover:bg-pantore-50">
                      <span className="block font-bold text-pantore-900">macOS (開発用)</span>
                      <span className="text-xs text-pantore-500">エンジニア・デザイン向け / MacBook Proなど</span>
                    </div>
                  </label>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-bold text-pantore-700">具体的なスペック要望 (任意)</label>
                  <textarea 
                    rows={3} 
                    placeholder="例: 重い処理をするのでメモリ32GB以上が希望です。持ち運びが多いので軽いモデルが良いです。"
                    className="w-full px-4 py-3 bg-pantore-50 border border-pantore-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-400 resize-none"
                  />
               </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-pantore-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-pantore-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                '送信中...'
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  申請を送信する
                </>
              )}
            </button>
            <p className="text-center text-xs text-pantore-400 mt-4">
              ※ 申請後、承認まで1〜3営業日ほどかかる場合があります。
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}