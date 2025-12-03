"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Building2, Save, Plus, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { type UserDetail, type EmploymentHistory } from '@/lib/types';
import {
    fetchUserDetailAction,
    createEmploymentHistoryAction,
    updateEmploymentHistoryAction,
    deleteEmploymentHistoryAction,
} from '@/app/actions/users';
import { fetchMasterDataAction } from '@/app/actions/settings';
import { updateSelfProfileAction } from '@/app/actions/auth';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { type MasterData } from '@/lib/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialUser: UserDetail | null;
}

export const UserProfileModal = ({ isOpen, onClose, initialUser }: Props) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'history'>('basic');
    const [user, setUser] = useState<UserDetail | null>(initialUser);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Basic Info State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);

    // History State
    const [historyList, setHistoryList] = useState<EmploymentHistory[]>([]);
    const [editingHistory, setEditingHistory] = useState<EmploymentHistory | null>(null);
    const [isHistoryFormOpen, setIsHistoryFormOpen] = useState(false);
    const [masterData, setMasterData] = useState<MasterData>({ companies: [], departments: [], branches: [] });

    // Load data when modal opens
    useEffect(() => {
        if (isOpen && initialUser) {
            setName(initialUser.name);
            setEmail(initialUser.email);
            setPassword('');
            setIsPasswordChangeOpen(false);
            loadLatestData(initialUser.id);
            loadMasterData();
        }
    }, [isOpen, initialUser]);

    const loadMasterData = async () => {
        try {
            const data = await fetchMasterDataAction();
            setMasterData(data);
        } catch (error) {
            console.error('Failed to load master data:', error);
        }
    };

    const loadLatestData = async (userId: string) => {
        setIsLoading(true);
        try {
            const detail = await fetchUserDetailAction(userId);
            if (detail) {
                setUser(detail);
                setHistoryList(detail.history || []);
                // Update basic info fields if they haven't been modified by user yet? 
                // Actually, better to sync them.
                setName(detail.name);
                setEmail(detail.email);
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveBasicInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            await updateSelfProfileAction({
                name,
                email,
                password: isPasswordChangeOpen ? password : undefined
            });
            alert('プロフィールを更新しました！');
            setPassword(''); // Clear password after save
            setIsPasswordChangeOpen(false);
            loadLatestData(user.id); // Reload
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            alert(`更新に失敗しました: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveHistory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !editingHistory) return;
        setIsSaving(true);
        try {
            if (editingHistory.id === 0) {
                // Create
                await createEmploymentHistoryAction({ ...editingHistory, userId: user.id });
            } else {
                // Update
                await updateEmploymentHistoryAction(editingHistory);
            }
            setIsHistoryFormOpen(false);
            setEditingHistory(null);
            loadLatestData(user.id);
        } catch (error) {
            console.error('Failed to save history:', error);
            alert('履歴の保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteHistory = async (historyId: number) => {
        if (!confirm('この履歴を削除してもよろしいですか？')) return;
        if (!user) return;
        try {
            await deleteEmploymentHistoryAction(historyId);
            loadLatestData(user.id);
        } catch (error) {
            console.error('Failed to delete history:', error);
            alert('履歴の削除に失敗しました。');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-pantore-500" />
                        プロフィール編集
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-200 p-2 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'basic' ? 'text-pantore-600 border-b-2 border-pantore-600 bg-pantore-50' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        基本情報
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'history' ? 'text-pantore-600 border-b-2 border-pantore-600 bg-pantore-50' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        所属履歴
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-pantore-500" /></div>
                    ) : (
                        <>
                            {activeTab === 'basic' && (
                                <form onSubmit={handleSaveBasicInfo} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">氏名</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pantore-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">メールアドレス</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pantore-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="border-t border-gray-100 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsPasswordChangeOpen(!isPasswordChangeOpen)}
                                            className="text-sm font-bold text-pantore-600 hover:underline flex items-center gap-1"
                                        >
                                            {isPasswordChangeOpen ? 'パスワード変更をキャンセル' : 'パスワードを変更する'}
                                        </button>

                                        {isPasswordChangeOpen && (
                                            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2">
                                                <label className="text-sm font-bold text-gray-700">新しいパスワード</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        minLength={6}
                                                        placeholder="6文字以上"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pantore-500 focus:border-transparent pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500">※変更しない場合は空欄のままにしてください</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-pantore-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:bg-pantore-700 transition-all flex items-center gap-2 disabled:opacity-70"
                                        >
                                            {isSaving ? '保存中...' : <><Save className="w-4 h-4" /> 保存する</>}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-pantore-500" /> 履歴一覧
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setEditingHistory({
                                                    id: 0,
                                                    startDate: new Date().toISOString().split('T')[0],
                                                    endDate: null,
                                                    company: '',
                                                    dept: '',
                                                    branch: '',
                                                    position: ''
                                                });
                                                setIsHistoryFormOpen(true);
                                            }}
                                            className="text-xs bg-pantore-50 text-pantore-600 px-3 py-1.5 rounded-full hover:bg-pantore-100 flex items-center gap-1 font-bold border border-pantore-200"
                                        >
                                            <Plus className="w-3 h-3" /> 追加
                                        </button>
                                    </div>

                                    {isHistoryFormOpen && editingHistory && (
                                        <form onSubmit={handleSaveHistory} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 animate-in fade-in">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-600 block mb-1">開始日</label>
                                                    <input
                                                        type="date"
                                                        value={editingHistory.startDate}
                                                        onChange={(e) => setEditingHistory({ ...editingHistory, startDate: e.target.value })}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-600 block mb-1">終了日 (空欄で「現在」)</label>
                                                    <input
                                                        type="date"
                                                        value={editingHistory.endDate || ''}
                                                        onChange={(e) => setEditingHistory({ ...editingHistory, endDate: e.target.value || null })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <AutocompleteInput
                                                        label="会社名"
                                                        value={editingHistory.company}
                                                        onChange={(val) => setEditingHistory({ ...editingHistory, company: val })}
                                                        options={masterData.companies}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <AutocompleteInput
                                                        label="拠点・支店"
                                                        value={editingHistory.branch}
                                                        onChange={(val) => setEditingHistory({ ...editingHistory, branch: val })}
                                                        options={masterData.branches}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <AutocompleteInput
                                                        label="部署"
                                                        value={editingHistory.dept}
                                                        onChange={(val) => setEditingHistory({ ...editingHistory, dept: val })}
                                                        options={masterData.departments}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-600 block mb-1">役職</label>
                                                    <input
                                                        type="text"
                                                        value={editingHistory.position}
                                                        onChange={(e) => setEditingHistory({ ...editingHistory, position: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsHistoryFormOpen(false); setEditingHistory(null); }}
                                                    className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded-lg"
                                                >
                                                    キャンセル
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSaving}
                                                    className="px-3 py-1.5 text-sm bg-pantore-600 text-white rounded-lg hover:bg-pantore-700"
                                                >
                                                    保存
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    <div className="space-y-4">
                                        {historyList.length > 0 ? historyList.map((h, i) => (
                                            <div key={h.id} className="relative pl-6 border-l-2 border-gray-200 pb-4 last:pb-0 group">
                                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${!h.endDate ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800">{h.company}</h4>
                                                        <p className="text-sm text-gray-600">{h.branch} - {h.dept} / {h.position}</p>
                                                        <p className="text-xs text-gray-400 font-mono mt-1">{h.startDate} 〜 {h.endDate || '現在'}</p>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => { setEditingHistory(h); setIsHistoryFormOpen(true); }}
                                                            className="p-1 text-gray-400 hover:text-pantore-600 hover:bg-gray-100 rounded"
                                                            title="編集"
                                                        >
                                                            <Save className="w-4 h-4" /> {/* Reusing Save icon as Edit icon looks weird, let's just use text or generic edit icon if available, but Save is fine for now or maybe just click to edit */}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteHistory(h.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                            title="削除"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-center text-gray-400 text-sm py-4">履歴がありません</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
