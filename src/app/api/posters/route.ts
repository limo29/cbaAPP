import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const stmt = db.prepare('SELECT * FROM posters ORDER BY created_at DESC');
    const posters = stmt.all();
    return NextResponse.json(posters);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { lat, lng, note } = body;

    try {
        const stmt = db.prepare('INSERT INTO posters (lat, lng, note) VALUES (?, ?, ?)');
        const result = stmt.run(lat, lng, note || '');
        return NextResponse.json({ id: result.lastInsertRowid, lat, lng, note });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        db.prepare('DELETE FROM posters').run();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
