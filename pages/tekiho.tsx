'use client';
import type { ReactElement } from 'react';
import PrivateLayout from '@/components/private-layout';
import { useState } from 'react';
import { Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'payment_notice' | 'invoice';

const TABS: { id: TabId; label: string }[] = [
    { id: 'payment_notice', label: '支払い通知' },
    { id: 'invoice', label: '請求' },
];

export default function TekihoPage() {
    const [activeTab, setActiveTab] = useState<TabId>('payment_notice');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Scale className="w-6 h-6 text-muted-foreground" />
                    取適法
                </h1>
                <p className="text-muted-foreground text-sm mt-1">支払い通知・請求の管理</p>
            </div>

            {/* タブ */}
            <div className="border-b border-border">
                <div className="flex items-center gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                                activeTab === tab.id
                                    ? 'border-brand-500 text-brand-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* コンテンツ */}
            {activeTab === 'payment_notice' && (
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    <div className="text-center">
                        <Scale className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">支払い通知</p>
                        <p className="text-sm mt-1">準備中</p>
                    </div>
                </div>
            )}

            {activeTab === 'invoice' && (
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    <div className="text-center">
                        <Scale className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">請求</p>
                        <p className="text-sm mt-1">準備中</p>
                    </div>
                </div>
            )}
        </div>
    );
}

TekihoPage.getLayout = function getLayout(page: ReactElement) {
    return <PrivateLayout>{page}</PrivateLayout>;
};
