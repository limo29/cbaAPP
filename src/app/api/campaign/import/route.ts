import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        // Force UTF-8 for CSV files if possible, or let XLSX detect.
        // If the user sees artifacts, it means XLSX likely guessed wrong (e.g. guessed CP1252 for a UTF-8 file).
        // We can try to force codepage 65001 (UTF-8).
        const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Empty file' }, { status: 400 });
        }

        // Fetch existing trees to compare
        const trees = db.prepare('SELECT name, address FROM trees').all() as { name: string, address: string }[];
        const existingSet = new Set(trees.map(t => `${t.name?.toLowerCase().trim()}|${t.address.toLowerCase().trim()}`));

        let addedCount = 0;
        let skippedCount = 0;

        const insertStmt = db.prepare(`
            INSERT INTO campaign_entries (name, address, phone, status)
            VALUES (?, ?, ?, 'open')
        `);

        const insertMany = db.transaction((entries: any[]) => {
            for (const entry of entries) {
                insertStmt.run(entry.name, entry.address, entry.phone);
            }
        });

        const entriesToAdd: any[] = [];

        for (const row of data) {
            // Map columns - try to be smart or expect specific headers?
            // Let's try to find common headers
            const keys = Object.keys(row);
            const nameKey = keys.find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('firma'));
            const addressKey = keys.find(k => k.toLowerCase().includes('adress') || k.toLowerCase().includes('straße'));
            const phoneKey = keys.find(k => k.toLowerCase().includes('tel') || k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobil'));

            // If address is split (Street, Zip, City)
            const streetKey = keys.find(k => k.toLowerCase().includes('straße'));
            const zipKey = keys.find(k => k.toLowerCase().includes('plz'));
            const cityKey = keys.find(k => k.toLowerCase().includes('ort') || k.toLowerCase().includes('stadt'));

            let name = nameKey ? row[nameKey] : '';
            if (!name) {
                const firstName = keys.find(k => k.toLowerCase().includes('vorname'));
                const lastName = keys.find(k => k.toLowerCase().includes('nachname'));
                if (firstName && lastName) {
                    name = `${row[firstName]} ${row[lastName]}`;
                }
            }

            let address = addressKey ? row[addressKey] : '';
            if (!address && streetKey) {
                address = `${row[streetKey]}`;
                if (zipKey) address += `, ${row[zipKey]}`;
                if (cityKey) address += ` ${row[cityKey]}`;
            }

            const phone = phoneKey ? row[phoneKey] : '';

            if (!name || !address || !phone) {
                skippedCount++;
                continue;
            }

            // Check duplicate
            const key = `${name.toLowerCase().trim()}|${address.toLowerCase().trim()}`;
            if (existingSet.has(key)) {
                skippedCount++;
                continue;
            }

            // Check if already in campaign_entries?
            // Ideally yes, but for now let's just rely on the user not importing duplicates or we can add a unique constraint/check.
            // Let's check DB for existing campaign entries too to avoid duplicates there.
            const existingCampaign = db.prepare('SELECT 1 FROM campaign_entries WHERE name = ? AND address = ?').get(name, address);
            if (existingCampaign) {
                skippedCount++;
                continue;
            }

            entriesToAdd.push({ name, address, phone });
            addedCount++;
        }

        if (entriesToAdd.length > 0) {
            insertMany(entriesToAdd);
        }

        return NextResponse.json({ added: addedCount, skipped: skippedCount });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }
}
