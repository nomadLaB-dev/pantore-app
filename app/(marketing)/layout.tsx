import React from 'react';
import Link from 'next/link';
import { PackageOpen } from 'lucide-react';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
            {/* Header */}
            <header className="fixed top-0 w-full bg-[#fdfbf7]/90 backdrop-blur-md border-b border-[#e7e5e4] z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-pantore-500 to-pantore-700 p-1.5 rounded-lg shadow-md transform rotate-3 hover:rotate-0 transition-transform duration-300">
                            <PackageOpen className="w-6 h-6 text-[#fffbeb]" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-[#78350f] font-serif">Pantore</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="px-6 py-2 text-sm font-bold text-[#fffbeb] bg-[#78350f] rounded-full hover:bg-[#92400e] transition-all shadow-md hover:shadow-lg border-2 border-[#92400e] hover:border-[#b45309]"
                        >
                            ログイン
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow pt-16 bg-[#fdfbf7]">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-[#292524] text-[#d6d3d1] py-12 border-t-4 border-pantore-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 opacity-90">
                        <PackageOpen className="w-5 h-5 text-pantore-500" />
                        <span className="font-bold text-[#f5f5f4] font-serif tracking-wide">Pantore</span>
                    </div>
                    <p className="text-sm text-[#a8a29e]">
                        &copy; {new Date().getFullYear()} Pantore. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
