import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateRoute } from '@/lib/route-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const territoryId = searchParams.get('territoryId');

    let stmt;
    if (territoryId) {
        stmt = db.prepare('SELECT * FROM trees WHERE territory_id = ? ORDER BY sequence ASC');
        const trees = stmt.all(territoryId);
        return NextResponse.json(trees);
    } else {
        stmt = db.prepare('SELECT * FROM trees');
        const trees = stmt.all();
        return NextResponse.json(trees);
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    // Expecting array of trees or single tree
    const trees = Array.isArray(body) ? body : [body];

    const insert = db.prepare(`
    INSERT INTO trees (name, address, phone, note, payment_method, lat, lng, territory_id, status, sequence)
    VALUES (@name, @address, @phone, @note, @payment_method, @lat, @lng, @territory_id, 'open', 0)
  `);

    const insertMany = db.transaction((trees) => {
        for (const tree of trees) {
            insert.run({
                name: tree.name || '',
                address: tree.address,
                phone: tree.phone || '',
                note: tree.note || '',
                payment_method: tree.payment_method || '',
                lat: tree.lat || null,
                lng: tree.lng || null,
                territory_id: tree.territory_id || null
            });
        }
    });

    try {
        insertMany(trees);

        // Calculate routes for affected territories
        const territoryIds = new Set(trees.map((t: any) => t.territory_id).filter((id: any) => id));
        for (const id of territoryIds) {
            await calculateRoute(Number(id));
        }

        return NextResponse.json({ success: true, count: trees.length });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const stmt = db.prepare('DELETE FROM trees');
        stmt.run();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
