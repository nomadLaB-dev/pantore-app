"use client";

import React, { useState } from 'react';
import UserSidebar from "@/components/UserSidebar";
import { Menu } from "lucide-react";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-pantore-50">
      {/* ユーザー専用サイドバー 
          スマホ時は isSidebarOpen で出し入れ
      */}
      <UserSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* メインコンテンツエリア */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 transition-all duration-300">
        
        {/* 🆕 モバイル用ヘッダー（PCでは隠す） */}
        <header className="md:hidden bg-white border-b border-pantore-200 p-4 flex items-center sticky top-0 z-30 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-pantore-600 hover:bg-pantore-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 font-bold text-lg text-pantore-900">Pantore Portal</span>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}