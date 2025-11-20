"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Plus, 
  AlertCircle, 
  ArrowRightLeft, 
  LogOut,
  User,
  UtensilsCrossed,
  X // 閉じるボタン用に追加
} from 'lucide-react';

// ユーザー情報をインポート
import { CURRENT_USER } from '@/lib/demo';

// Propsの定義を追加
interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function UserSidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  // ユーザー向けメニュー定義
  const menuItems = [
    { name: 'マイページ', href: '/portal', icon: LayoutDashboard },
    { name: '新規貸出申請', href: '/portal/request/new', icon: Plus },
    { name: '故障・不具合', href: '/portal/request/repair', icon: AlertCircle },
    { name: '返却申請', href: '/portal/request/return', icon: ArrowRightLeft },
  ];

  return (
    <>
      {/* モバイル用オーバーレイ（開いている時だけ表示） */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* サイドバー本体 */}
      <aside className={`
        w-64 bg-pantore-50 border-r border-pantore-200 
        fixed h-full z-50 transition-transform duration-300 ease-in-out
        /* デスクトップ(md以上): 常に表示、位置は固定 */
        md:translate-x-0 md:static md:flex md:flex-col md:justify-between
        /* モバイル(md未満): isOpenがtrueなら表示、falseなら画面外へ */
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        /* 共通スタイル */
        flex flex-col justify-between
      `}>
        <div>
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* ロゴ部分：ユーザー側は少し違うアイコン */}
              <div className="bg-pantore-500 p-2 rounded-xl shadow-sm text-white">
                 <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-pantore-900">Pantore</span>
            </div>

            {/* 🆕 モバイル用閉じるボタン */}
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
                  onClick={onClose} // モバイル時はリンククリックで閉じる
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all ${
                    isActive 
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
        </div>

        <div className="p-4 bg-pantore-100/50 border-t border-pantore-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-xs font-bold text-pantore-600 border border-pantore-200 shadow-sm">
              {CURRENT_USER.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-pantore-900 truncate">{CURRENT_USER.name}</p>
              <p className="text-xs text-pantore-500 truncate">一般ユーザー</p>
            </div>
            
            {/* 開発用：管理者画面へ戻る隠しリンク */}
            <Link href="/" title="管理者画面へ" className="text-pantore-400 cursor-pointer hover:text-pantore-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}