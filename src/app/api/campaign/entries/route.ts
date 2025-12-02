import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const entries = db.prepare('SELECT * FROM campaign_entries ORDER BY last_updated DESC').all();
        return NextResponse.json(entries);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        db.prepare('UPDATE campaign_entries SET status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }
}
