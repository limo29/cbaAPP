import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();

    const updates = [];
    const values = [];

    if (body.status !== undefined) {
        updates.push('status = ?');
        values.push(body.status);
    }
    if (body.sequence !== undefined) {
        updates.push('sequence = ?');
        values.push(body.sequence);
    }
    if (body.territory_id !== undefined) {
        updates.push('territory_id = ?');
        values.push(body.territory_id);
    }
    if (body.lat !== undefined) {
        updates.push('lat = ?');
        values.push(body.lat);
    }
    if (body.lng !== undefined) {
        updates.push('lng = ?');
        values.push(body.lng);
    }
    if (body.note !== undefined) {
        updates.push('note = ?');
        values.push(body.note);
    }

    if (updates.length === 0) return NextResponse.json({ success: true });

    values.push(id);

    try {
        const stmt = db.prepare(`UPDATE trees SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...values);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const stmt = db.prepare('DELETE FROM trees WHERE id = ?');
        stmt.run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
