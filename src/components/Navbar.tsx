'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Truck, Home } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: '64px'
        }}>
            {/* Left: Home Button */}
            <Link href="/" style={{
                color: pathname === '/' ? '#4ade80' : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                transition: 'color 0.2s'
            }}>
                <Home size={24} />
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>CBA</span>
            </Link>

            {/* Right: Quick Actions */}
            <div style={{ display: 'flex', gap: '1.5rem' }}>
                <Link href="/driver" style={{
                    color: pathname === '/driver' ? '#4ade80' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                }} title="Fahrer">
                    <Truck size={22} />
                </Link>
                <Link href="/admin" style={{
                    color: pathname === '/admin' ? '#4ade80' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                }} title="Admin">
                    <Map size={22} />
                </Link>
            </div>
        </nav>
    );
}
