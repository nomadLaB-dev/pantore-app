'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    Layers, LayoutDashboard, Users, Car, Building2,
    Building, Settings2, LogOut, UserCircle,
    CalendarDays, Scale,
    Clock, Bell, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import type { SpecimenRole } from '@/types';

const erpNavItems = [
    { name: '車両管理', href: '/vehicles', icon: Car },
    { name: '不動産管理', href: '/real-estates', icon: Building },
    { name: '勤怠管理', href: '/attendance', icon: Clock },
    { name: '取適法', href: '/tekiho', icon: Scale },
];

const peopleNavItems = [
    { name: 'オペレーター', href: '/operators', icon: Users },
    { name: '拠点・支社', href: '/branches', icon: Building2 },
];

const specimenNavItems = [
    { name: 'スケジュール', href: '/schedules', icon: CalendarDays },
];

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

function UserMenu({ name, email, tenantName, branchName, hideTenantName }: { name: string; email: string; tenantName?: string; branchName?: string; hideTenantName?: boolean }) {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
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
            <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-md bg-amber-400/20 flex items-center justify-center shrink-0">
                    <Building className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                    {!hideTenantName && <p className="text-xs font-semibold text-amber-100 truncate">{tenantName}</p>}
                    <p className={`text-amber-300/50 truncate ${hideTenantName ? 'text-xs font-semibold text-amber-100' : 'text-[10px]'}`}>{branchName || 'テナント'}</p>
                </div>
            </div>

            {open && (
                <div className="absolute bottom-full left-3 right-3 mb-1 bg-amber-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-semibold text-amber-100 truncate">{name}</p>
                        <p className="text-xs text-amber-300/60 truncate">{email}</p>
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

            <div className="flex items-center gap-1 mb-2">
                <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                </Button>
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

            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                    open ? 'bg-white/10' : 'hover:bg-white/8',
                )}
            >
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 text-sm font-bold shrink-0">
                    {name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-amber-100 truncate">{name}</p>
                    <p className="text-[11px] text-amber-300/60 truncate">{email}</p>
                </div>
                <Settings2 className="w-3.5 h-3.5 text-amber-300/40 shrink-0" />
            </button>
        </div>
    );
}

export default function Sidebar({
    tenantName,
    branchName,
    specimenRole,
    currentUser,
    mobileOpen = false,
    onCloseMobile,
}: {
    tenantName?: string;
    branchName?: string;
    specimenRole?: SpecimenRole;
    currentUser?: { name: string; email: string };
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
}) {
    const { pathname } = useRouter();
    const isBase = specimenRole === 'base';
    const isDriver = specimenRole === 'driver';
    const isAdmin = specimenRole === 'admin';

    const innerContent = (
        <>
            {/* ── Logo / hero banner ───────────────────────────────── */}
            <div className="relative h-24 shrink-0 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url(/Chimera.png)', backgroundPosition: 'center 35%' }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-amber-950/30 via-amber-950/60 to-amber-950" />
                <Link
                    href={isDriver ? '/schedules' : '/dashboard'}
                    className="absolute bottom-3 left-4 flex items-center gap-2.5 group"
                    onClick={onCloseMobile}
                >
                    <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Layers className="w-4 h-4 text-amber-950" />
                    </div>
                    <div>
                        <span className="font-bold text-base text-white tracking-tight leading-none">SpecimenChimera</span>
                        <p className="text-[10px] text-amber-300/70 leading-none mt-0.5">ERP</p>
                    </div>
                </Link>
            </div>

            {/* ── Nav ──────────────────────────────────────────────── */}
            <nav className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(251,191,36,0.2)_transparent] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-400/20 [&::-webkit-scrollbar-thumb:hover]:bg-amber-400/40]">

                {/* ドライバーは集配送予定とタイムカードのみ表示 */}
                {isDriver ? (
                    <>
                        <SectionLabel label="予定管理" />
                        {specimenNavItems.map((item) => (
                            <NavLink key={item.href} item={item} pathname={pathname} />
                        ))}
                        <SectionLabel label="勤怠" />
                        <NavLink item={{ name: 'タイムカード', href: '/timecard', icon: Clock }} pathname={pathname} />
                    </>
                ) : (
                    <>
                        <NavLink item={{ name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard }} pathname={pathname} />

                        {specimenRole && (
                            <>
                                <SectionLabel label="予定管理" />
                                {specimenNavItems.map((item) => (
                                    <NavLink key={item.href} item={item} pathname={pathname} />
                                ))}
                            </>
                        )}

                        {!isBase && (
                            <>
                                <SectionLabel label="ERP管理" />
                                {erpNavItems.map((item) => (
                                    <NavLink key={item.href} item={item} pathname={pathname} />
                                ))}
                            </>
                        )}

                        {isAdmin && (
                            <>
                                <SectionLabel label="管理者専用" />
                                <NavLink item={{ name: '設定', href: '/settings', icon: Settings2 }} pathname={pathname} />
                            </>
                        )}

                        {peopleNavItems
                            .filter((item) => !isBase || item.href === '/branches')
                            .map((item) => (
                                <NavLink key={item.href} item={item} pathname={pathname} />
                            ))}
                    </>
                )}
            </nav>

            {/* ── User menu ────────────────────────────────────────── */}
            <UserMenu name={currentUser?.name ?? ''} email={currentUser?.email ?? ''} tenantName={tenantName} branchName={branchName} hideTenantName={isBase || isDriver} />
        </>
    );

    return (
        <>
            {/* デスクトップサイドバー */}
            <aside className="w-64 shrink-0 h-screen flex flex-col sticky top-0 z-20 hidden lg:flex bg-amber-950">
                {innerContent}
            </aside>

            {/* モバイルオーバーレイドロワー */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={onCloseMobile}
                        aria-hidden
                    />
                    <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-amber-950 lg:hidden">
                        {innerContent}
                    </aside>
                </>
            )}
        </>
    );
}
