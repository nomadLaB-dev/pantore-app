import type { Driver } from '@/types';
export type { Driver };

export const INITIAL_DRIVERS: Driver[] = [
  { id: '1', name: '田中 太郎', lat: 34.3852, lng: 132.4552, status: 'driving', speed: 50, lastUpdated: new Date().toISOString() },
  { id: '2', name: '鈴木 一郎', lat: 34.6617, lng: 133.9189, status: 'stopped', speed: 0, stopDuration: 15, lastUpdated: new Date().toISOString() },
  { id: '3', name: '佐藤 花子', lat: 33.8391, lng: 132.7661, status: 'driving', speed: 36, lastUpdated: new Date().toISOString() },
  { id: '4', name: '高橋 次郎', lat: 34.3401, lng: 134.0433, status: 'offline', speed: 0, lastUpdated: new Date(Date.now() - 3600000).toISOString() },
  { id: '5', name: '伊藤 三郎', lat: 33.5588, lng: 133.5311, status: 'driving', speed: 20, lastUpdated: new Date().toISOString() },
];
