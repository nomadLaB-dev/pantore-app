import UserSidebar from "@/components/UserSidebar";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-pantore-50">
      {/* ユーザー専用サイドバー */}
      <UserSidebar />
      
      {/* メインコンテンツエリア */}
      <main className="flex-1 md:ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}