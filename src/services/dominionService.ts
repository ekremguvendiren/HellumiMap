import { supabase } from './supabase';
import { Alert } from 'react-native';

const INTERACTION_RADIUS = 200; // meters
const ATTACK_RADIUS = 400; // meters

// Building Tier System (Per Game Spec)
export const BUILDING_TIERS = {
    TENT: { emoji: '⛺', cost: 200, income: 20, hp: 100, minLevel: 1 },
    HOUSE: { emoji: '🏠', cost: 1000, income: 100, hp: 600, minLevel: 5 },
    TOWER: { emoji: '🏢', cost: 5000, income: 600, hp: 2500, minLevel: 15 },
    PALACE: { emoji: '👑', cost: 20000, income: 2500, hp: 10000, minLevel: 40 },
} as const;

export type BuildingTier = keyof typeof BUILDING_TIERS;

export interface UserBuilding {
    id: string;
    user_id: string;
    tier: BuildingTier;
    health: number;
    latitude: number;
    longitude: number;
    last_collected_at: string;
    ruined_until: string | null;
    stored_rent: number; // Accumulates over time, player must collect
    level?: number; // Legacy field, use tier instead
}

export interface Monument {
    id: string;
    name: string;
    lat: number;
    lng: number;
    health: number;
    max_health: number;
    ruined_until?: string | null;
    emoji: string;
    owner_id?: string | null;
    captured_at?: string | null;
    tax_expires_at?: string | null;
}

export interface GasStation {
    id: string;
    name: string;
    lat: number;
    lng: number;
}

export interface InventoryItem {
    id: string;
    user_id?: string;
    item_name: string;
    item_type: 'SWORD' | 'SHIELD' | 'BATTERY' | 'POTION';
    power_value: number | null;
    is_equipped: boolean | null;
    created_at?: string;
}

export const DominionService = {
    // --- Helper: Get Emojis (Based on Tier) ---
    getBuildingEmoji: (tier: BuildingTier) => {
        return BUILDING_TIERS[tier]?.emoji || '⛺';
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
            console.error('[getBuildings] Error:', error);
            return [];
        }

        const mapped = data.map((b: any) => {
            // Priority: lat/lng columns (these are populated), fallback to latitude/longitude
            let finalLat = b.lat ?? b.latitude;
            let finalLng = b.lng ?? b.longitude;

            // If there's a PostGIS location string, parse it
            if (typeof b.location === 'string' && b.location.includes('POINT')) {
                const coords = b.location.replace('POINT(', '').replace(')', '').split(' ');
                finalLng = parseFloat(coords[0]);
                finalLat = parseFloat(coords[1]);
            }

            // Return with explicit latitude/longitude for map markers
            return {
                ...b,
                latitude: finalLat,
                longitude: finalLng
            };
        });

        return mapped;
    },

    /**
     * Place a new building with tier-based cost/HP
     */
    placeBuilding: async (userId: string, lat: number, lon: number, tier: BuildingTier = 'TENT') => {
        const tierData = BUILDING_TIERS[tier];
        const energyCost = 20;

        // 1. Fetch profile for validation
        const { data: profile } = await supabase.from('profiles').select('coins, energy, level').eq('id', userId).single();
        if (!profile) return false;

        // 2. Check Level Requirement
        if ((profile.level || 1) < tierData.minLevel) {
            Alert.alert("Level Too Low", `${tier} requires Level ${tierData.minLevel}. You are Level ${profile.level}.`);
            return false;
        }

        // 3. Check Cost
        if (profile.coins < tierData.cost) {
            Alert.alert("Insufficient Funds", `${tier} costs ${tierData.cost} 💰. You have ${profile.coins}.`);
            return false;
        }

        // 4. Check Energy
        if ((profile.energy || 0) < energyCost) {
            Alert.alert("Exhausted", "Not enough Energy (Need 20⚡).");
            return false;
        }

        // 5. Insert Building
        const { error } = await supabase.from('user_buildings').insert({
            user_id: userId,
            lat: lat,
            lng: lon,
            tier: tier,
            health: tierData.hp,
            stored_rent: 0
        });

        if (error) {
            Alert.alert("Build Error", error.message);
            return false;
        }

        // 6. Deduct Coins & Energy
        await supabase.from('profiles').update({
            coins: profile.coins - tierData.cost,
            energy: profile.energy - energyCost
        }).eq('id', userId);

        Alert.alert("Built! 🏗️", `${tierData.emoji} ${tier} constructed!\nIncome: ${tierData.income} 💰/hr`);
        return true;
    },

    /**
     * Collect Income (Coins/XP) - Uses tier-based income rates
     */
    collectIncome: async (userId: string, building: UserBuilding, userLat: number, userLon: number) => {
        // 1. Check Distance (200m radius)
        const dist = DominionService.getDistance(userLat, userLon, building.latitude, building.longitude);
        if (dist > INTERACTION_RADIUS) {
            Alert.alert("Too Far", `Must be within ${INTERACTION_RADIUS}m to collect rent.`);
            return;
        }

        // 2. Check Energy
        const { data: profile } = await supabase.from('profiles').select('energy, coins, xp').eq('id', userId).single();
        if ((profile?.energy || 0) < 5) {
            Alert.alert("No Energy", "Need 5⚡ to collect.");
            return;
        }

        // 3. Calculate Income (Tier-based)
        const tierData = BUILDING_TIERS[building.tier] || BUILDING_TIERS.TENT;
        const now = new Date();
        const last = new Date(building.last_collected_at);
        const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

        if (diffHours < 0.1) { // Min 6 mins
            Alert.alert("Wait", "Rent accumulates over time.");
            return;
        }

        // Income: tierData.income per hour
        const coinsEarned = Math.floor(tierData.income * diffHours);
        const xpEarned = Math.floor(tierData.income * 0.1 * diffHours); // 10% of income as XP

        // 4. Update Building
        await supabase.from('user_buildings').update({
            last_collected_at: now.toISOString(),
            stored_rent: 0 // Reset stored rent after collection
        }).eq('id', building.id);

        // 5. Update Profile
        if (profile) {
            await supabase.from('profiles').update({
                coins: profile.coins + coinsEarned,
                xp: profile.xp + xpEarned,
                energy: (profile.energy || 100) - 5
            }).eq('id', userId);
        }

        Alert.alert("Rent Collected! 💰", `+${coinsEarned} Halloumi Coins\n+${xpEarned} XP`);
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

        // Fetch Weapon Power
        const { data: weapon } = await supabase
            .from('inventory')
            .select('power')
            .eq('user_id', attackerId)
            .eq('is_equipped', true)
            .eq('item_type', 'SWORD')
            .single();

        const weaponPower = weapon?.power || 0;

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
            // Building is ruined - attacker can loot stored_rent (handled separately)
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
        // 1. Check Range (100m - Siege Range)
        const dist = DominionService.getDistance(userLat, userLon, monument.lat, monument.lng);
        if (dist > 100) {
            Alert.alert("Too Far", "Must be within 100m to Siege!");
            return;
        }

        // 2. Check Peace Shield
        if (monument.ruined_until && new Date(monument.ruined_until) > new Date()) {
            Alert.alert("Protected 🛡️", "This monument is under Peace Shield.");
            return;
        }

        // 2. Execute Attack (RPC preferred for atomicity)
        const damageAmount = 500 + Math.floor(Math.random() * 200); // Heavy Siege Damage

        const { data: rpcData, error: rpcError } = await supabase.rpc('attack_monument', {
            attacker_id: attackerId,
            monument_id: monument.id,
            damage_amount: damageAmount
        });

        if (!rpcError && rpcData) {
            if (rpcData.success) {
                if (rpcData.is_victory) {
                    Alert.alert("VICTORY! 🏆", "You Liberated the Monument!\n\n+5000 Halloumi Coins 💰\n+2000 XP 🌟\nBadge: Liberator");
                    return { damage: damageAmount, isRuined: true };
                } else {
                    return { damage: damageAmount, isRuined: false, remaining: rpcData.remaining_health };
                }
            } else {
                Alert.alert("Error", rpcData.message);
                return;
            }
        }

        // Fallback Client Logic (If RPC missing)
        // Check Energy
        const { data: profile } = await supabase.from('profiles').select('energy').eq('id', attackerId).single();
        if ((profile?.energy || 0) < 5) {
            Alert.alert("Exhausted", "Need 5⚡ to Siege.");
            return;
        }

        // Deduct Energy
        await supabase.from('profiles').update({ energy: (profile?.energy || 0) - 5 }).eq('id', attackerId);

        let newHp = monument.health - damageAmount;
        let isVictory = false;

        if (newHp <= 0) {
            isVictory = true;
            newHp = 10000; // Reset

            // Rewards
            await supabase.rpc('increment_player_stats', {
                user_id: attackerId,
                add_coins: 5000,
                add_xp: 2000
            });

            // Peace Shield
            const shieldTime = new Date();
            shieldTime.setHours(shieldTime.getHours() + 1);

            await supabase.from('monuments').update({
                health: 10000,
                ruined_until: shieldTime.toISOString()
            }).eq('id', monument.id);

            Alert.alert("VICTORY! 🏆", "You Liberated the Monument!\n\n+5000 Halloumi Coins 💰\n+2000 XP 🌟");
        } else {
            await supabase.from('monuments').update({ health: newHp }).eq('id', monument.id);
        }

        return { damage: damageAmount, isRuined: isVictory, remaining: newHp };
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
        const dist = DominionService.getDistance(userLat, userLon, station.lat, station.lng);
        if (dist > INTERACTION_RADIUS) {
            Alert.alert("Too Far", `Drive within ${INTERACTION_RADIUS}m to refill.`);
            return false;
        }

        // 2. Check Coins (Cost: 100)
        const { data: profile } = await supabase.from('profiles').select('coins').eq('id', userId).single();
        if (!profile || profile.coins < 100) {
            Alert.alert("Insufficient Funds", "Fuel costs 100 Halloumi Coins 💰.");
            return false;
        }

        // 3. Deduct Coins & Apply Boost
        const { error } = await supabase.from('profiles').update({
            coins: profile.coins - 100,
            // active_boost_until: new Date(Date.now() + 3600000).toISOString() // Future enhancement
        }).eq('id', userId);

        if (error) {
            Alert.alert("Error", "Transaction failed.");
            return false;
        }

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
        Alert.alert("Treasure Found! 📦", "You found 500 Halloumi Coins 💰 + 1 Rare Item!");
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
     * Drop Item (Called when Bot defeated) - 25% chance per spec
     */
    dropItemChance: async (userId: string) => {
        // 25% drop chance per game spec
        if (Math.random() > 0.25) return null;

        const types = ['SWORD', 'SHIELD', 'BATTERY', 'REPAIR_KIT', 'ENERGY_DRINK'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Power varies by item type
        let power = 10;
        if (type === 'SWORD') power = Math.floor(Math.random() * 30) + 20; // 20-50 damage
        if (type === 'SHIELD') power = Math.floor(Math.random() * 20) + 10; // 10-30 defense
        if (type === 'REPAIR_KIT') power = 100; // Heals 100 HP
        if (type === 'ENERGY_DRINK') power = 50; // +50 energy
        if (type === 'BATTERY') power = 25; // +25 energy

        const { data, error } = await supabase.from('inventory').insert({
            user_id: userId,
            item_name: type,
            item_type: type,
            power_value: power
        }).select().single();

        if (error) {
            console.error("Drop Item Error", error);
            return null;
        }

        return data;
    },

    /**
     * Equip an item (Unequip others of same type if needed, or just toggle)
     * MVP: Simple toggle. 
     */
    toggleEquipItem: async (userId: string, itemId: string, isEquipped: boolean) => {
        // If equipping, ideally unequip others? Keeping simple for now.
        const { error } = await supabase.from('inventory').update({ is_equipped: !isEquipped }).eq('id', itemId);
        return !error;
    }
};
