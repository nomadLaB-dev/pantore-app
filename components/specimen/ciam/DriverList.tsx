'use client';

import { Truck, Timer, WifiOff } from 'lucide-react';
import type { Driver } from '@/types';

export default function DriverList({ drivers }: { drivers: Driver[] }) {
  const stoppedCount = drivers.filter(d => d.status === 'stopped').length;

  return (
    <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', margin: 0 }}>配送員ステータス</h3>
        <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', color: 'white' }}>
          全 {drivers.length} 名
        </span>
      </div>

      {stoppedCount > 0 && (
        <div style={{ margin: '16px 16px 0', padding: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#ef4444', padding: '6px', borderRadius: '50%', color: 'white' }}>
            <Timer size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fca5a5' }}>長時間の停車を検知</div>
            <div style={{ fontSize: '0.75rem', color: '#fecaca', marginTop: '2px' }}>{stoppedCount}名の配送員が一定時間停止しています</div>
          </div>
        </div>
      )}

      <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {drivers.map(driver => (
          <div
            key={driver.id}
            style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: driver.status === 'driving' ? '#22c55e' : driver.status === 'stopped' ? '#f59e0b' : '#94a3b8',
                  boxShadow: driver.status === 'driving' ? '0 0 8px #22c55e' : 'none',
                }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{driver.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {driver.id}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#94a3b8', fontSize: '0.8rem' }}>
              {driver.status === 'driving' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Truck size={14} color="#60a5fa" />
                  <span>{driver.speed} km/h</span>
                </div>
              )}
              {driver.status === 'stopped' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                  <Timer size={14} />
                  <span>停車中 ({driver.stopDuration}分)</span>
                </div>
              )}
              {driver.status === 'offline' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <WifiOff size={14} />
                  <span>オフライン</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
