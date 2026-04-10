'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LayoutDashboard, Users, Car, Building2, ShieldCheck, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

export default function Sidebar() {
    const pathname = usePathname();
    const sidebarOpen = useAppStore((state) => state.sidebarOpen);

    const navItems = [
        { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
        { name: '社員管理', href: '/employees', icon: Users },
        { name: '車両管理', href: '/vehicles', icon: Car },
        { name: '不動産管理', href: '/real-estates', icon: Building2 },
        { name: '契約管理', href: '/contracts', icon: ShieldCheck },
    ];

    return (
        <aside className={cn(
            "bg-white dark:bg-[#0f172a] border-r border-border h-screen flex flex-col transition-all duration-300 z-20 sticky top-0",
            sidebarOpen ? "w-64" : "w-20 lg:w-64 -ml-20 lg:ml-0 hidden lg:flex"
        )}>
            <div className="h-16 flex items-center px-4 border-b border-border">
                <Link href="/dashboard" className="flex items-center group">
                    <Layers className="w-8 h-8 text-brand-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className={cn("ml-3 font-bold text-xl tracking-tight transition-opacity", sidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100")}>
                        Pantore
                    </span>
                </Link>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center px-3 py-2.5 rounded-xl font-medium transition-colors group",
                                isActive
                                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                            <span className={cn("ml-3 transition-opacity", sidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100")}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <Settings className="w-5 h-5 flex-shrink-0 text-slate-400" />
                    <span className={cn("ml-3 transition-opacity", sidebarOpen ? "opacity-100" : "opacity-0 lg:opacity-100")}>設定</span>
                </button>
            </div>
        </aside>
    );
}
