"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";
import { TenantSwitcher } from "@/components/TenantSwitcher";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* サイドバー */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        tenantSwitcher={<TenantSwitcher />}
      />
      
      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        
        {/* モバイル用ヘッダー（PCでは隠す） */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 font-bold text-lg text-pantore-900">Pantore Admin</span>
        </header>

        {/* コンテンツの中身 */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}