'use client';
import { useState } from 'react';
import { UserCircle, Mail, Lock, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AccountPage() {
    const [saved, setSaved] = useState<string | null>(null);

    const [profile, setProfile] = useState({ name: '山田 太郎', email: 'taro.yamada@pantore.test' });
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
    const [pwError, setPwError] = useState('');

    const saveProfile = () => {
        setSaved('profile');
        setTimeout(() => setSaved(null), 2000);
    };

    const savePassword = () => {
        setPwError('');
        if (passwords.next !== passwords.confirm) {
            setPwError('新しいパスワードが一致しません。');
            return;
        }
        if (passwords.next.length < 8) {
            setPwError('パスワードは8文字以上で設定してください。');
            return;
        }
        setSaved('password');
        setPasswords({ current: '', next: '', confirm: '' });
        setTimeout(() => setSaved(null), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">アカウント設定</h1>
                <p className="text-muted-foreground text-sm">プロフィールとパスワードを管理します。</p>
            </div>

            {/* Profile */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-brand-500" /> プロフィール
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">氏名</label>
                        <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">メールアドレス</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="email"
                                className="pl-9"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            className="bg-brand-500 hover:bg-brand-600 text-white gap-2"
                            onClick={saveProfile}
                        >
                            {saved === 'profile' ? <><CheckCircle2 className="w-4 h-4" /> 保存しました</> : <><Save className="w-4 h-4" /> 変更を保存</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lock className="w-4 h-4 text-brand-500" /> パスワード変更
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {pwError && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
                            {pwError}
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">現在のパスワード</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">新しいパスワード</label>
                        <Input
                            type="password"
                            placeholder="8文字以上"
                            value={passwords.next}
                            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">新しいパスワード（確認）</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button
                            className="bg-brand-500 hover:bg-brand-600 text-white gap-2"
                            disabled={!passwords.current || !passwords.next || !passwords.confirm}
                            onClick={savePassword}
                        >
                            {saved === 'password' ? <><CheckCircle2 className="w-4 h-4" /> 変更しました</> : <><Lock className="w-4 h-4" /> パスワードを変更</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
