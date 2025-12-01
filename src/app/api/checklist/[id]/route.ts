import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await request.json();
        const { text, target_date, responsible, is_completed } = body;
        const { id } = await params;

        const updates = [];
        const values = [];

        if (text !== undefined) {
            updates.push('text = ?');
            values.push(text);
        }
        if (target_date !== undefined) {
            updates.push('target_date = ?');
            values.push(target_date);
        }
        if (responsible !== undefined) {
            updates.push('responsible = ?');
            values.push(responsible);
        }
        if (is_completed !== undefined) {
            updates.push('is_completed = ?');
            values.push(is_completed ? 1 : 0);
        }

        if (updates.length === 0) {
            return NextResponse.json({ success: true });
        }

        values.push(id);
        const stmt = db.prepare(`UPDATE checklist_items SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...values);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const stmt = db.prepare('DELETE FROM checklist_items WHERE id = ?');
        stmt.run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
