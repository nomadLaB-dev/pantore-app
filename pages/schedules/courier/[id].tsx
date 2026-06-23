'use client';
import type { ReactElement } from 'react';
import PrivateLayout from '@/components/private-layout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/lib/supabase/client';
import { Truck, MapPin, Calendar } from 'lucide-react';

type CourierInfo = {
    id: string;
    name: string;
    area: string | null;
};

type ScheduleItem = {
    id: string;
    collectDate: string;
    area: string;
    collectTime: string;
    facilityName: string;
    deliveryType: string;
    visitPlace: string;
    boxCount: string;
    note: string;
};

function normalizeDate(raw: string): string {
    const m = raw.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    return m ? `${m[1]}/${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}` : raw;
}

function normalizeTime(raw: string): string {
    if (!raw) return '';
    const s = raw.replace(/[０-９：]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
    const matches = [...s.matchAll(/\b(\d{1,2}):?(\d{2})\b/g)];
    if (matches.length === 1) {
        const t = `${matches[0][1].padStart(2, '0')}:${matches[0][2]}`;
        return `${t} - ${t}`;
    }
    if (matches.length >= 2) {
        return `${matches[0][1].padStart(2, '0')}:${matches[0][2]} - ${matches[1][1].padStart(2, '0')}:${matches[1][2]}`;
    }
    return raw;
}

const COLS = [
    { key: 'collectDate',  label: '集配日' },
    { key: 'area',         label: 'エリア' },
    { key: 'collectTime',  label: '集配時間' },
    { key: 'facilityName', label: '施設名' },
    { key: 'deliveryType', label: '配送種別' },
    { key: 'visitPlace',   label: '訪問場所' },
    { key: 'boxCount',     label: '箱数' },
    { key: 'note',         label: '備考' },
] as const;

export default function CourierSchedulePage() {
    const router = useRouter();
    const { id } = router.query;
    const supabase = createClient();
    const [courier, setCourier] = useState<CourierInfo | null>(null);
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!id || typeof id !== 'string') return;

        const load = async () => {
            const { data: courierData } = await supabase
                .from('settings_couriers')
                .select('id, name, area')
                .eq('id', id)
                .maybeSingle();

            if (!courierData) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setCourier(courierData);

            const { data: rows } = await supabase
                .from('schedules')
                .select('id, collect_date, area, collect_time, facility_name, delivery_type, visit_place, box_count, note')
                .eq('courier_name', courierData.name)
                .eq('is_archived', false)
                .order('collect_date', { ascending: true });

            setSchedules(
                (rows ?? []).map(d => ({
                    id: d.id,
                    collectDate: normalizeDate(d.collect_date || ''),
                    area: d.area || '',
                    collectTime: normalizeTime(d.collect_time || ''),
                    facilityName: d.facility_name || '',
                    deliveryType: d.delivery_type || '',
                    visitPlace: d.visit_place || '',
                    boxCount: d.box_count?.toString() || '',
                    note: d.note || '',
                })),
            );
            setLoading(false);
        };

        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <Truck className="w-10 h-10 opacity-30" />
                <p className="text-sm">配送業者が見つかりませんでした。</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Truck className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">{courier?.name}</h1>
                    {courier?.area && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {courier.area}
                        </p>
                    )}
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium text-muted-foreground">配送スケジュール</h2>
                    <span className="ml-auto text-xs text-muted-foreground">{schedules.length}件</span>
                </div>

                {schedules.length === 0 ? (
                    <div className="border border-border rounded-xl flex items-center justify-center py-16 text-sm text-muted-foreground">
                        スケジュールがありません
                    </div>
                ) : (
                    <div className="border border-border rounded-xl overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    {COLS.map(c => (
                                        <th key={c.key} className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                            {c.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {schedules.map(row => (
                                    <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                                        {COLS.map(c => (
                                            <td key={c.key} className="px-3 py-2.5 text-sm whitespace-nowrap">
                                                {row[c.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

CourierSchedulePage.getLayout = function getLayout(page: ReactElement) {
    return <PrivateLayout>{page}</PrivateLayout>;
};
