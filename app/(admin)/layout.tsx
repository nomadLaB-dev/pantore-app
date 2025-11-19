import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* 管理者画面にはサイドバーを表示 */}
      <Sidebar />
      
      {/* メインコンテンツエリア
          md:ml-64 はサイドバーの幅(w-64)分だけ左に余白を開ける設定です
      */}
      <main className="flex-1 md:ml-64 p-8 bg-gray-50/50">
        {children}
      </main>
    </div>
  );
}