import { NextResponse } from 'next/server';
import { optimizeTerritoryRoute } from '@/lib/route-utils';
import { geocodeAddress } from '@/utils/geocoding'; // We might need to move this to lib if it's used on server

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const territoryId = Number(id);

}
