'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BranchManagement({ initialBranches }: { initialBranches: any[] }) {
    const queryClient = useQueryClient();

    // RSCで取得した初期データを react-query の initialData に突っ込むことで
    // 最初のマウント時のローディング時間をゼロにします。
    const { data: branches = initialBranches } = useQuery<any[]>({
        queryKey: ['branches'],
        queryFn: async () => fetch('/api/branches').then(res => res.json()).then(data => Array.isArray(data) ? data : []),
        initialData: initialBranches
    });

    const branchCreate = useMutation({ mutationFn: async (data: { name: string, address: string }) => fetch('/api/branches', { method: 'POST', body: JSON.stringify(data) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }) });
    const branchUpdate = useMutation({ mutationFn: async (data: { id: string, name: string, address: string }) => fetch(`/api/branches/${data.id}`, { method: 'PUT', body: JSON.stringify({ name: data.name, address: data.address }) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }) });
    const branchDelete = useMutation({ mutationFn: async (id: string) => fetch(`/api/branches/${id}`, { method: 'DELETE' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }) });

    const [newBranchName, setNewBranchName] = useState('');
    const [newBranchAddress, setNewBranchAddress] = useState('');
    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
    const [editingBranchName, setEditingBranchName] = useState('');
    const [editingBranchAddress, setEditingBranchAddress] = useState('');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-brand-500" /> 支社・拠点管理
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input placeholder="支社・拠点名" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} className="w-1/3" />
                    <Input placeholder="住所" value={newBranchAddress} onChange={(e) => setNewBranchAddress(e.target.value)} className="flex-1" />
                    <Button className="bg-brand-500 hover:bg-brand-600 text-white shrink-0" disabled={!newBranchName || branchCreate.isPending} onClick={() => { branchCreate.mutate({ name: newBranchName, address: newBranchAddress }); setNewBranchName(''); setNewBranchAddress(''); }}>
                        <Plus className="w-4 h-4 mr-1.5" /> 追加
                    </Button>
                </div>

                <div className="border border-border rounded-xl divide-y divide-border">
                    {branches.map((b: any) => (
                        <div key={b.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                            {editingBranchId === b.id ? (
                                <div className="flex items-center gap-2 flex-1 mr-4">
                                    <Input autoFocus placeholder="支社名" value={editingBranchName} onChange={(e) => setEditingBranchName(e.target.value)} className="w-1/3" />
                                    <Input placeholder="住所" value={editingBranchAddress} onChange={(e) => setEditingBranchAddress(e.target.value)} className="flex-1" />
                                    <Button size="sm" variant="outline" onClick={() => setEditingBranchId(null)}>キャンセル</Button>
                                    <Button size="sm" className="bg-brand-500 text-white" disabled={!editingBranchName} onClick={() => { branchUpdate.mutate({ id: b.id, name: editingBranchName, address: editingBranchAddress }); setEditingBranchId(null); }}>保存</Button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{b.name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{b.address || '住所未登録'}</div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-4">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-brand-600" onClick={() => { setEditingBranchId(b.id); setEditingBranchName(b.name); setEditingBranchAddress(b.address || ''); }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600" onClick={() => { if (confirm(`${b.name}を削除してよろしいですか？`)) branchDelete.mutate(b.id); }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {branches.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">支社が登録されていません</p>}
                </div>
            </CardContent>
        </Card>
    );
}
