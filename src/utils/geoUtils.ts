export const GeoUtils = {
    /**
     * Check if a point is inside a polygon using Ray Casting algorithm
     */
    isPointInPolygon: (point: { latitude: number; longitude: number }, polygon: { latitude: number; longitude: number }[]) => {
        const x = point.longitude, y = point.latitude;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].longitude, yi = polygon[i].latitude;
            const xj = polygon[j].longitude, yj = polygon[j].latitude;

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
};

// Approximate Nicosia Green Line / Buffer Zone (Simplified)
export const GREEN_LINE_POLYGON = [
    { latitude: 35.1750, longitude: 33.3250 },
    { latitude: 35.1800, longitude: 33.3550 },
    { latitude: 35.1850, longitude: 33.3750 }, // Near Ledra
    { latitude: 35.1780, longitude: 33.3950 },
    { latitude: 35.1700, longitude: 33.4000 },
    { latitude: 35.1600, longitude: 33.3800 },
    { latitude: 35.1650, longitude: 33.3400 }
];
