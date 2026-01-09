import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { optimizeTerritoryRoute, calculateRoute } from '@/lib/route-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { action } = await request.json(); // 'optimize' or 'calculate'

        const territories = db.prepare('SELECT id FROM territories').all() as { id: number }[];

        for (const t of territories) {
            try {
                if (action === 'optimize') {
                    await optimizeTerritoryRoute(t.id);
                } else if (action === 'calculate') {
                    await calculateRoute(t.id);
                }
            } catch (e) {
                console.error(`Error processing territory ${t.id}:`, e);
            }
            // Rate limiting delay for OSRM
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        return NextResponse.json({ success: true, count: territories.length });
    } catch (error) {
        console.error('Batch operation failed:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
