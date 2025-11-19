"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Monitor, 
  Users, 
  FileText, 
  BarChart, // 追加
  LogOut,
  UserCircle,
  Utensils // パン要素としてカトラリーアイコン追加
} from 'lucide-react';

// ユーザー情報をインポート
import { CURRENT_USER } from '@/lib/demo';

export default function Sidebar() {
  const pathname = usePathname();

  // メニュー定義
  const menuItems = [
    { name: 'ダッシュボード', href: '/', icon: LayoutDashboard },
    { name: '資産管理', href: '/assets', icon: Monitor },
    { name: 'ユーザー管理', href: '/users', icon: Users },
    { name: '申請一覧', href: '/requests', icon: FileText },
    { name: 'レポート', href: '/reports', icon: BarChart }, // 追加
  ];

  return (
    // 背景を pantore-100 (トレー色) に変更
    <aside className="w-64 bg-pantore-100 border-r border-pantore-200 fixed h-full z-10 hidden md:flex flex-col justify-between">
      <div>
        <div className="p-6 flex items-center gap-3">
          {/* ロゴ部分：パン色に変更 */}
          <div className="bg-pantore-600 p-2 rounded-xl shadow-sm text-white">
             <Utensils className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-pantore-900">Pantore</span>
        </div>

        <nav className="px-4 space-y-1 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all ${
                  isActive 
                    ? 'bg-white text-pantore-700 shadow-sm' // アクティブ時は白カード風に
                    : 'text-pantore-600 hover:bg-white/50 hover:text-pantore-800'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-pantore-500' : 'text-pantore-400'}`} />
                {item.name}
              </Link>
            );
          })}

          {/* 区切り線 */}
          <div className="my-4 border-t border-pantore-200 mx-4"></div>

          {/* ユーザーポータルへのリンク */}
          <Link
            href="/portal"
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all ${
              pathname === '/portal' 
                ? 'bg-white text-pantore-700 shadow-sm' 
                : 'text-pantore-600 hover:bg-white/50'
            }`}
          >
            <UserCircle className="w-5 h-5 text-pantore-400" />
            ユーザーポータル
          </Link>
        </nav>
      </div>

      <div className="p-4 bg-pantore-50/50 border-t border-pantore-200">
        <div className="flex items-center gap-3">
          {/* イニシャルアバター：焼き色に */}
          <div className="w-9 h-9 rounded-full bg-pantore-300 flex items-center justify-center text-xs font-bold text-pantore-800 border-2 border-white shadow-sm">
            {CURRENT_USER.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-pantore-900 truncate">{CURRENT_USER.name}</p>
            <p className="text-xs text-pantore-500 truncate">{CURRENT_USER.email}</p>
          </div>
          <button className="text-pantore-400 cursor-pointer hover:text-pantore-600 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}