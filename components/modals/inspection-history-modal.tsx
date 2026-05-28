'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, Wrench } from 'lucide-react';
import { InspectionTypeLabel } from '@/types';

interface Props {
    open: boolean;
    onClose: () => void;
    inspections: any[];
    onEditInspection: (inspection: any) => void;
}

export function InspectionHistoryModal({ open, onClose, inspections, onEditInspection }: Props) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>点検 履歴一覧</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 py-2">
                    {inspections.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-12">点検情報の記録はありません</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {inspections.map((insp: any) => (
                                <div key={insp.id} className="py-3 flex flex-col gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors px-2 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">
                                                {InspectionTypeLabel[insp.inspectionType as keyof typeof InspectionTypeLabel] || '不明な点検'}
                                            </span>
                                            {insp.inspectionCost && (
                                                <span className="text-xs text-muted-foreground">
                                                    ¥{Number(insp.inspectionCost).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-brand-500 hover:text-brand-600 h-8 px-2.5"
                                            onClick={() => {
                                                onEditInspection(insp);
                                            }}
                                        >
                                            編集
                                        </Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div className="flex items-center gap-1.5 font-mono">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            <span>
                                                期間: {insp.inspectionStartDate ? new Date(insp.inspectionStartDate).toLocaleDateString('ja-JP') : '—'} 
                                                {insp.inspectionEndDate ? ` 〜 ${new Date(insp.inspectionEndDate).toLocaleDateString('ja-JP')}` : ''}
                                            </span>
                                        </div>
                                        {(insp.nextInspectionMileage || insp.nextInspectionDate) && (
                                            <div className="text-brand-600 dark:text-brand-400 font-mono">
                                                次回目安: {insp.nextInspectionMileage ? `${Number(insp.nextInspectionMileage).toLocaleString()} km` : ''}
                                                {insp.nextInspectionMileage && insp.nextInspectionDate ? ' / ' : ''}
                                                {insp.nextInspectionDate ? new Date(insp.nextInspectionDate).toLocaleDateString('ja-JP') : ''}
                                            </div>
                                        )}
                                        {insp.notes && (
                                            <div className="text-slate-500 italic bg-muted/50 p-1.5 rounded text-[11px] mt-1">
                                                備考: {insp.notes}
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
