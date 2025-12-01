import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stmt = db.prepare('SELECT * FROM checklist_items');
        const items = stmt.all();
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, target_date, responsible } = body;

        const stmt = db.prepare('INSERT INTO checklist_items (text, target_date, responsible) VALUES (?, ?, ?)');
        const info = stmt.run(text, target_date || null, responsible || null);

        return NextResponse.json({ id: info.lastInsertRowid, success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
