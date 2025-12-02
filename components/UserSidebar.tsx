"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plus,
  AlertCircle,
  ArrowRightLeft,
  LogOut,
  UtensilsCrossed,
  X,
  Settings
} from 'lucide-react';
import { fetchCurrentUserAction, signOutAction } from '@/app/actions';
import { type UserDetail } from '@/lib/types';
import { UserProfileModal } from './features/portal/UserProfileModal';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function UserSidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await fetchCurrentUserAction();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signOutAction();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const menuItems = [
    { name: 'マイページ', href: '/portal', icon: LayoutDashboard },
    { name: '新規貸出申請', href: '/portal/request/new', icon: Plus },
    { name: '故障・不具合', href: '/portal/request/repair', icon: AlertCircle },
    { name: '返却申請', href: '/portal/request/return', icon: ArrowRightLeft },
  ];

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* サイドバー本体 */}
      <aside className={`
        w-64 bg-pantore-50 border-r border-pantore-200 
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
        /* Desktop(md以上): 常に表示 */
        md:translate-x-0 
        /* Mobile(md未満): isOpenで出し入れ */
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        /* Flexレイアウト */
        flex flex-col h-full
      `}>

        {/* 上部エリア（ロゴ＋メニュー）: 余白を埋める */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-pantore-500 p-2 rounded-xl shadow-sm text-white">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-pantore-900">Pantore</span>
            </div>

            <button
              onClick={onClose}
              className="md:hidden p-1 text-pantore-500 hover:bg-pantore-200 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 pb-2">
            <span className="text-xs font-bold text-pantore-400 uppercase tracking-wider">User Menu</span>
          </div>

          <nav className="px-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all ${isActive
                    ? 'bg-white text-pantore-700 shadow-sm'
                    : 'text-pantore-600 hover:bg-white/50 hover:text-pantore-800'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-pantore-500' : 'text-pantore-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 管理者用ダッシュボードリンク */}
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <div className="px-4 mt-4 pt-4 border-t border-pantore-200">
              <Link
                href="/dashboard"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-pantore-600 hover:bg-white/50 hover:text-pantore-800 rounded-lg transition-all"
              >
                <Settings className="w-5 h-5 text-pantore-400" />
                管理画面へ
              </Link>
            </div>
          )}
        </div>

        {/* 下部エリア（プロフィール）: 最下部に固定 */}
        <div className="flex-shrink-0 p-4 bg-pantore-100/50 border-t border-pantore-200">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsProfileOpen(true)}
            >
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-xs font-bold text-pantore-600 border border-pantore-200 shadow-sm">
                {user?.avatar || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-pantore-900 truncate">{user ? user.name : 'Loading...'}</p>
                <p className="text-xs text-pantore-500 truncate">
                  {user ? (user.tenantName || (user.tenantId ? '一般ユーザー' : 'ワークスペース作成中...')) : ''}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="ログアウト"
              className="text-pantore-400 cursor-pointer hover:text-pantore-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* プロフィール編集モーダル */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialUser={user}
      />
    </>
  );
}