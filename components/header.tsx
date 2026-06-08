'use client';
import { useRouter } from 'next/router';

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
    const { pathname } = useRouter();
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
            <div className="relative z-10 w-full px-5 md:px-7 pb-3">
                <h2 className="text-lg font-bold text-white drop-shadow-md tracking-tight">{title}</h2>
            </div>
        </header>
    );
}
