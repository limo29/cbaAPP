import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isPointInPolygon } from '@/utils/geometry';

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

        // 1. Find Territory
        let territoryId = null;
        let sequence = 0;

        if (lat && lng) {
            const territoriesStmt = db.prepare('SELECT id, polygon FROM territories');
            const territories = territoriesStmt.all() as any[];

            for (const t of territories) {
                try {
                    const polygon = JSON.parse(t.polygon);
                    if (Array.isArray(polygon) && polygon.length > 0) {
                        if (isPointInPolygon([lat, lng], polygon)) {
                            territoryId = t.id;
                            break;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing polygon for territory', t.id, e);
                }
            }
        }

        // 2. Determine Sequence (append to end)
        if (territoryId) {
            const seqStmt = db.prepare('SELECT MAX(sequence) as maxSeq FROM trees WHERE territory_id = ?');
            const seqResult = seqStmt.get(territoryId) as any;
            sequence = (seqResult?.maxSeq || 0) + 1;
        }

        const stmt = db.prepare(`
            INSERT INTO trees (
                name, first_name, address, zip, city, phone, email, payment_method, note, lat, lng, status, territory_id, sequence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
        `);

        const info = stmt.run(
            name,
            first_name || null,
            address,
            zip,
            city,
            phone || null,
            email || null,
            payment_method || 'Baum',
            note || null,
            lat || null,
            lng || null,
            territoryId,
            sequence
        );

        return NextResponse.json({ id: info.lastInsertRowid, success: true });
    } catch (error) {
        console.error('Registration failed:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
