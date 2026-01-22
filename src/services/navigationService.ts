import { Alert } from 'react-native';

const OSRM_BASE_URL = 'http://router.project-osrm.org/route/v1/driving';

export interface RouteStep {
    latitude: number;
    longitude: number;
}

export interface Bot {
    id: string;
    latitude: number;
    longitude: number;
    type: 'BOT';
    hp: number;
    reward: {
        xp: number;
        coins: number;
    };
}

export const NavigationService = {
    /**
     * Fetch route from OSRM
     * Returns an array of coordinates decoding the polyline geometry (simplified)
     */
    getRoute: async (startLat: number, startLng: number, endLat: number, endLng: number) => {
        try {
            // Format: lon,lat;lon,lat
            const url = `${OSRM_BASE_URL}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const json = await response.json();

            if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
                console.error("OSRM Error:", json);
                return null;
            }

            const route = json.routes[0];
            const coordinates = route.geometry.coordinates.map((c: number[]) => ({
                latitude: c[1],
                longitude: c[0]
            }));

            return {
                coordinates: coordinates as RouteStep[],
                distance: route.distance, // meters
                duration: route.duration  // seconds
            };
        } catch (error) {
            console.error("Navigation Fetch Error:", error);
            Alert.alert("Navigation Error", "Could not fetch route.");
            return null;
        }
    },

    /**
     * Generate Bots along the route
     * We pick random points from the route path and jitter them slightly
     */
    generateBots: (routeCoords: RouteStep[], count: number = 3): Bot[] => {
        const bots: Bot[] = [];
        if (routeCoords.length < 10) return bots;

        // Skip start and end
        const segmentSize = Math.floor(routeCoords.length / (count + 1));

        for (let i = 1; i <= count; i++) {
            const index = i * segmentSize;
            const point = routeCoords[index];
            if (!point) continue;

            // Jitter (approx 10-20 meters)
            const jitter = 0.0002;
            const lat = point.latitude + (Math.random() * jitter - jitter / 2);
            const lng = point.longitude + (Math.random() * jitter - jitter / 2);

            bots.push({
                id: `bot_${Date.now()}_${i}`,
                latitude: lat,
                longitude: lng,
                type: 'BOT',
                hp: 100,
                reward: {
                    xp: 50,
                    coins: 20 + Math.floor(Math.random() * 30) // 20-50 coins
                }
            });
        }
        return bots;
    }
};
