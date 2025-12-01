export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);

        if (!response.ok) {
            throw new Error('Geocoding API failed');
        }

        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}
