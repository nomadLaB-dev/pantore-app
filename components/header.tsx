'use client';
import { Moon, Sun, Bell, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Map route → Japanese page title
const pageTitles: Record<string, string> = {
    '/dashboard': 'ダッシュボード',
    '/employees': '社員管理',
    '/vehicles': '車両管理',
    '/real-estates': '不動産管理',
    '/subscriptions': 'サブスク管理',
    '/contracts': '契約管理',
    '/deals': '取引管理',
    '/clients': '取引先',
    '/settings': '設定',
    '/account': 'アカウント設定',
};

function getPageTitle(pathname: string) {
    for (const [key, val] of Object.entries(pageTitles)) {
        if (pathname.startsWith(key)) return val;
    }
    return 'Pantore';
}

export default function Header() {
    const { theme, setTheme } = useTheme();
    const pathname = usePathname();
    const title = getPageTitle(pathname);

    return (
        <header className="relative h-20 sticky top-0 z-10 overflow-hidden flex items-end">
            {/* Bakery hero image cropped as banner */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(/hero-bakery.png)', backgroundPosition: 'center 40%' }}
            />
            {/* Warm amber gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-800/40 dark:from-amber-950/90 dark:via-amber-900/70 dark:to-amber-800/50" />
            {/* Bottom fade to background */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background/30 to-transparent" />
            {/* Gold shimmer line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-yellow-300/0 via-yellow-400/50 to-yellow-300/0" />

            {/* Content */}
            <div className="relative z-10 flex items-center justify-between w-full px-5 md:px-7 pb-3">
                <h2 className="text-lg font-bold text-white drop-shadow-md tracking-tight">{title}</h2>

                <div className="flex items-center gap-1">
                    {/* Notification */}
                    <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 relative">
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                    </Button>

                    {/* Theme toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
