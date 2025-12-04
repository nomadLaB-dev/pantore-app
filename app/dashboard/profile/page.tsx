'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchCurrentUserAction } from '@/app/actions/auth';
import { updatePasswordAction } from '@/app/(auth)/actions';
import { UserDetail } from '@/lib/types';

export default function ProfilePage() {
    const [user, setUser] = useState<UserDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Password Form State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await fetchCurrentUserAction();
                setUser(userData);
            } catch (error) {
                console.error('Failed to load user:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'パスワードは6文字以上である必要があります。' });
            return;
        }

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'パスワードが一致しません。' });
            return;
        }

        setIsSaving(true);
        try {
            await updatePasswordAction(password);
            setMessage({ type: 'success', text: 'パスワードを更新しました。' });
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'パスワードの更新に失敗しました。' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-10 text-center text-gray-500">読み込み中...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-10 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">プロフィール設定</h2>
                <p className="text-sm text-gray-500 mt-1">アカウント情報の確認とセキュリティ設定を行います</p>
            </div>

            {/* User Info Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                    <User className="w-5 h-5 text-pantore-500" />
                    基本情報
                </h3>

                <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-full bg-pantore-100 flex items-center justify-center text-2xl font-bold text-pantore-600 border-4 border-white shadow-md">
                        {user?.avatar || user?.name?.[0] || 'U'}
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-gray-900">{user?.name}</h4>
                        <p className="text-gray-500">{user?.email}</p>
                        <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
                                {user?.role === 'owner' ? 'オーナー' : user?.role === 'admin' ? '管理者' : 'メンバー'}
                            </span>
                            <span className="px-2 py-1 bg-pantore-50 text-pantore-700 text-xs rounded-md font-medium">
                                {user?.dept || '部署未設定'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Change Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                    <Lock className="w-5 h-5 text-pantore-500" />
                    パスワード変更
                </h3>

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-2 text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">新しいパスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="6文字以上"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">新しいパスワード（確認）</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="もう一度入力してください"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pantore-500"
                        />
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving || !password || !confirmPassword}
                            className="bg-pantore-600 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-pantore-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? '更新中...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    パスワードを更新
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
