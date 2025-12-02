import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'delete_all') {
            db.prepare('DELETE FROM campaign_entries').run();
            return NextResponse.json({ success: true, message: 'All entries deleted' });
        }

        if (action === 'reset_status') {
            // Reset all 'called', 'not_reached' to 'open'. 
            // Keep 'registered' and 'deleted'? 
            // User said "reset status (for next year)". 
            // Usually "registered" means they are done for this year. 
            // If it's for *next* year, maybe we want to reset EVERYTHING to 'open' except maybe 'deleted'?
            // Or maybe we want to keep 'registered' as is?
            // "reset status (for next year)" implies we want to call them again.
            // So 'registered' people from last year should be called again?
            // If they are registered *this* year, they are in `trees`.
            // The campaign list is for people *not* yet registered.
            // So if we reset for next year, we probably want to set everyone to 'open' so we can call them again.
            // But we should probably re-import or re-check against `trees`?
            // If I just reset status to 'open', they become "to be called".
            // Let's assume reset means set status = 'open' for everyone.

            db.prepare("UPDATE campaign_entries SET status = 'open'").run();
            return NextResponse.json({ success: true, message: 'All statuses reset to open' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
