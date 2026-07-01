'use client';
import { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmploymentCategoryLabel, type SpecimenRole } from '@/types';

interface Props { open: boolean; onClose: () => void; employee?: any; showLeaveDate?: boolean; initialBranchId?: string; initialSpecimenRole?: SpecimenRole; roleOptions?: SpecimenRole[]; }

const ROLE_LABEL: Record<SpecimenRole, string> = {
    admin: '管理者',
    staff: 'スタッフ',
    base: '拠点長',
    driver: 'ドライバー',
};

const empty = { name: '', name_kana: '', birthDate: '', companyId: '', branchId: '', lineId: '', email: '', tel: '', address: '', emergencyContact: '', hireDate: '', leaveDate: '', category: 'full_time', hourlyRate: '1085', certificationNum: '', invoiceNum: '', weeklyHoursMin: '', weeklyHoursMax: '', proficiencyRate: '', specimenRole: '', userCode: '', initialPassword: '' };

export function NewEmployeeModal({ open, onClose, employee, showLeaveDate, initialBranchId, initialSpecimenRole, roleOptions }: Props) {
    const qc = useQueryClient();
    const isEdit = !!employee;
    const [form, setForm] = useState(empty);

    // テナント一覧（全会社）を取得
    const { data: dbCompanies = [] } = useQuery<any[]>({
        queryKey: ['tenants', 'all'],
        queryFn: async () => {
            const res = await fetch('/api/tenants?all=true');
            if (!res.ok) throw new Error('Failed to fetch tenants');
            return res.json();
        },
        enabled: open,
    });

    // 支社一覧を取得
    const { data: dbBranches = [] } = useQuery<any[]>({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await fetch('/api/branches');
            if (!res.ok) throw new Error('Failed to fetch branches');
            return res.json();
        },
        enabled: open,
    });

    // 会社が変更されたら、選択済みの支社をリセット（ただし編集初期表示時・初期値プリセット時を除く）
    useEffect(() => {
        if (!employee || form.companyId !== employee.companyId) {
            setForm((f) => (f.branchId && f.branchId === initialBranchId ? f : { ...f, branchId: '' }));
        }
    }, [form.companyId, employee, initialBranchId]);

    // 新規作成時、初期指定された拠点からその所属会社を逆引きしてセットする（拠点・支社ページからの「配送員を追加」用）
    useEffect(() => {
        if (!open || employee || !initialBranchId || form.companyId) return;
        const branch = dbBranches.find((b: any) => b.id === initialBranchId);
        if (branch) setForm((f) => ({ ...f, companyId: branch.tenant_id }));
    }, [open, employee, initialBranchId, dbBranches, form.companyId]);

    useEffect(() => {
        if (open) {
            if (employee) {
                setForm({
                    name: employee.name || '',
                    name_kana: employee.name_kana || '',
                    birthDate: employee.birthDate ? new Date(employee.birthDate).toISOString().slice(0, 10) : '',
                    companyId: employee.companyId || '',
                    branchId: employee.branchId || '',
                    lineId: employee.lineId || '',
                    email: employee.email || '',
                    tel: employee.tel || '',
                    address: employee.address || '',
                    emergencyContact: employee.emergencyContact || '',
                    hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().slice(0, 10) : '',
                    leaveDate: employee.leaveDate ? new Date(employee.leaveDate).toISOString().slice(0, 10) : '',
                    category: employee.currentEmploymentCategory || 'full_time',
                    hourlyRate: employee.currentSalary ? String(employee.currentSalary) : '1085',
                    certificationNum: employee.certificationNum || '',
                    invoiceNum: employee.invoiceNum || '',
                    weeklyHoursMin: employee.weeklyHoursMin ? String(employee.weeklyHoursMin) : '',
                    weeklyHoursMax: employee.weeklyHoursMax ? String(employee.weeklyHoursMax) : '',
                    proficiencyRate: employee.proficiencyRate !== undefined && employee.proficiencyRate !== null ? Number(employee.proficiencyRate).toFixed(1) : '',
                    specimenRole: employee.specimenRole || '',
                    userCode: employee.userCode || '',
                    initialPassword: '',
                });
            } else {
                setForm({ ...empty, branchId: initialBranchId || '', specimenRole: initialSpecimenRole || '' });
            }
        }
    }, [open, employee, initialBranchId, initialSpecimenRole]);

    // 選択された会社に属する支社をフィルタリング
    const filteredBranches = dbBranches.filter(
        (b: any) => b.tenant_id === form.companyId
    );

    const mutation = useMutation({
        mutationFn: async () => {
            const url = isEdit ? `/api/users/${employee.id}` : '/api/users';
            const method = isEdit ? 'PUT' : 'POST';
            const { initialPassword, ...formForSave } = form;
            const body = isEdit ? { ...formForSave } : { ...formForSave, leaveDate: null, accountStatus: 'none' };
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                throw new Error('社員情報の保存に失敗しました。');
            }

            // 新規登録時のみ、全5資格の初期ステータス（none）レコードを自動登録する
            if (!isEdit) {
                const newEmployee = await res.json();
                if (newEmployee && newEmployee.id) {
                    if (initialPassword) {
                        const pwRes = await fetch(`/api/users/${newEmployee.id}/password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password: initialPassword }),
                        });
                        if (!pwRes.ok) console.error('Failed to set initial password');
                    }
                    const qualifications = ['ipd', 'inter', 'fedex', 'q_dome', 'mediford'];
                    const promises = qualifications.map(async (q) => {
                        const qRes = await fetch(`/api/users/${newEmployee.id}/qualifications`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                qualification: q,
                                qualificationStatus: 'none',
                                acquiredDate: null,
                                lastWorkDate: null,
                                isActive: true,
                                trainingDate: null,
                                ojt1stDate: null,
                                ojt2ndDate: null,
                                ojt3rdDate: null,
                                assessmentDate: null,
                            }),
                        });
                        if (!qRes.ok) {
                            console.error(`Failed to register initial qualification: ${q}`);
                        }
                    });
                    await Promise.all(promises);
                }
            }
        },
        onSuccess: () => {
            if (isEdit) qc.invalidateQueries({ queryKey: ['employee', employee.id] });
            qc.invalidateQueries({ queryKey: ['users'] });
            onClose();
            setForm(empty);
        },
    });

    const set = (key: string) => (v: string | null) => setForm((f) => ({ ...f, [key]: v ?? '' }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '社員情報を編集' : '社員を新規追加'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">氏名 <span className="text-red-500">*</span></label>
                        <Input placeholder="山田 太郎" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">氏名（カナ） <span className="text-red-500">*</span></label>
                        <Input placeholder="ヤマダ タロウ" value={form.name_kana} onChange={(e) => setForm({ ...form, name_kana: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">生年月日 <span className="text-red-500">*</span></label>
                        <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">所属会社 <span className="text-red-500">*</span></label>
                            <Select value={form.companyId} onValueChange={set('companyId')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="会社を選択">
                                        {dbCompanies.find((c: any) => c.id === form.companyId)?.name || ''}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {dbCompanies.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">所属支社</label>
                            <Select
                                value={form.branchId}
                                onValueChange={set('branchId')}
                                disabled={!form.companyId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={form.companyId ? "支社を選択" : "先に会社を選択してください"}>
                                        {filteredBranches.find((b: any) => b.id === form.branchId)?.name || ''}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredBranches.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">メールアドレス <span className="text-red-500">*</span></label>
                        <Input type="email" placeholder="yamada@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">電話番号 <span className="text-red-500">*</span></label>
                        <Input type="tel" placeholder="090-1234-5678" value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">LINE ID</label>
                        <Input type="lineId" placeholder="" value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">住所 <span className="text-red-500">*</span></label>
                        <Input type="address" placeholder="" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">緊急連絡先 <span className="text-red-500">*</span></label>
                        <Input type="emergencyContact" placeholder="090-1234-5678" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">入社日 <span className="text-red-500">*</span></label>
                            <Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
                        </div>
                        {showLeaveDate && isEdit && (
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">退職日</label>
                                <Input type="date" value={form.leaveDate} onChange={(e) => setForm({ ...form, leaveDate: e.target.value })} />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">雇用区分 <span className="text-red-500">*</span></label>
                            <Select value={form.category} onValueChange={set('category')}>
                                <SelectTrigger><SelectValue placeholder="選択">{form.category ? EmploymentCategoryLabel[form.category as keyof typeof EmploymentCategoryLabel] : ''}</SelectValue></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(EmploymentCategoryLabel).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {(form.category === 'part_time' || form.category === 'dispatch') && (
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">時給 <span className="text-red-500">*</span></label>
                                <Input
                                    type="number"
                                    placeholder="1000"
                                    value={form.hourlyRate}
                                    onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">認定番号</label>
                        <Input type="certificationNum" placeholder="" value={form.certificationNum} onChange={(e) => setForm({ ...form, certificationNum: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">INVOICE番号</label>
                        <Input type="invoiceNum" placeholder="" value={form.invoiceNum} onChange={(e) => setForm({ ...form, invoiceNum: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium block">週稼働予定時間 <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <Input
                                    type="number"
                                    className="w-20"
                                    placeholder="20"
                                    value={form.weeklyHoursMin}
                                    onChange={(e) => setForm({ ...form, weeklyHoursMin: e.target.value })}
                                />
                                <span className="text-xs text-muted-foreground">時間</span>
                            </div>
                            <span className="text-muted-foreground">～</span>
                            <div className="flex items-center gap-1.5">
                                <Input
                                    type="number"
                                    className="w-20"
                                    placeholder="40"
                                    value={form.weeklyHoursMax}
                                    onChange={(e) => setForm({ ...form, weeklyHoursMax: e.target.value })}
                                />
                                <span className="text-xs text-muted-foreground">時間</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">習熟度</label>
                        <Select
                            value={form.proficiencyRate}
                            onValueChange={set('proficiencyRate')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="選択してください">
                                    {form.proficiencyRate === '1.0' ? '1.0' : form.proficiencyRate === '0.5' ? '0.5' : ''}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">選択してください</SelectItem>
                                <SelectItem value="1.0">1.0</SelectItem>
                                <SelectItem value="0.5">0.5</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">権限ロール</label>
                            <Select value={form.specimenRole} onValueChange={set('specimenRole')}>
                                <SelectTrigger><SelectValue placeholder="なし（ERP専用）">{form.specimenRole ? ROLE_LABEL[form.specimenRole as SpecimenRole] : 'なし（ERP専用）'}</SelectValue></SelectTrigger>
                                <SelectContent>
                                    {!roleOptions && <SelectItem value="">なし（ERP専用）</SelectItem>}
                                    {(roleOptions ?? (Object.keys(ROLE_LABEL) as SpecimenRole[])).map((r) => (
                                        <SelectItem key={r} value={r}>{ROLE_LABEL[r]} ({r})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">ユーザーコード (例: A0001)</label>
                            <Input placeholder="A0001" value={form.userCode} onChange={(e) => setForm({ ...form, userCode: e.target.value })} />
                        </div>
                    </div>
                    {!isEdit && (
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                初期パスワード
                                {roleOptions ? (
                                    <span className="text-red-500 ml-1">*必須</span>
                                ) : (
                                    <span className="text-muted-foreground font-normal ml-1">（任意）</span>
                                )}
                            </label>
                            <Input
                                type="password"
                                placeholder={roleOptions ? 'ログインに必要です（8文字以上）' : '設定するとAuthアカウントを同時作成します（8文字以上）'}
                                value={form.initialPassword}
                                onChange={(e) => setForm({ ...form, initialPassword: e.target.value })}
                                className={roleOptions && form.initialPassword.length > 0 && form.initialPassword.length < 8 ? 'border-red-400' : ''}
                            />
                            {roleOptions && form.initialPassword.length > 0 && form.initialPassword.length < 8 && (
                                <p className="text-xs text-red-500 mt-1">8文字以上で入力してください</p>
                            )}
                            {roleOptions && form.initialPassword.length === 0 && (
                                <p className="text-xs text-muted-foreground mt-1">配送員はログインのためパスワードの設定が必要です</p>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>キャンセル</Button>
                    <Button
                        className="bg-brand-500 hover:bg-brand-600 text-white"
                        disabled={
                            !form.name || !form.name_kana || !form.birthDate || !form.companyId || !form.email ||
                            !form.address || !form.emergencyContact || !form.category ||
                            ((form.category === 'part_time' || form.category === 'dispatch') ? !form.hourlyRate : false) ||
                            !form.weeklyHoursMax || !form.weeklyHoursMin || !form.hireDate ||
                            (!isEdit && !!roleOptions && form.initialPassword.length < 8) ||
                            mutation.isPending
                        }
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? '保存中…' : (isEdit ? '保存する' : '追加する')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
