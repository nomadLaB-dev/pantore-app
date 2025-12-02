import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AutoLogout from "@/components/features/auth/AutoLogout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pantore | 社内資産管理システム",
  description: "PC資産とユーザー利用状況を一元管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* アプリ全体のベースとなる設定です。
        bg-white text-gray-900 で、ダークモードの影響を受けない白背景・黒文字に固定しています。
      */}
      <body className={`${inter.className} min-h-screen bg-white text-gray-900`}>
        <AutoLogout />
        {children}
      </body>
    </html>
  );
}