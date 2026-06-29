import { useEffect } from 'react';

/**
 * Shift+C→S→V でCSVインポート、Shift+D→E→L→E→T→Eで全削除確認を開くショートカット。
 * テキスト入力欄にフォーカスがある間は無効化される。
 */
export function useCsvDeleteShortcut(onCsv: () => void, onDelete: () => void) {
    useEffect(() => {
        let buffer = '';
        let lastTime = 0;
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
            if (!e.shiftKey || !/^[A-Z]$/.test(e.key)) {
                buffer = '';
                return;
            }
            const now = Date.now();
            if (now - lastTime > 1500) buffer = '';
            lastTime = now;
            buffer = (buffer + e.key).slice(-6);
            if (buffer.endsWith('CSV')) {
                onCsv();
                buffer = '';
            } else if (buffer.endsWith('DELETE')) {
                onDelete();
                buffer = '';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCsv, onDelete]);
}
