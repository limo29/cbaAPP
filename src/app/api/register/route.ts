import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            first_name,
            address,
            zip,
            city,
            phone,
            email,
            payment_method,
            note,
            lat,
            lng
        } = body;

        // Validation
        if (!name || !address || !zip || !city) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const stmt = db.prepare(`
            INSERT INTO trees (
                name, first_name, address, zip, city, phone, email, payment_method, note, lat, lng, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
        `);

        const info = stmt.run(
            name,
            first_name || null,
            address,
            zip,
            city,
            phone || null,
            email || null,
            payment_method || 'Bar',
            note || null,
            lat || null,
            lng || null
        );

        return NextResponse.json({ id: info.lastInsertRowid, success: true });
    } catch (error) {
        console.error('Registration failed:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
