import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const stmt = db.prepare(`
        SELECT t.*, 
        (SELECT COUNT(*) FROM trees WHERE territory_id = t.id) as total_trees,
        (SELECT COUNT(*) FROM trees WHERE territory_id = t.id AND status = 'open') as open_trees,
        (SELECT COUNT(*) FROM trees WHERE territory_id = t.id AND status = 'collected') as collected_trees
        FROM territories t
    `);
    const territories = stmt.all().map((t: any) => ({
        ...t,
        polygon: JSON.parse(t.polygon),
        route_geometry: t.route_geometry ? JSON.parse(t.route_geometry) : null
    }));
    return NextResponse.json(territories);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { name, color, polygon } = body;

    try {
        const stmt = db.prepare('INSERT INTO territories (name, color, polygon) VALUES (?, ?, ?)');
        const info = stmt.run(name, color, JSON.stringify(polygon));
        return NextResponse.json({ id: info.lastInsertRowid, success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
