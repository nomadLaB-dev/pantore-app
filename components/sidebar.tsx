'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LayoutDashboard, Users, Car, Building2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
    { name: '社員管理', href: '/employees', icon: Users },
    { name: '車両管理', href: '/vehicles', icon: Car },
    { name: '不動産管理', href: '/real-estates', icon: Building2 },
    { name: '契約管理', href: '/contracts', icon: ShieldCheck },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 shrink-0 bg-card border-r border-border h-screen flex flex-col sticky top-0 z-20 hidden lg:flex">
            <div className="h-16 flex items-center px-5 border-b border-border">
                <Link href="/dashboard" className="flex items-center gap-2.5 group">
                    <Layers className="w-7 h-7 text-brand-500 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-lg tracking-tight">Pantore</span>
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
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                        >
                            <item.icon className={cn('w-4.5 h-4.5 shrink-0', isActive ? 'text-brand-500' : 'text-muted-foreground')} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
