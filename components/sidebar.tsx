'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Layers, LayoutDashboard, Users, Car, Building2, ShieldCheck,
    Building, CreditCard, Settings2, LogOut, UserCircle,
    Handshake, BookUser,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

const navItems = [
    { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
    { name: '社員管理', href: '/employees', icon: Users },
    { name: '車両管理', href: '/vehicles', icon: Car },
    { name: '不動産管理', href: '/real-estates', icon: Building2 },
    { name: 'サブスク管理', href: '/subscriptions', icon: CreditCard },
    { name: '契約管理', href: '/contracts', icon: ShieldCheck },
];

const dealNavItems = [
    { name: '取引管理', href: '/deals', icon: Handshake },
    { name: '取引先', href: '/clients', icon: BookUser },
];

const MOCK_SESSION = {
    name: '山田 太郎',
    email: 'taro.yamada@pantore.test',
    tenant: 'Pantore 株式会社',
    role: 'admin' as 'admin' | 'member',
    roleLabel: '管理者',
    avatarInitial: '山',
};

function NavLink({ item, pathname }: { item: { name: string; href: string; icon: React.ElementType }; pathname: string }) {
    const isActive = pathname.startsWith(item.href);
    return (
        <Link
            href={item.href}
            className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                    ? 'bg-amber-400/20 text-amber-200 shadow-inner'
                    : 'text-amber-100/60 hover:text-amber-100 hover:bg-white/8',
            )}
        >
            <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-amber-300' : 'text-amber-100/50')} />
            {item.name}
            {isActive && <span className="ml-auto w-1 h-4 rounded-full bg-amber-400 shrink-0" />}
        </Link>
    );
}

function SectionLabel({ label }: { label: string }) {
    return (
        <div className="pt-4 pb-1 px-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/40">{label}</p>
        </div>
    );
}

function UserMenu() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <div className="p-3 border-t border-white/10 relative" ref={ref}>
            {open && (
                <div className="absolute bottom-full left-3 right-3 mb-1 bg-amber-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-semibold text-amber-100 truncate">{MOCK_SESSION.name}</p>
                        <p className="text-xs text-amber-300/60 truncate">{MOCK_SESSION.email}</p>
                    </div>
                    <div className="py-1">
                        <Link
                            href="/account"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-100/80 hover:bg-white/8 hover:text-amber-100 transition-colors"
                        >
                            <UserCircle className="w-4 h-4" /> アカウント設定
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> ログアウト
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                    open ? 'bg-white/10' : 'hover:bg-white/8',
                )}
            >
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 text-sm font-bold shrink-0">
                    {MOCK_SESSION.avatarInitial}
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-amber-100 truncate">{MOCK_SESSION.name}</p>
                    <p className="text-[11px] text-amber-300/60 truncate">{MOCK_SESSION.roleLabel}</p>
                </div>
                <Settings2 className="w-3.5 h-3.5 text-amber-300/40 shrink-0" />
            </button>
        </div>
    );
}

export default function Sidebar({ tenantName, branchName }: { tenantName?: string; branchName?: string }) {
    const pathname = usePathname();
    const isAdmin = MOCK_SESSION.role === 'admin';

    return (
        <aside className="w-64 shrink-0 h-screen flex flex-col sticky top-0 z-20 hidden lg:flex bg-amber-950">

            {/* ── Logo / hero banner ───────────────────────────────── */}
            <div className="relative h-24 shrink-0 overflow-hidden">
                {/* Bakery image */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url(/hero-bakery.png)', backgroundPosition: 'center 35%' }}
                />
                {/* Amber gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-950/30 via-amber-950/60 to-amber-950" />
                {/* Logo */}
                <Link
                    href="/dashboard"
                    className="absolute bottom-3 left-4 flex items-center gap-2.5 group"
                >
                    <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Layers className="w-4 h-4 text-amber-950" />
                    </div>
                    <div>
                        <span className="font-bold text-base text-white tracking-tight leading-none">Pantore</span>
                        <p className="text-[10px] text-amber-300/70 leading-none mt-0.5">ERP</p>
                    </div>
                </Link>
            </div>

            {/* ── Tenant badge ─────────────────────────────────────── */}
            <div className="px-3 pt-3 pb-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-6 h-6 rounded-md bg-amber-400/20 flex items-center justify-center shrink-0">
                        <Building className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-amber-100 truncate">{tenantName || MOCK_SESSION.tenant}</p>
                        <p className="text-[10px] text-amber-300/50 truncate">{branchName || 'テナント'}</p>
                    </div>
                </div>
            </div>

            {/* ── Nav ──────────────────────────────────────────────── */}
            <nav className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                ))}

                <SectionLabel label="取引" />
                {dealNavItems.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                ))}

                {isAdmin && (
                    <>
                        <SectionLabel label="管理者専用" />
                        <NavLink item={{ name: '設定', href: '/settings', icon: Settings2 }} pathname={pathname} />
                    </>
                )}
            </nav>

            {/* ── User menu ────────────────────────────────────────── */}
            <UserMenu />
        </aside>
    );
}
