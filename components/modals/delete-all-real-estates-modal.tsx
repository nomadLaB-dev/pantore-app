'use client';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteAllRealEstates } from '@/lib/actions/real-estate.actions';

interface Props {
    open: boolean;
    onClose: () => void;
    estateCount: number;
    onDeleted?: () => void;
}

export function DeleteAllRealEstatesModal({ open, onClose, estateCount, onDeleted }: Props) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteAllRealEstates();
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
                        <AlertTriangle className="w-5 h-5" /> 不動産データの削除
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    登録されている不動産データ {estateCount} 件をすべて削除します。この操作は取り消せません。本当に削除しますか？
                </p>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose} disabled={deleting}>キャンセル</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting || estateCount === 0}>
                        {deleting ? '削除中…' : 'すべて削除する'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
