'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    mileages: any[];
    onEditMileage: (mileage: any) => void;
}

export function MileageHistoryModal({ open, onClose, mileages, onEditMileage }: Props) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>走行距離 履歴一覧</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 py-2">
                    {mileages.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-12">走行距離の記録はありません</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {mileages.map((m: any) => (
                                <div key={m.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors px-2 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                                            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                                            {new Date(m.recordDate).toLocaleDateString('ja-JP')}
                                        </div>
                                        <div className="font-semibold text-sm">
                                            {m.mileage ? Number(m.mileage).toLocaleString() : '0'} km
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-brand-500 hover:text-brand-600 h-8 px-2.5"
                                        onClick={() => {
                                            onEditMileage(m);
                                        }}
                                    >
                                        編集
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        閉じる
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
