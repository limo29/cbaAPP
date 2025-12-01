import db from '@/lib/db';

export async function calculateRoute(territoryId: number) {
    // 1. Fetch trees for the territory, sorted by sequence
    const trees = db.prepare('SELECT * FROM trees WHERE territory_id = ? ORDER BY sequence ASC').all(territoryId) as any[];

    // 2. Filter valid coordinates
    const validTrees = trees.filter(t => t.lat && t.lng);

    if (validTrees.length < 2) {
        // Not enough points for a route, clear existing route
        db.prepare('UPDATE territories SET route_geometry = NULL WHERE id = ?').run(territoryId);
        return;
    }

    // 3. Prepare coordinates for OSRM
    const coordinates = validTrees.map(t => `${t.lng},${t.lat}`).join(';');

    try {
        // 4. Call OSRM API
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
        const res = await fetch(url);

        if (res.status === 429) {
            console.warn(`Rate limit exceeded for territory ${territoryId}. Using straight lines.`);
            // Fallback to straight lines
            const straightLineRoute = validTrees.map(t => [t.lat, t.lng]);
            db.prepare('UPDATE territories SET route_geometry = ? WHERE id = ?').run(JSON.stringify(straightLineRoute), territoryId);
            return;
        }

        if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
                // OSRM returns [lng, lat], we want [lat, lng]
                const routeGeometry = data.routes[0].geometry.coordinates.map((p: number[]) => [p[1], p[0]]);

                // 5. Update territory with new route
                db.prepare('UPDATE territories SET route_geometry = ? WHERE id = ?').run(JSON.stringify(routeGeometry), territoryId);
            }
        } else {
            // Fallback to straight lines on error
            const straightLineRoute = validTrees.map(t => [t.lat, t.lng]);
            db.prepare('UPDATE territories SET route_geometry = ? WHERE id = ?').run(JSON.stringify(straightLineRoute), territoryId);
        }
    } catch (error) {
        console.error(`Failed to calculate route for territory ${territoryId}:`, error);
        // Fallback to straight lines
        const straightLineRoute = validTrees.map(t => [t.lat, t.lng]);
        db.prepare('UPDATE territories SET route_geometry = ? WHERE id = ?').run(JSON.stringify(straightLineRoute), territoryId);
    }
}
