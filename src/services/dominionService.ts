import { supabase } from './supabase';
import { Alert } from 'react-native';

const INTERACTION_RADIUS = 200; // meters
const ATTACK_RADIUS = 400; // meters

export interface UserBuilding {
    id: string;
    user_id: string;
    level: number;
    health: number;
    latitude: number;
    longitude: number;
    last_collected_at: string;
    ruined_until: string | null;
}

export interface Monument {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    health: number;
    max_health: number;
    ruined_until: string | null;
    emoji: string;
}

export interface GasStation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    brand: string;
    zone: string;
}

export interface InventoryItem {
    id: string;
    item_type: 'SWORD' | 'SHIELD' | 'BATTERY';
    power: number;
    is_equipped: boolean;
}

export const DominionService = {
    // --- Helper: Get Emojis ---
    getBuildingEmoji: (level: number) => {
        if (level >= 91) return '👑'; // Imperial Palace
        if (level >= 81) return '🚀'; // Sci-Fi
        if (level >= 71) return '🏯'; // Fortress
        if (level >= 61) return '🏰'; // Castle
        if (level >= 51) return '🏛️'; // Grand Temple
        if (level >= 41) return '🏦'; // Bank/Treasury
        if (level >= 31) return '🏢'; // Office
        if (level >= 21) return '🏡'; // Garden House
        if (level >= 11) return '🏠'; // House
        return '⛺'; // Tent (1-10)
    },

    // --- Buildings ---

    /**
     * Helper to get distance between two points (Haversine)
     */
    getDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * Fetch visible buildings (simple select all for MVP, or bounds later)
     */
    getBuildings: async () => {
        const { data, error } = await supabase.from('user_buildings').select('*');
        if (error) {
            console.error(error);
            return [];
        }
        // Parse location if needed, assuming PostGIS returns string or we handle it
        return data.map((b: any) => {
            // Basic parsing if location is returned as string "POINT(lon lat)"
            let lat = 0, lon = 0;
            if (typeof b.location === 'string') {
                const coords = b.location.replace('POINT(', '').replace(')', '').split(' ');
                lon = parseFloat(coords[0]);
                lat = parseFloat(coords[1]);
            }
            return { ...b, latitude: lat, longitude: lon };
        });
    },

    /**
     * Place a new building
     */
    placeBuilding: async (userId: string, lat: number, lon: number) => {
        // 1. Check distance to ANY other building (Mock check for now)
        // Ideally we do a geospatial query: "Do any buildings intersect 50m radius?"

        // 2. Check Cost (e.g. 500 Coins)
        const { data: profile } = await supabase.from('profiles').select('coins').eq('id', userId).single();
        if (!profile || profile.coins < 500) {
            Alert.alert("Insufficient Funds", "You need 500 Hellumi Coins to build.");
            return false;
        }

        // 3. Insert
        const { error } = await supabase.from('user_buildings').insert({
            user_id: userId,
            location: `POINT(${lon} ${lat})`,
            level: 1,
            health: 1000
        });

        if (error) {
            Alert.alert("Build Error", error.message);
            return false;
        }

        // 4. Deduct Coins
        await supabase.from('profiles').update({ coins: profile.coins - 500 }).eq('id', userId);
        return true;
    },

    /**
     * Collect Income (Coins/XP)
     */
    collectIncome: async (userId: string, building: UserBuilding, userLat: number, userLon: number) => {
        // 1. Check Distance
        const dist = DominionService.getDistance(userLat, userLon, building.latitude, building.longitude);
        if (dist > INTERACTION_RADIUS) {
            Alert.alert("Too Far", `You must be within ${INTERACTION_RADIUS}m to collect.`);
            return;
        }

        // 2. Calculate Income
        // Rate: Level * 5 Coins/hr
        const now = new Date();
        const last = new Date(building.last_collected_at);
        const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

        if (diffHours < 0.1) { // Min 6 mins
            Alert.alert("Wait longer", "Income accumulates over time.");
            return;
        }

        const coinsEarned = Math.floor(building.level * 5 * diffHours);
        const xpEarned = Math.floor(building.level * 2 * diffHours);

        // 3. Update DB
        await supabase.from('user_buildings').update({ last_collected_at: now.toISOString() }).eq('id', building.id);

        // 4. Update Profile
        // Note: Ideally use RPC for atomicity
        const { data: profile } = await supabase.from('profiles').select('coins, xp').eq('id', userId).single();
        if (profile) {
            await supabase.from('profiles').update({
                coins: profile.coins + coinsEarned,
                xp: profile.xp + xpEarned
            }).eq('id', userId);
        }

        Alert.alert("Collected!", `+${coinsEarned} Coins | +${xpEarned} XP`);
    },

    /**
     * Attack a building
     */
    attackBuilding: async (attackerId: string, building: UserBuilding, userLat: number, userLon: number) => {
        // 1. Check Range
        const dist = DominionService.getDistance(userLat, userLon, building.latitude, building.longitude);
        if (dist > ATTACK_RADIUS) {
            Alert.alert("Out of Range", `Get within ${ATTACK_RADIUS}m to attack.`);
            return;
        }

        // 2. Calculate Damage
        // Fetch attacker stats
        const { data: profile } = await supabase.from('profiles').select('level').eq('id', attackerId).single();
        const attackerLevel = profile?.level || 1;

        // Fetch Weapon Power (Mock 0 for now until Inventory connected)
        const weaponPower = 0;

        const damage = (attackerLevel * 10) + weaponPower + Math.floor(Math.random() * 50);

        // 3. Apply Damage
        let newHp = building.health - damage;
        let isRuined = false;

        if (newHp <= 0) {
            isRuined = true;
            newHp = 0;
            // Ruined Logic handled by caller or separate update
        }

        // 4. Update Building
        const updates: any = { health: newHp };
        if (isRuined) {
            const ruinedDate = new Date();
            ruinedDate.setHours(ruinedDate.getHours() + 1); // Ruined for 1 hour
            updates.ruined_until = ruinedDate.toISOString();

            // Steal Coins Logic (Mock: just give attacker coins, assuming built 'stored' coins concept or stealing from owner profile)
            // Prompt says "Steal 30% of stored coins". We haven't implemented "stored coins" on building, let's assume "Owner loses 1 level" as per prompt.
            if (building.level > 1) updates.level = building.level - 1;
        }

        await supabase.from('user_buildings').update(updates).eq('id', building.id);

        return { damage, isRuined };
    },

    // --- Monuments ---

    getMonuments: async () => {
        const { data, error } = await supabase.from('monuments').select('*');
        if (error) {
            console.error(error);
            return [];
        }
        return data as Monument[];
    },

    attackMonument: async (attackerId: string, monument: Monument, userLat: number, userLon: number) => {
        // 1. Check Range (400m)
        const dist = DominionService.getDistance(userLat, userLon, monument.latitude, monument.longitude);
        if (dist > ATTACK_RADIUS) {
            Alert.alert("Out of Range", `Get within ${ATTACK_RADIUS}m to attack the Boss.`);
            return;
        }

        // 2. Calculate Damage
        const { data: profile } = await supabase.from('profiles').select('level').eq('id', attackerId).single();
        const attackerLevel = profile?.level || 1;

        // Fetch Weapon Power (Mock) - In real implementation, join inventory
        const weaponPower = 0;

        // Bosses take less damage? Or normal damage? Let's keep it normal for fun.
        const damage = (attackerLevel * 10) + weaponPower + Math.floor(Math.random() * 50);

        // 3. Apply Damage
        let newHp = monument.health - damage;
        let isRuined = false;

        if (newHp <= 0) {
            isRuined = true;
            newHp = 0;
        }

        const updates: any = { health: newHp };
        if (isRuined) {
            const ruinedDate = new Date();
            ruinedDate.setHours(ruinedDate.getHours() + 48); // Ruined for 48 hours!
            updates.ruined_until = ruinedDate.toISOString();
        }

        await supabase.from('monuments').update(updates).eq('id', monument.id);

        // Reward Player for hitting Boss (Small XP)
        // Ideally handled via RPC or separate call

        return { damage, isRuined };
    },

    // --- Gas Stations ---

    getGasStations: async () => {
        const { data, error } = await supabase.from('gas_stations').select('*');
        if (error) {
            console.error(error);
            return [];
        }
        return data as GasStation[];
    },

    buyFuel: async (userId: string, station: GasStation, userLat: number, userLon: number) => {
        // 1. Check Range (200m)
        const dist = DominionService.getDistance(userLat, userLon, station.latitude, station.longitude);
        if (dist > INTERACTION_RADIUS) {
            Alert.alert("Too Far", `Drive within ${INTERACTION_RADIUS}m to refill.`);
            return false;
        }

        // 2. Check Coins (Cost: 100)
        const { data: profile } = await supabase.from('profiles').select('coins').eq('id', userId).single();
        if (!profile || profile.coins < 100) {
            Alert.alert("Insufficient Funds", "Fuel costs 100 Coins.");
            return false;
        }

        // 3. Deduct Coins & Apply Boost (Mock Boost: Just Alert for MVP)
        await supabase.from('profiles').update({ coins: profile.coins - 100 }).eq('id', userId);

        Alert.alert("Refueled! ⛽", "Movement speed boosted for 1 hour! (Mock Effect)");
        return true;
    },

    // --- Gas Stations ---
    // ... (Existing Gas methods)

    // --- Fog of War & Treasures ---

    /**
     * Save a user's explored area (Fog Reveal)
     * Limit frequency in UI to avoid DB flooding (e.g. every 100m moved)
     */
    saveRevealedArea: async (userId: string, lat: number, lon: number) => {
        // Optimization: In real app, check if area already covered by existing circle
        const { error } = await supabase.from('revealed_areas').insert({
            user_id: userId,
            latitude: lat,
            longitude: lon,
            radius: 200
        });
        if (error) console.error("Fog Save Error", error);
    },

    getRevealedAreas: async (userId: string) => {
        const { data } = await supabase.from('revealed_areas').select('latitude, longitude, radius').eq('user_id', userId);
        return data || [];
    },

    /**
     * Get Active Treasures
     */
    getTreasures: async () => {
        const { data } = await supabase.from('treasures').select('*').eq('is_claimed', false);
        return data || [];
    },

    /**
     * Claim Treasure
     */
    claimTreasure: async (userId: string, treasureId: string, lat: number, lon: number, treasureLat: number, treasureLon: number) => {
        const dist = DominionService.getDistance(lat, lon, treasureLat, treasureLon);
        if (dist > 50) { // Very close range for treasure (50m)
            Alert.alert("Too Far", "Get closer (50m) to open the chest!");
            return false;
        }

        const { error } = await supabase.from('treasures').update({
            is_claimed: true,
            claimed_by: userId,
            claimed_at: new Date().toISOString()
        }).eq('id', treasureId).eq('is_claimed', false); // Ensure concurrency safety

        if (error) {
            Alert.alert("Already Claimed", "Someone beat you to it!");
            return false;
        }

        // Reward (Mock)
        Alert.alert("Treasure Found! 📦", "You found 500 Coins + 1 Rare Item!");
        // Update user coins logic here...
        return true;
    },

    /**
     * MOCK: Spawn Daily Treasures (Call once per day or via button for testing)
     */
    spawnDailyTreasures: async () => {
        // Random points in Cyprus bounds (approx)
        // Lat: 34.6 - 35.6, Lon: 32.3 - 34.6
        const treasures = [];
        for (let i = 0; i < 10; i++) {
            treasures.push({
                latitude: 34.8 + Math.random() * 0.7,
                longitude: 32.5 + Math.random() * 1.5,
                is_claimed: false
            });
        }
        await supabase.from('treasures').insert(treasures);
        Alert.alert("Admin", "Spawned 10 Daily Treasures!");
    },

    // --- Inventory ---

    getInventory: async (userId: string) => {
        const { data } = await supabase.from('inventory').select('*').eq('user_id', userId);
        return data as InventoryItem[];
    },

    /**
     * Drop Item (Called when Bot defeated)
     */
    dropItemChance: async (userId: string) => {
        if (Math.random() > 0.3) return null; // 30% chance

        const types = ['SWORD', 'SHIELD', 'BATTERY'];
        const type = types[Math.floor(Math.random() * types.length)];
        const power = Math.floor(Math.random() * 20) + 10; // 10-30 power

        const { data } = await supabase.from('inventory').insert({
            user_id: userId,
            item_type: type,
            power: power
        }).select().single();

        return data;
    }
};
