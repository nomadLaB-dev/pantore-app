'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LayoutDashboard, Users, Car, Building2, ShieldCheck, ChevronDown, Building, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

const navItems = [
    { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
    { name: '社員管理', href: '/employees', icon: Users },
    { name: '車両管理', href: '/vehicles', icon: Car },
    { name: '不動産管理', href: '/real-estates', icon: Building2 },
    { name: 'サブスク管理', href: '/subscriptions', icon: CreditCard },
    { name: '契約管理', href: '/contracts', icon: ShieldCheck },
];

// Mock current user/tenant — will come from Supabase session in future
const MOCK_SESSION = {
    name: '山田 太郎',
    email: 'taro.yamada@pantore.test',
    tenant: 'Pantore 株式会社',
    role: '管理者',
    avatarInitial: '山',
};

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 shrink-0 bg-card border-r border-border h-screen flex flex-col sticky top-0 z-20 hidden lg:flex">
            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
                <Link href="/dashboard" className="flex items-center gap-2.5 group">
                    <Layers className="w-7 h-7 text-brand-500 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-lg tracking-tight">Pantore</span>
                </Link>
            </div>

            {/* Tenant badge */}
            <div className="px-3 pt-3 pb-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/60 border border-border">
                    <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0">
                        <Building className="w-3.5 h-3.5 text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{MOCK_SESSION.tenant}</p>
                        <p className="text-[10px] text-muted-foreground">テナント</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto">
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
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                            )}
                        >
                            <item.icon className={cn('w-4.5 h-4.5 shrink-0', isActive ? 'text-brand-500' : 'text-muted-foreground')} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Account info */}
            <div className="p-3 border-t border-border">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {MOCK_SESSION.avatarInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{MOCK_SESSION.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{MOCK_SESSION.role}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </div>
            </div>
        </aside>
    );
}
