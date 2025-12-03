"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, PackageOpen, Check } from 'lucide-react';
import Link from 'next/link';
import { type CreateRequestInput, type UserDetail } from '@/lib/types';
import { createRequestAction } from '@/app/actions/requests';
import { fetchCurrentUserAction } from '@/app/actions/auth';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export default function ReturnRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [formData, setFormData] = useState({ date: '', reason: '退職に伴う返却', kit: false });
  const [selectedDeviceSerial, setSelectedDeviceSerial] = useState<string>('');

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
        if (userData.currentDevices && userData.currentDevices.length > 0) {
          setSelectedDeviceSerial(userData.currentDevices[0].serial);
        }
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
      toast.error('ユーザー情報の取得に失敗しました。');
      return;
    }

    const selectedDevice = user.currentDevices.find(d => d.serial === selectedDeviceSerial);
    const deviceName = selectedDevice ? `${selectedDevice.model} (${selectedDevice.serial})` : '不明なデバイス';

    setIsSubmitting(true);

    const newRequest: CreateRequestInput = {
      type: 'return',
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      detail: `${formData.reason} - 対象: ${deviceName}`,
      note: `返却予定: ${formData.date} ${formData.kit ? '(返送キット希望)' : ''}`
    };

    try {
      await createRequestAction(newRequest);
      toast.success('返却申請を受け付けました！📦');
      router.push('/portal');
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error('申請の送信に失敗しました。');
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

          <div className="bg-pantore-50 p-4 rounded-xl border border-pantore-200 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white rounded-lg shadow-sm text-pantore-500"><PackageOpen className="w-5 h-5" /></div>
              <p className="text-xs text-pantore-500 font-bold uppercase">返却対象デバイスを選択</p>
            </div>

            {user.currentDevices && user.currentDevices.length > 0 ? (
              <div className="space-y-2">
                {user.currentDevices.map((device) => (
                  <label key={device.serial} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedDeviceSerial === device.serial ? 'bg-white border-pantore-500 shadow-sm ring-1 ring-pantore-500' : 'bg-white/50 border-pantore-200 hover:bg-white'}`}>
                    <input
                      type="radio"
                      name="device"
                      value={device.serial}
                      checked={selectedDeviceSerial === device.serial}
                      onChange={(e) => setSelectedDeviceSerial(e.target.value)}
                      className="w-4 h-4 accent-pantore-600"
                    />
                    <div>
                      <p className="font-bold text-pantore-900 text-sm">{device.model}</p>
                      <p className="text-xs text-pantore-500 font-mono">S/N: {device.serial}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-red-500 font-bold">返却可能なデバイスが見つかりません</p>
            )}
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