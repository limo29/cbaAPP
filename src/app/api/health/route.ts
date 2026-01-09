import { NextResponse } from 'next/server';
import os from 'os';
import { getLogs } from '@/lib/log-capture';

export const dynamic = 'force-dynamic';

export async function GET() {
    const memoryUsage = process.memoryUsage();

    const stats = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        system: {
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
            },
            system_memory: {
                total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
                free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
            },
            uptime: Math.round(process.uptime()),
            loadavg: os.loadavg(),
        },
        logs: getLogs().reverse() // Show newest first
    };

    return NextResponse.json(stats);
}
