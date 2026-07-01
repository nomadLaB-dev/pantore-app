'use client';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteAllVehicles } from '@/lib/actions/vehicle.actions';

interface Props {
    open: boolean;
    onClose: () => void;
    vehicleCount: number;
    onDeleted?: () => void;
}

export function DeleteAllVehiclesModal({ open, onClose, vehicleCount, onDeleted }: Props) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteAllVehicles();
            onDeleted?.();
            onClose();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && !deleting && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" /> 車両データの削除
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    登録されている車両データ {vehicleCount} 件をすべて削除します。この操作は取り消せません。本当に削除しますか？
                </p>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose} disabled={deleting}>キャンセル</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting || vehicleCount === 0}>
                        {deleting ? '削除中…' : 'すべて削除する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
