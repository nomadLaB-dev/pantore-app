'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    accidents: any[];
    onEditAccident: (accident: any) => void;
}

// 重要度の日本語ラベルとCSSクラスのマッピング
const severityMap = {
    low: { label: '軽微', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
    medium: { label: '中程度', class: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300' },
    high: { label: '重大', class: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
};

export function AccidentHistoryModal({ open, onClose, accidents, onEditAccident }: Props) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>事故 履歴一覧</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 py-2">
                    {accidents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-12">事故情報の記録はありません</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {accidents.map((acc: any) => (
                                <div key={acc.id} className="py-3 flex flex-col gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors px-2 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${severityMap[acc.severity as keyof typeof severityMap]?.class || ''}`}>
                                                {severityMap[acc.severity as keyof typeof severityMap]?.label || '不明'}
                                            </span>
                                            {acc.repairCost && (
                                                <span className="text-xs text-muted-foreground">
                                                    修理費用: ¥{Number(acc.repairCost).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-brand-500 hover:text-brand-600 h-8 px-2.5"
                                            onClick={() => {
                                                onEditAccident(acc);
                                            }}
                                        >
                                            編集
                                        </Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div className="flex items-center gap-1.5 font-mono">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            <span>
                                                事故日: {acc.accidentDate ? new Date(acc.accidentDate).toLocaleDateString('ja-JP') : '—'}
                                            </span>
                                        </div>
                                        {(acc.isBodilyInjury || acc.isPropertyDamage) && (
                                            <div className="flex gap-2 mt-1">
                                                {acc.isBodilyInjury && (
                                                    <span className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0.5 rounded">
                                                        対人
                                                    </span>
                                                )}
                                                {acc.isPropertyDamage && (
                                                    <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] px-1.5 py-0.5 rounded">
                                                        対物
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {acc.description && (
                                            <div className="text-slate-700 dark:text-slate-300 font-medium text-sm mt-1">
                                                {acc.description}
                                            </div>
                                        )}
                                    </div>
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
