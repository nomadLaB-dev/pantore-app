"use client";

import React, { useState, useEffect, use } from 'react';
import { getInvitationAction, joinTenantAction } from '@/app/actions/invitations';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
    const router = useRouter();
    const { token } = use(params);
    const [invitation, setInvitation] = useState<{ tenantName: string; domainRestriction: string | null } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadInvitation = async () => {
            try {
                const data = await getInvitationAction(token);
                if (!data) {
                    setError('招待リンクが無効か、期限切れです。');
                } else {
                    setInvitation(data);
                }
            } catch (err) {
                console.error(err);
                setError('招待情報の取得に失敗しました。');
            } finally {
                setIsLoading(false);
            }
        };
        loadInvitation();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await joinTenantAction(token, name, email, password);
            // Success
            alert('登録が完了しました！ログイン画面へ移動します。');
            router.push('/login');
        } catch (err: any) {
            console.error(err);
            setError(err.message || '登録に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pantore-600"></div>
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">エラーが発生しました</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="bg-pantore-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                        <Building2 className="w-8 h-8 text-pantore-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {invitation?.tenantName} に参加
                    </h1>
                    <p className="text-sm text-gray-500">
                        招待リンクを受け取りました。<br />
                        アカウントを作成してワークスペースに参加しましょう。
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Domain Restriction Notice */}
                {invitation?.domainRestriction && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 text-blue-700 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>
                            この招待リンクは <strong>@{invitation.domainRestriction}</strong> のメールアドレスのみ登録可能です。
                        </span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">お名前</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                required
                                placeholder="山田 太郎"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">メールアドレス</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                required
                                placeholder="taro@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">パスワード</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                required
                                placeholder="8文字以上"
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pantore-500 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-pantore-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-pantore-200 hover:bg-pantore-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                アカウントを作成して参加
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                        すでにアカウントをお持ちの場合は、
                        <a href="/login" className="text-pantore-600 hover:underline font-bold">ログイン</a>
                        してから管理者に招待を依頼してください。
                    </p>
                </div>
            </div>
        </div>
    );
}
