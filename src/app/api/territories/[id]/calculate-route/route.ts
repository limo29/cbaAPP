import { NextResponse } from 'next/server';
import { calculateRoute } from '@/lib/route-utils';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const territoryId = Number(id);

    if (isNaN(territoryId)) {
        return NextResponse.json({ error: 'Invalid territory ID' }, { status: 400 });
    }

    try {
        await calculateRoute(territoryId);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
