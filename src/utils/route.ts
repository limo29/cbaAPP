export async function optimizeRoute(trees: any[], startPoint?: { lat: number, lng: number }) {
    if (trees.length === 0) return [];

    // Filter out trees without coordinates
    const validTrees = trees.filter(t => t.lat && t.lng);
    if (validTrees.length === 0) return [];

    // OSRM Demo Server has limits (approx 100 coordinates)
    if (validTrees.length < 100) {
        try {
            // Try OSRM first for car optimization
            return await solveOSRM(validTrees, startPoint);
        } catch (error) {
            console.warn('OSRM optimization failed, falling back to heuristic:', error);
        }
    }

    // Fallback: Nearest Neighbor + 2-Opt Optimization
    return solveHeuristic(validTrees, startPoint);
}

async function solveOSRM(trees: any[], startPoint?: { lat: number, lng: number }) {
    let orderedPoints: { lat: number, lng: number, tree?: any }[] = [];

    if (startPoint) {
        orderedPoints.push({ ...startPoint });
        orderedPoints.push(...trees.map(t => ({ lat: t.lat, lng: t.lng, tree: t })));
    } else {
        // Find northernmost tree to start (consistent entry point)
        let maxLat = -Infinity;
        let maxIdx = 0;
        for (let i = 0; i < trees.length; i++) {
            if (trees[i].lat > maxLat) {
                maxLat = trees[i].lat;
                maxIdx = i;
            }
        }

        const startTree = trees[maxIdx];
        const otherTrees = [...trees];
        otherTrees.splice(maxIdx, 1);

        orderedPoints.push({ lat: startTree.lat, lng: startTree.lng, tree: startTree });
        orderedPoints.push(...otherTrees.map(t => ({ lat: t.lat, lng: t.lng, tree: t })));
    }

    // OSRM expects lng,lat
    const coordinates = orderedPoints.map(p => `${p.lng},${p.lat}`).join(';');

    // Use OSRM Trip API
    // Use OSRM Trip API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    try {
        const response = await fetch(`https://router.project-osrm.org/trip/v1/driving/${coordinates}?source=first&roundtrip=false`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`OSRM API error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.code !== 'Ok' || !data.waypoints) {
            throw new Error('Invalid OSRM response');
        }

        const sortedPoints = new Array(orderedPoints.length);

        for (let i = 0; i < data.waypoints.length; i++) {
            const wp = data.waypoints[i];
            const positionInTrip = wp.waypoint_index;
            sortedPoints[positionInTrip] = orderedPoints[i];
        }

        const sortedTrees = sortedPoints
            .filter(p => p && p.tree)
            .map(p => p.tree);

        return sortedTrees;



    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

function solveHeuristic(trees: any[], startPoint?: { lat: number, lng: number }) {
    // 1. Nearest Neighbor Construction
    let route = solveNearestNeighbor(trees, startPoint);

    // 2. 2-Opt Optimization (untangle crossing paths)
    route = twoOpt(route);

    return route;
}

function solveNearestNeighbor(trees: any[], startPoint?: { lat: number, lng: number }) {
    const remaining = [...trees];
    const sorted = [];

    let current: any = null;

    if (startPoint) {
        // Find closest to start point
        let minDist = Infinity;
        let minIdx = -1;
        for (let i = 0; i < remaining.length; i++) {
            const dist = getDistance(startPoint, remaining[i]);
            if (dist < minDist) {
                minDist = dist;
                minIdx = i;
            }
        }
        if (minIdx !== -1) {
            current = remaining[minIdx];
        }
    } else {
        // Start with northernmost
        let maxLat = -Infinity;
        let maxIdx = 0;
        for (let i = 0; i < remaining.length; i++) {
            if (remaining[i].lat > maxLat) {
                maxLat = remaining[i].lat;
                maxIdx = i;
            }
        }
        current = remaining[maxIdx];
    }

    if (current) {
        const idx = remaining.indexOf(current);
        if (idx > -1) remaining.splice(idx, 1);
        sorted.push(current);
    }

    while (remaining.length > 0) {
        let nearestIdx = -1;
        let nearestDist = Infinity;

        for (let i = 0; i < remaining.length; i++) {
            const dist = getDistance(current, remaining[i]);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestIdx = i;
            }
        }

        current = remaining[nearestIdx];
        remaining.splice(nearestIdx, 1);
        sorted.push(current);
    }

    return sorted;
}

function twoOpt(route: any[]) {
    const n = route.length;
    if (n < 4) return route;

    let improved = true;
    let count = 0;
    const maxIterations = 50; // Limit iterations for performance

    while (improved && count < maxIterations) {
        improved = false;
        count++;

        for (let i = 0; i < n - 2; i++) {
            for (let j = i + 2; j < n - 1; j++) { // j starts at i+2 to avoid adjacent edges
                const p1 = route[i];
                const p2 = route[i + 1];
                const p3 = route[j];
                const p4 = route[j + 1];

                const d1 = getDistance(p1, p2) + getDistance(p3, p4);
                const d2 = getDistance(p1, p3) + getDistance(p2, p4);

                if (d2 < d1) {
                    // Swap edges (reverse segment between i+1 and j)
                    const newRoute = [
                        ...route.slice(0, i + 1),
                        ...route.slice(i + 1, j + 1).reverse(),
                        ...route.slice(j + 1)
                    ];
                    route = newRoute;
                    improved = true;
                }
            }
        }
    }
    return route;
}

export function getDistance(p1: { lat: number, lng: number }, p2: { lat: number, lng: number }) {
    if (!p1.lat || !p1.lng || !p2.lat || !p2.lng) return Infinity;

    const R = 6371e3;
    const φ1 = p1.lat * Math.PI / 180;
    const φ2 = p2.lat * Math.PI / 180;
    const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
    const Δλ = (p2.lng - p1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
