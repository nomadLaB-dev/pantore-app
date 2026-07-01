'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Database, CalendarDays, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

const TABS = [
    { name: 'データ入力', href: '/data-entry', icon: Database },
    { name: '集配送予定', href: '/schedules', icon: CalendarDays },
    { name: '集配送実績', href: '/schedules/archive', icon: Archive },
];

export default function ScheduleTabs() {
    const { pathname } = useRouter();
    const specimenRole = useAppStore((s) => s.specimenRole);
    const tabs = specimenRole === 'driver'
        ? TABS.filter((t) => t.href === '/schedules')
        : specimenRole === 'base'
            ? TABS.filter((t) => t.href !== '/data-entry')
            : TABS;

    return (
        <div className="flex items-center gap-1 border-b border-slate-200">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap',
                            isActive
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
                        )}
                    >
                        <tab.icon size={15} />
                        {tab.name}
                    </Link>
                );
            })}
        </div>
    );
}
