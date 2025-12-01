import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_ITEMS = [
    "Termin Festlegen (Samstag nach Hl 3 Könige)",
    "Flyer erstellen",
    "Google Forms Umfrage erstellen und an GLs verteilen",
    "Website Beitrag schreiben",
    "Flyer und Plakate bestellen (Wir machen Druck Neon Grün)",
    "Pfarrbrief schreiben",
    "Plakate an Christbaumständen und Stadtgebiet verteilen",
    "Fahrzeuge Organisieren",
    "Winkler LKW + Fahrer",
    "Bauhof anfragen zum Abladen",
    "Zentrale anfragen (Dultplatzhäuschen oder JUZ)",
    "Gruppenleiter und Fahrer abfragen",
    "Pils und Essen Organisiern"
];

export async function POST() {
    try {
        const deleteStmt = db.prepare('DELETE FROM checklist_items');
        deleteStmt.run();

        const insertStmt = db.prepare('INSERT INTO checklist_items (text) VALUES (?)');
        const insertMany = db.transaction((items) => {
            for (const item of items) insertStmt.run(item);
        });

        insertMany(DEFAULT_ITEMS);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
