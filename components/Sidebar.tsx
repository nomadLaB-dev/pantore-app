"use client";

import React, { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Monitor,
  Users,
  FileText,
  BarChart,
  LogOut,
  UserCircle,
  Utensils,
  Settings,
  X
} from 'lucide-react';
import { fetchCurrentUserAction, signOutAction } from '@/app/actions';
import { type UserDetail } from '@/lib/types';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  tenantSwitcher?: ReactNode; // Tenant switcher component
}

export default function Sidebar({ isOpen = false, onClose, tenantSwitcher }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserDetail | null>(null);

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
    { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
    { name: '資産管理', href: '/dashboard/assets', icon: Monitor },
    { name: 'ユーザー管理', href: '/dashboard/users', icon: Users },
    { name: '申請一覧', href: '/dashboard/requests', icon: FileText },
    { name: 'レポート', href: '/dashboard/reports', icon: BarChart },
    { name: '組織設定', href: '/dashboard/settings', icon: Settings },
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
        w-64 bg-pantore-100 border-r border-pantore-200 
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
        /* Desktop(md以上): 常に表示 */
        md:translate-x-0 
        /* Mobile(md未満): isOpenで出し入れ */
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        /* Flexレイアウト: 縦並びで、高さいっぱい使う */
        flex flex-col h-full
      `}>
        {/* 🚀 ポイント: flex-1 を指定することで、
          このdivが余ったスペースを全部使い、プロフィールを下に押し下げます 
        */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-pantore-600 p-2 rounded-xl shadow-sm text-white">
                <Utensils className="w-5 h-5" />
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
          
          {/* Tenant Switcher Slot */}
          <div className="px-4 mt-2 mb-4">
            {tenantSwitcher}
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

            <div className="my-4 border-t border-pantore-200 mx-4"></div>

            <Link
              href="/portal"
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all ${pathname === '/portal'
                ? 'bg-white text-pantore-700 shadow-sm'
                : 'text-pantore-600 hover:bg-white/50'
                }`}
            >
              <UserCircle className="w-5 h-5 text-pantore-400" />
              ユーザーポータル
            </Link>
          </nav>
        </div>

        {/* プロフィールエリア: flex-shrink-0 で縮まないように固定 */}
        <div className="flex-shrink-0 p-4 bg-pantore-50/50 border-t border-pantore-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-pantore-300 flex items-center justify-center text-xs font-bold text-pantore-800 border-2 border-white shadow-sm">
              {user?.avatar || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-pantore-900 truncate">{user?.name || 'Loading...'}</p>
              <p className="text-xs text-pantore-500 truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-pantore-400 cursor-pointer hover:text-pantore-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}