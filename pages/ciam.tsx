'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { INITIAL_DRIVERS } from '@/lib/dummyData';
import type { Driver } from '@/types';

const MapBox = dynamic(() => import('@/components/specimen/ciam/MapBox'), { ssr: false });
const DriverList = dynamic(() => import('@/components/specimen/ciam/DriverList'), { ssr: false });

export default function CIAMPage() {
    const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);

    useEffect(() => {
        const timer = setInterval(() => {
            setDrivers(prev => prev.map(driver => {
                if (driver.status === 'offline') return driver;
                const delta = 0.005;
                return {
                    ...driver,
                    lat: driver.lat + (Math.random() - 0.5) * delta,
                    lng: driver.lng + (Math.random() - 0.5) * delta,
                    speed: driver.status === 'driving' ? Math.floor(Math.random() * 60) : 0,
                    lastUpdated: new Date().toISOString(),
                };
            }));
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0f172a', overflow: 'hidden' }}>
            <MapBox drivers={drivers} />
            <div style={{
                position: 'absolute',
                top: 80,
                right: 16,
                width: 320,
                zIndex: 20,
            }}>
                <DriverList drivers={drivers} />
            </div>
        </div>
    );
}
