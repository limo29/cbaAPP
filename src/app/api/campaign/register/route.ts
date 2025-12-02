import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { geocodeAddress } from '@/utils/geocoding'; // Assuming this utility exists and can be used on server side? 
// Wait, geocodeAddress might be client-side or server-side. 
// Let's check utils/geocoding.ts. If it uses fetch, it works in Node too (in Next.js 13+).

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, address, phone } = body;

        if (!id || !name || !address) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // 1. Geocode the address
        let lat = 0;
        let lng = 0;

        try {
            // Delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
                headers: {
                    'User-Agent': 'ChristmasTreeApp/1.0'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    lat = parseFloat(data[0].lat);
                    lng = parseFloat(data[0].lon);
                }
            }
        } catch (geoError) {
            console.error('Geocoding failed during campaign registration:', geoError);
            // Continue without coordinates
        }

        const stmt = db.prepare(`
            INSERT INTO trees (name, address, phone, status, lat, lng, territory_id)
            VALUES (?, ?, ?, 'open', ?, ?, NULL)
        `);

        const info = stmt.run(name, address, phone, lat, lng);
        const newTreeId = info.lastInsertRowid;

        // Update campaign entry status
        db.prepare("UPDATE campaign_entries SET status = 'registered' WHERE id = ?").run(id);

        return NextResponse.json({ success: true, treeId: newTreeId });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
    }
}
