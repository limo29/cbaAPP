import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();

    const fields: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) fields.push('name = ?'), values.push(body.name);
    if (body.color !== undefined) fields.push('color = ?'), values.push(body.color);
    if (body.polygon !== undefined) fields.push('polygon = ?'), values.push(JSON.stringify(body.polygon));
    if (body.driver_name !== undefined) fields.push('driver_name = ?'), values.push(body.driver_name);

    if (fields.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);

    try {
        const stmt = db.prepare(`UPDATE territories SET ${fields.join(', ')} WHERE id = ?`);
        stmt.run(...values);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        // Unassign trees first
        const unassign = db.prepare('UPDATE trees SET territory_id = NULL WHERE territory_id = ?');
        unassign.run(id);

        const stmt = db.prepare('DELETE FROM territories WHERE id = ?');
        stmt.run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
