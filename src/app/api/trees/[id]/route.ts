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
    if (body.name !== undefined) {
        updates.push('name = ?');
        values.push(body.name);
    }
    if (body.first_name !== undefined) {
        updates.push('first_name = ?');
        values.push(body.first_name);
    }
    if (body.address !== undefined) {
        updates.push('address = ?');
        values.push(body.address);
    }
    if (body.zip !== undefined) {
        updates.push('zip = ?');
        values.push(body.zip);
    }
    if (body.city !== undefined) {
        updates.push('city = ?');
        values.push(body.city);
    }
    if (body.email !== undefined) {
        updates.push('email = ?');
        values.push(body.email);
    }
    if (body.phone !== undefined) {
        updates.push('phone = ?');
        values.push(body.phone);
    }
    if (body.payment_method !== undefined) {
        updates.push('payment_method = ?');
        values.push(body.payment_method);
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
