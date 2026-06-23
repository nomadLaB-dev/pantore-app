'use client';
import type { ReactElement } from 'react'
import PrivateLayout from '@/components/private-layout'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Undo2, Redo2, ExternalLink, Keyboard, Archive, Mail, Eraser } from 'lucide-react';
import { buildScheduleList } from '@/lib/formatSchedule';
import type { ScheduleRow } from '@/lib/formatSchedule';
import { createClient } from '@/lib/supabase/client';

const COLUMNS_DEFAULT = [
    '集荷予定\n日時', 'ステータス', '手配状況\n送信時間', '依頼', '至急', '集材種別',
    '県名', '施設名', '集配業者\n搬入拠点', 'コード\n集材員名', 'リファレンス', 'SEQ', 'REV', 'チェック',
];
const COLUMNS_IPD = [
    'ID', '配送種別', '確認状況', 'ステータス', 'FedEx伝票番号', 'Box総数', '集荷日時', '集荷',
    '集荷先', '集荷エリア', '配達先', '配達エリア', '配達日時', '車載', '荷降', '配達',
    '引き取り伝票番号', '治験名', '依頼日',
];
const COLUMNS_MAIL = [
    'お問い合わせ番号', '登録区分', '集荷先施設担当者', '集荷先電話番号',
    '施設名', '治験名', '希望集荷日', '希望集荷時間', '訪問場所', '備考',
];

const TABS = [
    { id: 'manual', name: 'マニュアル' },
    { id: 'm', name: 'MDF' },
    { id: 'q', name: 'Q-dome' },
    { id: 'ip', name: 'IPD' },
    { id: 'i', name: 'Inter(メール)' },
    { id: 'f', name: 'Fedex(メール)' },
];

const INITIAL_ROWS = 100;

const getInitialCols = (tabId: string) => {
    if (tabId === 'ip') return COLUMNS_IPD.length;
    if (tabId === 'i' || tabId === 'f') return COLUMNS_MAIL.length;
    return COLUMNS_DEFAULT.length;
};

const CHECKBOX_COLUMNS: Record<string, number[]> = { m: [13], q: [13], ip: [7, 13, 14, 15] };
const isCheckboxCell = (tabId: string, cIdx: number) => (CHECKBOX_COLUMNS[tabId] ?? []).includes(cIdx);

const createEmptyData = (colCount: number) =>
    Array(INITIAL_ROWS).fill(null).map(() => Array(colCount).fill(''));

export default function DataEntry() {
    const supabase = createClient();

    const [activeTab, setActiveTab] = useState('manual');
    const [tabData, setTabData] = useState<Record<string, string[][]>>(() => {
        const initial: Record<string, string[][]> = {};
        for (const tab of TABS) initial[tab.id] = createEmptyData(getInitialCols(tab.id));
        return initial;
    });

    const [selectionStart, setSelectionStart] = useState<[number, number] | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<[number, number] | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const isSelectingRef = useRef(false);
    const [editingCell, setEditingCell] = useState<[number, number] | null>(null);
    const editingValueRef = useRef('');
    const [editingValueTarget, setEditingValueTarget] = useState('');
    const tableRef = useRef<HTMLDivElement>(null);
    const lastEnterData = useRef<{ time: number; r: number; c: number } | null>(null);
    const [history, setHistory] = useState<Record<string, string[][]>[]>([]);
    const historyIdx = useRef(-1);
    const tabDataRef = useRef(tabData);
    const activeTabRef = useRef(activeTab);
    const selectionStartRef = useRef(selectionStart);
    const editingCellRef = useRef<[number, number] | null>(null);
    const isFetchingGmailRef = useRef(false);
    const [isFetchingGmail, setIsFetchingGmail] = useState(false);
    const tenantIdRef = useRef<string | null>(null);

    useEffect(() => {
        tabDataRef.current = tabData;
        activeTabRef.current = activeTab;
        selectionStartRef.current = selectionStart;
        editingCellRef.current = editingCell;
    }, [tabData, activeTab, selectionStart, editingCell]);

    const updateHistory = (newTabData: Record<string, string[][]>) => {
        setTabData(newTabData);
        setHistory(prev => {
            const h = prev.slice(0, historyIdx.current + 1);
            h.push(newTabData);
            if (h.length > 50) h.shift();
            historyIdx.current = h.length - 1;
            return h;
        });
    };

    const undo = () => {
        if (historyIdx.current > 0) { historyIdx.current -= 1; setTabData(history[historyIdx.current]); }
    };
    const redo = () => {
        if (historyIdx.current < history.length - 1) { historyIdx.current += 1; setTabData(history[historyIdx.current]); }
    };

    const currentColumns = activeTab === 'ip' ? COLUMNS_IPD : (activeTab === 'i' || activeTab === 'f' ? COLUMNS_MAIL : COLUMNS_DEFAULT);
    const data = tabData[activeTab] || createEmptyData(currentColumns.length);

    const parseDbDate = (s: string | null | undefined): string | null => {
        if (!s) return null;
        const m = s.match(/(\d{4})[/\-](\d{2})[/\-](\d{2})/)
        return m ? `${m[1]}-${m[2]}-${m[3]}` : null
    }

    const saveSchedulesToDb = async (td: Record<string, string[][]>, clearAfter: boolean) => {
        const incoming = buildScheduleList(td);
        if (incoming.length === 0) return;

        const { data: existingData } = await supabase.from('schedules').select('id, uid');
        const existingRows = existingData || [];
        const toUpdate: any[] = [];
        const toInsert: any[] = [];

        for (const row of incoming) {
            const match = existingRows.find((e: any) => (row.uid && e.uid === row.uid) || (row.id && e.id === row.id));
            const dbRow = {
                tenant_id: tenantIdRef.current,
                collect_date: parseDbDate(row.collectDate), area: row.area || '', system_type: row.systemType || '',
                collect_time: row.collectTime || '', uid: row.uid || '', facility_name: row.facilityName || '',
                delivery_type: row.deliveryType || '', base: row.base || '', facility_code: row.facilityCode || '',
                visit_place: row.visitPlace || '', trial_name: row.trialName || '', request_date: parseDbDate(row.requestDate),
                request_time: row.requestTime || null, service: row.service || '', con_no: row.conNo || '',
                box_count: row.boxCount ? Number(row.boxCount) : null, request: row.request || '', courier_code: row.courierCode || '',
                courier_name: row.courierName || '', reference: row.reference || '', rev: row.rev || '', note: row.note || '',
                pickup_done: row.pickupDone === 'true', vehicle_loaded: row.vehicleLoaded === 'true',
                unloaded: row.unloaded === 'true', delivered: row.delivered === 'true',
            };
            if (match) { toUpdate.push({ id: (match as any).id, ...dbRow }); }
            else { toInsert.push(dbRow); }
        }

        const ok = confirm(`集配送予定へ追加: ${toInsert.length}件 / 更新: ${toUpdate.length}件\n合計: ${toUpdate.length + toInsert.length}件\n\nデータ入力画面の入力内容をクリアしますか？`);
        if (!ok) return;

        let hasError = false;
        if (toInsert.length > 0) {
            const { error } = await supabase.from('schedules').insert(toInsert);
            if (error) { alert(`データの保存に失敗しました。\n${error.message}`); hasError = true; }
        }
        if (!hasError && toUpdate.length > 0) {
            const { error } = await supabase.from('schedules').upsert(toUpdate, { onConflict: 'id' });
            if (error) { alert(`データの更新に失敗しました。\n${error.message}`); hasError = true; }
        }

        if (!hasError && clearAfter) {
            const cleared: Record<string, string[][]> = {};
            for (const tab of TABS) cleared[tab.id] = createEmptyData(getInitialCols(tab.id));
            setTabData(cleared);
            setHistory([cleared]);
            historyIdx.current = 0;
            await supabase.from('data_entry_drafts').upsert({ id: 'global', tenant_id: tenantIdRef.current, state_json: cleared, updated_at: new Date().toISOString() });
        }
    };

    const handleDraftSave = async () => {
        if (document.activeElement?.tagName === 'TEXTAREA') (document.activeElement as HTMLElement).blur();
        await supabase.from('data_entry_drafts').upsert({ id: 'global', tenant_id: tenantIdRef.current, state_json: tabDataRef.current, updated_at: new Date().toISOString() });
        alert('一時保存しました。');
    };

    const handleSave = async () => {
        await supabase.from('data_entry_drafts').upsert({ id: 'global', tenant_id: tenantIdRef.current, state_json: tabData, updated_at: new Date().toISOString() });
        await saveSchedulesToDb(tabData, true);
    };

    const fetchGmail = async (isManual = false) => {
        if (isFetchingGmailRef.current) return;
        isFetchingGmailRef.current = true;
        setIsFetchingGmail(true);
        try {
            const res = await fetch('/api/gmail/fetch');
            if (!res.ok) throw new Error('Failed to fetch Gmail');
            const json = await res.json();
            if (json.success && json.data?.length > 0) {
                setTabData(prev => {
                    const iTab = [...prev['i']];
                    let changed = false;
                    for (const incomingRow of json.data) {
                        const inquiryNo = incomingRow[0];
                        if (!inquiryNo) continue;
                        const existingIdx = iTab.findIndex((row: string[]) => row[0] === inquiryNo);
                        if (existingIdx !== -1) { iTab[existingIdx] = incomingRow; changed = true; }
                        else {
                            const emptyIdx = iTab.findIndex((row: string[]) => row.every((cell: string) => !cell || cell.trim() === ''));
                            if (emptyIdx !== -1) iTab[emptyIdx] = incomingRow; else iTab.push(incomingRow);
                            changed = true;
                        }
                    }
                    if (changed) return { ...prev, i: iTab };
                    return prev;
                });
                if (isManual) alert(`新着メールを ${json.data.length} 件取得しました！`);
            } else if (isManual) {
                alert('取得できる新着メールはありませんでした。');
            }
        } catch (e) {
            if (isManual) alert('メールの取得に失敗しました。');
        } finally {
            isFetchingGmailRef.current = false;
            setIsFetchingGmail(false);
        }
    };

    useEffect(() => {
        const initData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: emp } = await supabase.from('users').select('tenant_id').eq('user_id', user.id).single();
                    if (emp?.tenant_id) tenantIdRef.current = emp.tenant_id;
                }
                const { data: draftData } = await supabase.from('data_entry_drafts').select('state_json').eq('id', 'global').single();
                if (draftData?.state_json) {
                    const loaded = draftData.state_json as Record<string, string[][]>;
                    for (const tab of TABS) {
                        const cols = getInitialCols(tab.id);
                        if (!loaded[tab.id]) { loaded[tab.id] = createEmptyData(cols); continue; }
                        loaded[tab.id] = loaded[tab.id].map(row =>
                            row.length === cols ? row : Array.from({ length: cols }, (_, i) => row[i] ?? '')
                        );
                        if (loaded[tab.id].length < INITIAL_ROWS) {
                            const extra = createEmptyData(cols).slice(loaded[tab.id].length);
                            loaded[tab.id] = [...loaded[tab.id], ...extra];
                        }
                    }
                    setTabData(loaded);
                    setHistory([loaded]);
                    historyIdx.current = 0;
                }
            } catch { /* no draft */ }
        };
        initData();
        fetchGmail();
        const gmailInterval = setInterval(fetchGmail, 3600000);

        let scrollInterval: ReturnType<typeof setInterval> | null = null;
        const handleMouseMove = (e: MouseEvent) => {
            if (!isSelectingRef.current || !tableRef.current) {
                if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; } return;
            }
            const { top, bottom } = tableRef.current.getBoundingClientRect();
            const threshold = 50; const scrollSpeed = 20;
            if (e.clientY > bottom - threshold) {
                if (!scrollInterval) scrollInterval = setInterval(() => tableRef.current?.scrollBy(0, scrollSpeed), 16);
            } else if (e.clientY < top + threshold) {
                if (!scrollInterval) scrollInterval = setInterval(() => tableRef.current?.scrollBy(0, -scrollSpeed), 16);
            } else { if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; } }
        };
        const handleMouseUp = () => { setIsSelecting(false); isSelectingRef.current = false; if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; } };
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            clearInterval(gmailInterval);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            if (scrollInterval) clearInterval(scrollInterval);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleGlobalSave = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (document.activeElement?.tagName === 'TEXTAREA') (document.activeElement as HTMLElement).blur();
                setTimeout(async () => {
                    const td = tabDataRef.current;
                    await supabase.from('data_entry_drafts').upsert({ id: 'global', tenant_id: tenantIdRef.current, state_json: td, updated_at: new Date().toISOString() });
                    await saveSchedulesToDb(td, true);
                }, 50);
            }
        };
        let isSpaceDown = false;
        const globalKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;
            if (e.key === ' ') isSpaceDown = true;
            if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && isSpaceDown) {
                e.preventDefault();
                setActiveTab(cur => {
                    const idx = TABS.findIndex(t => t.id === cur);
                    return TABS[(e.key === 'ArrowLeft' ? (idx - 1 + TABS.length) : (idx + 1)) % TABS.length].id;
                });
            }
            if (e.key === 'Escape') {
                if (editingCellRef.current) { if (document.activeElement?.tagName === 'TEXTAREA') (document.activeElement as HTMLElement).blur(); return; }
                setSelectionStart(cur => {
                    if (cur === null) {
                        if (activeTabRef.current !== 'manual') {
                            setSelectionEnd([0, 0]); setTimeout(() => { tableRef.current?.focus(); document.getElementById('row-0')?.scrollIntoView({ block: 'nearest' }); }, 0);
                            return [0, 0];
                        }
                        return null;
                    }
                    setSelectionEnd(null); return null;
                });
            }
        };
        const globalKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') isSpaceDown = false; };
        window.addEventListener('keydown', handleGlobalSave);
        window.addEventListener('keydown', globalKeyDown);
        window.addEventListener('keyup', globalKeyUp);
        return () => {
            window.removeEventListener('keydown', handleGlobalSave);
            window.removeEventListener('keydown', globalKeyDown);
            window.removeEventListener('keyup', globalKeyUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const scrollToRow = (r: number) => {
        setTimeout(() => {
            if (r === 0 && tableRef.current) tableRef.current.scrollTop = 0;
            else document.getElementById(`row-${r}`)?.scrollIntoView({ block: 'nearest' });
        }, 0);
    };

    const isSelected = (rIdx: number, cIdx: number) => {
        if (!selectionStart || !selectionEnd) return false;
        const minRow = Math.min(selectionStart[0], selectionEnd[0]); const maxRow = Math.max(selectionStart[0], selectionEnd[0]);
        const minCol = Math.min(selectionStart[1], selectionEnd[1]); const maxCol = Math.max(selectionStart[1], selectionEnd[1]);
        return rIdx >= minRow && rIdx <= maxRow && cIdx >= minCol && cIdx <= maxCol;
    };

    const moveSelection = (rowDelta: number, colDelta: number) => {
        if (!selectionStart) return;
        let r = Math.max(0, Math.min(INITIAL_ROWS - 1, selectionStart[0] + rowDelta));
        let c = Math.max(0, Math.min(currentColumns.length - 1, selectionStart[1] + colDelta));
        setSelectionStart([r, c]); setSelectionEnd([r, c]); scrollToRow(r);
        if (tableRef.current) tableRef.current.focus();
    };

    const startEditing = (r: number, c: number, initialValue: string = data[r][c]) => {
        if (isCheckboxCell(activeTab, c)) return;
        setEditingCell([r, c]); editingValueRef.current = initialValue; setEditingValueTarget(initialValue);
    };

    const commitEdit = (cancel = false) => {
        setEditingCell(prev => {
            if (prev && !cancel) {
                const [r, c] = prev;
                if (data[r] && data[r][c] !== editingValueRef.current) {
                    const newData = data.map(row => [...row]);
                    newData[r][c] = editingValueRef.current;
                    updateHistory({ ...tabData, [activeTab]: newData });
                }
            }
            return null;
        });
    };

    const handleMouseDown = (e: React.MouseEvent, rIdx: number, cIdx: number) => {
        if (e.button !== 0) return;
        if (editingCell && editingCell[0] === rIdx && editingCell[1] === cIdx) return;
        if (editingCell) commitEdit(false);
        setIsSelecting(true); isSelectingRef.current = true;
        if (e.shiftKey && selectionStart) { setSelectionEnd([rIdx, cIdx]); }
        else { setSelectionStart([rIdx, cIdx]); setSelectionEnd([rIdx, cIdx]); }
        if (tableRef.current) tableRef.current.focus();
    };

    const parseTSV = (text: string) => {
        const rows: string[][] = []; let currentRow: string[] = []; let currentCell = ''; let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i]; const nextChar = text[i + 1];
            if (inQuotes) {
                if (char === '"') { if (nextChar === '"') { currentCell += '"'; i++; } else inQuotes = false; }
                else currentCell += char;
            } else {
                if (char === '"') inQuotes = true;
                else if (char === '\t') { currentRow.push(currentCell); currentCell = ''; }
                else if (char === '\n' || char === '\r') {
                    if (char === '\r' && nextChar === '\n') i++;
                    currentRow.push(currentCell); rows.push(currentRow); currentRow = []; currentCell = '';
                } else currentCell += char;
            }
        }
        if (currentCell !== '' || currentRow.length > 0) { currentRow.push(currentCell); rows.push(currentRow); }
        return rows;
    };

    const parseWebSystemPaste = (text: string) => {
        const rawLines = text.split(/\r?\n/);
        if (rawLines[rawLines.length - 1] === '') rawLines.pop();
        const rows: string[][] = [];
        for (let i = 0; i < rawLines.length; i += 7) {
            if (i + 6 >= rawLines.length) break;
            const l1 = rawLines[i].split('\t'); const l2 = rawLines[i + 1].split('\t'); const l3 = rawLines[i + 2].split('\t');
            const l4 = rawLines[i + 3].split('\t'); const l5 = rawLines[i + 4].split('\t');
            let l6 = rawLines[i + 5].split('\t');
            if (l6.length === 1 && l6[0].trim().length > 0 && /^[A-Za-z0-9_-]+$/.test(l6[0].trim())) l6 = ['', l6[0]];
            const l7 = rawLines[i + 6].split('\t');
            rows.push([
                `${l1[l1.length - 1] || ''}\n${l2[0] || ''}`, l2[1] || '', `${l2[2] || ''}\n${l3[0] || ''}`,
                l3[1] || '', l3[2] || '', l3[3] || '', l3[4] || '',
                `${l3[5] || ''}\n${l4[0] || ''}`, `${l4[1] || ''}\n${l5[0] || ''}`,
                `${l5[1] || ''}\n${l6[0] || ''}`, l6[1] || '', l7[0] || '', l7[1] || '',
            ]);
        }
        return rows;
    };

    const getTSVFromSelection = () => {
        if (!selectionStart || !selectionEnd) return '';
        const minRow = Math.min(selectionStart[0], selectionEnd[0]); const maxRow = Math.max(selectionStart[0], selectionEnd[0]);
        const minCol = Math.min(selectionStart[1], selectionEnd[1]); const maxCol = Math.max(selectionStart[1], selectionEnd[1]);
        let tsv = '';
        for (let i = minRow; i <= maxRow; i++) {
            const rowData = [];
            for (let j = minCol; j <= maxCol; j++) {
                let cell = data[i][j] || '';
                if (cell.includes('\n') || cell.includes('"') || cell.includes('\t')) cell = '"' + cell.replace(/"/g, '""') + '"';
                rowData.push(cell);
            }
            tsv += rowData.join('\t') + (i < maxRow ? '\n' : '');
        }
        return tsv;
    };

    const handleCopy = (e: React.ClipboardEvent) => {
        if (editingCell) return;
        const tsv = getTSVFromSelection();
        if (tsv) { e.clipboardData.setData('text/plain', tsv); e.preventDefault(); }
    };

    const handleCut = (e: React.ClipboardEvent) => {
        if (editingCell) return;
        const tsv = getTSVFromSelection();
        if (tsv) {
            e.clipboardData.setData('text/plain', tsv); e.preventDefault();
            const minRow = Math.min(selectionStart![0], selectionEnd![0]); const maxRow = Math.max(selectionStart![0], selectionEnd![0]);
            const minCol = Math.min(selectionStart![1], selectionEnd![1]); const maxCol = Math.max(selectionStart![1], selectionEnd![1]);
            const newData = data.map(row => [...row]);
            for (let i = minRow; i <= maxRow; i++) for (let j = minCol; j <= maxCol; j++) { if (j < currentColumns.length && !isCheckboxCell(activeTab, j)) newData[i][j] = ''; }
            updateHistory({ ...tabData, [activeTab]: newData });
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (editingCell) return; e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        if (!pasteData) return;
        const minRow = selectionStart ? Math.min(selectionStart[0], selectionEnd![0]) : 0;
        const minCol = selectionStart ? Math.min(selectionStart[1], selectionEnd![1]) : 0;
        const isWebSystem = pasteData.includes('\t送信\t送信\t') || pasteData.includes('WEB依頼確定');
        const parsedRows = isWebSystem ? parseWebSystemPaste(pasteData) : parseTSV(pasteData);
        const newData = data.map(row => [...row]);
        for (let i = 0; i < parsedRows.length; i++) {
            const rIndex = minRow + i; if (rIndex >= newData.length) break;
            if (i === parsedRows.length - 1 && parsedRows[i].length === 1 && parsedRows[i][0] === '') break;
            for (let j = 0; j < parsedRows[i].length; j++) {
                const cIndex = minCol + j; if (cIndex >= currentColumns.length) break;
                if (isCheckboxCell(activeTab, cIndex)) {
                    const truthy = ['true', '1', 'yes', 'ok', '〇', 'x'];
                    newData[rIndex][cIndex] = truthy.includes(parsedRows[i][j].toLowerCase()) ? 'true' : 'false';
                } else { newData[rIndex][cIndex] = parsedRows[i][j]; }
            }
        }
        updateHistory({ ...tabData, [activeTab]: newData });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); setSelectionStart([0, 0]); setSelectionEnd([INITIAL_ROWS - 1, currentColumns.length - 1]); return; }

        if (editingCell) {
            if (e.key === 'Escape') { e.preventDefault(); commitEdit(true); tableRef.current?.focus(); }
            else if (e.key === 'Tab') { e.preventDefault(); commitEdit(); moveSelection(0, e.shiftKey ? -1 : 1); }
            else if (e.key === 'Enter' && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); commitEdit(); moveSelection(e.shiftKey ? -1 : 1, 0); }
            return;
        }

        if (!selectionStart || !selectionEnd) return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            const minRow = Math.min(selectionStart[0], selectionEnd[0]); const maxRow = Math.max(selectionStart[0], selectionEnd[0]);
            const minCol = Math.min(selectionStart[1], selectionEnd[1]); const maxCol = Math.max(selectionStart[1], selectionEnd[1]);
            const newData = data.map(row => [...row]);
            for (let i = minRow; i <= maxRow; i++) for (let j = minCol; j <= maxCol; j++) { if (j < currentColumns.length && !isCheckboxCell(activeTab, j)) newData[i][j] = ''; }
            updateHistory({ ...tabData, [activeTab]: newData });
        } else if (e.key === 'Tab') { e.preventDefault(); moveSelection(0, e.shiftKey ? -1 : 1); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            const now = Date.now();
            if (lastEnterData.current && (now - lastEnterData.current.time < 350)) {
                const prev = lastEnterData.current;
                setSelectionStart([prev.r, prev.c]); setSelectionEnd([prev.r, prev.c]);
                if (!isCheckboxCell(activeTab, prev.c)) startEditing(prev.r, prev.c);
                lastEnterData.current = null;
            } else { lastEnterData.current = { time: now, r: selectionStart[0], c: selectionStart[1] }; moveSelection(e.shiftKey ? -1 : 1, 0); }
        } else if (e.key === 'F2') { e.preventDefault(); startEditing(Math.min(selectionStart[0], selectionEnd[0]), Math.min(selectionStart[1], selectionEnd[1])); }
        else if (e.key.startsWith('Arrow')) {
            e.preventDefault();
            const rD = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
            const cD = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (e.shiftKey) {
                let r = Math.max(0, Math.min(INITIAL_ROWS - 1, selectionEnd[0] + rD));
                let c = Math.max(0, Math.min(currentColumns.length - 1, selectionEnd[1] + cD));
                setSelectionEnd([r, c]); scrollToRow(r);
            } else if (e.ctrlKey || e.metaKey) {
                if (e.key === 'ArrowUp') moveSelection(-selectionStart[0], 0);
                else if (e.key === 'ArrowDown') moveSelection(INITIAL_ROWS - 1 - selectionStart[0], 0);
                else if (e.key === 'ArrowLeft') moveSelection(0, -selectionStart[1]);
                else moveSelection(0, currentColumns.length - 1 - selectionStart[1]);
            } else { moveSelection(rD, cD); }
        } else if (e.key === 'Home') { e.preventDefault(); if (e.ctrlKey) { setSelectionStart([0, 0]); setSelectionEnd([0, 0]); scrollToRow(0); } else moveSelection(0, -selectionStart[1]); }
        else if (e.key === 'End') { e.preventDefault(); if (e.ctrlKey) { setSelectionStart([INITIAL_ROWS - 1, currentColumns.length - 1]); setSelectionEnd([INITIAL_ROWS - 1, currentColumns.length - 1]); scrollToRow(INITIAL_ROWS - 1); } else moveSelection(0, currentColumns.length - 1 - selectionStart[1]); }
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const r = Math.min(selectionStart[0], selectionEnd[0]); const c = Math.min(selectionStart[1], selectionEnd[1]);
            if (!isCheckboxCell(activeTab, c)) startEditing(r, c, e.key);
        }
    };

    const handleFillDashes = () => {
        const newData = data.map(row => {
            if (!row.some(cell => cell.trim() !== '')) return row;
            return row.map((cell, cIdx) => {
                if (isCheckboxCell(activeTab, cIdx)) return cell;
                return cell.trim() === '' ? '-' : cell;
            });
        });
        updateHistory({ ...tabData, [activeTab]: newData });
    };

    const handleClearAllCells = () => {
        if (!data.some(row => row.some(cell => cell.trim() !== ''))) return;
        if (!confirm('現在のタブのすべてのセルをクリアします。よろしいですか？')) return;
        updateHistory({ ...tabData, [activeTab]: createEmptyData(currentColumns.length) });
    };

    const getActiveTabStyle = (tabId: string) => {
        const styles: Record<string, string> = { manual: 'border-purple-500 text-purple-600', m: 'border-orange-500 text-orange-600', q: 'border-blue-600 text-blue-600', ip: 'border-emerald-500 text-emerald-600', i: 'border-slate-500 text-slate-600', f: 'border-slate-500 text-slate-600' };
        return styles[tabId] ?? 'border-blue-600 text-blue-600';
    };

    const getColumnWidthClass = (idx: number, tabId: string) => {
        if (tabId === 'ip') { const w: Record<number, string> = { 0: 'w-[3%]', 4: 'w-[9%]', 6: 'w-[8%]', 7: 'w-[3%]', 8: 'w-[9%]', 10: 'w-[9%]', 12: 'w-[8%]', 13: 'w-[3%]', 14: 'w-[3%]', 15: 'w-[3%]', 16: 'w-[9%]' }; return w[idx] ?? 'w-[4%]'; }
        if (tabId === 'i' || tabId === 'f') { const w: Record<number, string> = { 0: 'w-[10%]', 1: 'w-[8%]', 2: 'w-[14%]', 3: 'w-[10%]', 4: 'w-[14%]', 5: 'w-[12%]', 6: 'w-[8%]', 7: 'w-[8%]', 8: 'w-[8%]', 9: 'w-[8%]' }; return w[idx] ?? ''; }
        const w: Record<number, string> = { 0: 'w-[8%]', 2: 'w-[8%]', 6: 'w-[5%]', 7: 'w-[12%]', 8: 'w-[12%]', 9: 'w-[12%]', 13: 'w-[5%]' };
        return w[idx] ?? 'w-[6%]';
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden select-none -m-5 md:-m-7">
            <div className="flex flex-none flex-col sm:flex-row items-center justify-between px-4 py-2 sm:py-3 bg-white border-b border-slate-200 gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">集配データ入力</h1>
                </div>

                <div className="flex items-center space-x-1 overflow-x-auto text-[12px] font-medium w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1.5 flex items-center whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${activeTab === tab.id ? getActiveTabStyle(tab.id) : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                            {tab.name}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
                    {activeTab !== 'manual' && (
                        <>
                            <button onClick={undo} disabled={historyIdx.current <= 0} className="p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 rounded transition-colors" title="元に戻す (Ctrl+Z)"><Undo2 size={16} /></button>
                            <button onClick={redo} disabled={historyIdx.current >= history.length - 1} className="p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 rounded transition-colors" title="やり直す (Ctrl+Y)"><Redo2 size={16} /></button>
                            <button onClick={() => fetchGmail(true)} disabled={isFetchingGmail} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-xs font-semibold border border-slate-200 disabled:opacity-50">
                                <Mail size={14} />{isFetchingGmail ? '取得中...' : '今すぐ取得'}
                            </button>
                            <button onClick={handleFillDashes} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-xs font-semibold border border-slate-200"><span className="font-mono font-bold">-</span> 挿入</button>
                            <button onClick={handleClearAllCells} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-xs font-semibold border border-slate-200"><Eraser size={14} /> セルクリア</button>
                            <button onClick={handleDraftSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded hover:bg-slate-200 transition-colors shadow-sm text-xs font-semibold"><Archive size={14} className="text-slate-500" /> 一時保存</button>
                            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm text-xs font-semibold"><Save size={14} /> 保存する</button>
                        </>
                    )}
                </div>
            </div>

            {activeTab === 'manual' ? (
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-12">
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80">
                            <h2 className="text-lg font-bold text-slate-800">業務マニュアル</h2>
                            <p className="text-sm text-slate-500 mt-1">データ入力に関する各種業務マニュアルはこちらのドキュメントをご参照ください。</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex flex-col p-5 rounded-lg border border-slate-200 bg-white">
                                <div className="flex items-center justify-between"><h3 className="font-semibold text-blue-600 text-base">MDF・Q-dome マニュアル</h3><ExternalLink size={18} className="text-slate-400" /></div>
                                <p className="text-sm text-slate-500 mt-2">MDFおよびQ-domeに関する受付処理やシステム入力手順</p>
                            </div>
                            <div className="flex flex-col p-5 rounded-lg border border-slate-200 bg-white">
                                <div className="flex items-center justify-between"><h3 className="font-semibold text-blue-600 text-base">IPD マニュアル</h3><ExternalLink size={18} className="text-slate-400" /></div>
                                <p className="text-sm text-slate-500 mt-2">IPD検体に関するデータ入力およびイレギュラー対応手順</p>
                            </div>
                        </div>
                    </div>
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Keyboard size={20} className="text-blue-600" /> キーボード操作・ショートカットキー一覧</h2>
                        </div>
                        <div className="p-6">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                                {[
                                    { label: 'タブの切り替え', keys: ['Space', '+', '← / →'] },
                                    { label: '編集モードに入る', keys: ['F2', '/', 'ダブルクリック', '/', 'Enter2回'] },
                                    { label: 'セルを移動する', keys: ['Tab', '/', 'Enter', '/', '矢印キー'] },
                                    { label: '複数セルを選択', keys: ['ドラッグ', 'または', 'Shift + 矢印'] },
                                    { label: 'データを保存', keys: ['Ctrl + S'] },
                                    { label: '元に戻す / やり直す', keys: ['Ctrl + Z', '/', 'Ctrl + Y'] },
                                    { label: 'すべて選択', keys: ['Ctrl + A'] },
                                    { label: '内容を削除', keys: ['Del', '/', 'Back'] },
                                ].map(item => (
                                    <li key={item.label} className="flex flex-col p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="font-semibold text-slate-900 mb-2">{item.label}</span>
                                        <div className="flex gap-1 flex-wrap items-center">
                                            {item.keys.map((k, i) => (
                                                k === '/' || k === 'または' || k === '+' ? <span key={i} className="text-slate-400 text-xs">{k}</span> :
                                                <kbd key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono shadow-sm">{k}</kbd>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    ref={tableRef}
                    tabIndex={0}
                    className="flex-1 overflow-y-auto overflow-x-auto bg-white relative w-full outline-none"
                    onKeyDown={handleKeyDown}
                    onCopy={handleCopy}
                    onCut={handleCut}
                    onPaste={handlePaste}
                >
                    <table className="w-full border-collapse table-fixed bg-white text-[11px]">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="w-8 bg-[#f3f4f6] border-b border-r border-[#cbd5e1] py-1 text-center font-normal text-slate-400"></th>
                                {currentColumns.map((col, idx) => (
                                    <th key={idx} className={`bg-[#e1e9fb] border-b border-r border-[#cbd5e1] py-1.5 px-1 text-center font-semibold text-slate-800 whitespace-pre-line leading-tight align-middle ${getColumnWidthClass(idx, activeTab)}`}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, rIdx) => (
                                <tr key={rIdx} id={`row-${rIdx}`} className="group scroll-mt-[50px]">
                                    <td className={`border-b border-r border-[#cbd5e1] py-1 text-center font-medium ${selectionStart !== null && rIdx >= Math.min(selectionStart[0], selectionEnd![0]) && rIdx <= Math.max(selectionStart[0], selectionEnd![0]) ? 'bg-blue-200 text-blue-900' : 'bg-[#f3f4f6] text-slate-400'}`}>
                                        {rIdx + 1}
                                    </td>
                                    {Array.from({ length: currentColumns.length }, (_, i) => row[i] ?? '').map((cellValue, cIdx) => {
                                        const selected = isSelected(rIdx, cIdx);
                                        const editing = editingCell?.[0] === rIdx && editingCell?.[1] === cIdx;
                                        let baseClass = 'p-0 border-b border-r border-[#e2e8f0] relative h-[42px] cursor-cell';
                                        if (selected && !editing) baseClass += ' bg-blue-100/60 shadow-[inset_0_0_0_1px_#3b82f6]';
                                        else if (!selected && !editing) baseClass += ' hover:bg-slate-50/50';
                                        return (
                                            <td key={cIdx} onMouseDown={e => handleMouseDown(e, rIdx, cIdx)} onMouseEnter={() => { if (isSelectingRef.current) setSelectionEnd([rIdx, cIdx]); }} onDoubleClick={() => startEditing(rIdx, cIdx)} className={baseClass}>
                                                {isCheckboxCell(activeTab, cIdx) ? (
                                                    <div className="flex items-center justify-center w-full h-full">
                                                        <input type="checkbox" checked={cellValue === 'true'} onChange={e => { const newData = data.map(r => [...r]); newData[rIdx][cIdx] = e.target.checked ? 'true' : 'false'; updateHistory({ ...tabData, [activeTab]: newData }); }} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer" />
                                                    </div>
                                                ) : editing ? (
                                                    <textarea autoFocus value={editingValueTarget} onChange={e => { editingValueRef.current = e.target.value; setEditingValueTarget(e.target.value); }} onBlur={() => commitEdit()} className="w-full h-full p-1 text-slate-900 bg-white outline-none resize-none overflow-hidden leading-snug shadow-[inset_0_0_0_2px_#2563eb] z-10 absolute inset-0 align-middle pt-1" />
                                                ) : (
                                                    <div className="flex items-center w-full h-full px-1 text-slate-700 leading-snug overflow-hidden whitespace-pre-wrap">{cellValue}</div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

DataEntry.getLayout = function getLayout(page: ReactElement) {
  return <PrivateLayout>{page}</PrivateLayout>
}
