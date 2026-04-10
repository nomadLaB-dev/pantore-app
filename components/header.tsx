'use client';
import { Menu, Moon, Sun, Bell, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store';
import { useRouter } from 'next/navigation';

export default function Header() {
    const { theme, setTheme } = useTheme();
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-border flex items-center justify-between px-4 z-10 sticky top-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="h-8 w-px bg-border mx-2"></div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">ログアウト</span>
                </button>
            </div>
        </header>
    );
}
