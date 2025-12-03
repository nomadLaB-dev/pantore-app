"use client";

import React from 'react';
import { X, Laptop, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { type DeviceHistory } from '@/lib/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    devices: DeviceHistory[];
}

export const DeviceListModal = ({ isOpen, onClose, devices }: Props) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Laptop className="w-5 h-5 text-pantore-500" />
                        利用デバイス一覧
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-200 p-2 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {devices.map((device, index) => (
                        <div key={index} className="flex flex-col gap-3 p-4 bg-pantore-50 rounded-xl border border-pantore-100">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-12 bg-white rounded-lg border border-pantore-200 flex items-center justify-center text-pantore-400 shadow-sm">
                                    <Laptop className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-pantore-800">{device.model}</p>
                                    <p className="text-sm text-pantore-500 font-mono">S/N: {device.serial}</p>
                                </div>
                            </div>
                            {/* 故障・不具合報告へのリンク */}
                            <Link
                                href={`/portal/request/repair?device=${device.serial}`}
                                className="w-full py-2 text-sm font-bold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <AlertCircle className="w-4 h-4" /> 故障・不具合を報告する
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
