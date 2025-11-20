"use client";

import React, { useState, useMemo } from 'react';
import { Laptop, X, Monitor } from 'lucide-react';
import { type DeviceHistory, type Asset } from '@/lib/demo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: DeviceHistory, assetId: string) => void;
  assets: Asset[];
}

export const DeviceAssignModal = ({ isOpen, onClose, onSave, assets }: Props) => {
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assignedAt, setAssignedAt] = useState(new Date().toISOString().split('T')[0]);

  // 在庫のみ抽出
  const availableAssets = useMemo(() => assets.filter(a => a.status === 'available'), [assets]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const asset = availableAssets.find(a => a.id === selectedAssetId);
    if (asset) {
      onSave({ model: asset.model, serial: asset.serial, assignedAt }, asset.id);
      onClose();
      setSelectedAssetId('');
    } else {
      alert('デバイスを選択してください💻');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-gray-100">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <Laptop className="w-5 h-5 text-blue-600" /> デバイス貸出
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">貸出対象 (在庫)</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)}>
            <option value="">選択してください</option>
            {availableAssets.map(a => <option key={a.id} value={a.id}>{a.model} ({a.serial})</option>)}
            {availableAssets.length === 0 && <option disabled>在庫なし</option>}
          </select>
          <label className="text-sm font-medium text-gray-700">貸出日</label>
          <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            value={assignedAt} onChange={e => setAssignedAt(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">キャンセル</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
            <Monitor className="w-4 h-4" /> 貸出
          </button>
        </div>
      </div>
    </div>
  );
};