// Building Management Service for Geopolitical Simulation
import { supabase } from './supabase';

export interface UserBuilding {
    id: string;
    user_id: string;
    building_type: 'house' | 'factory' | 'solar_farm' | 'wind_turbine' | 'ev_station' | 'battery_storage';
    level: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    lat: number;
    lng: number;
    name: string;
    production_rate: number;
    last_collected_at: string;
    stored_rent: number;
    created_at: string;
}

export interface BuildingType {
    id: string;
    name: string;
    emoji: string;
    baseCost: number;
    baseProduction: number;
    description: string;
    category: 'residential' | 'industrial' | 'energy' | 'infrastructure';
}

// Building configurations with tier multipliers
export const BUILDING_TYPES: Record<string, BuildingType> = {
    house: {
        id: 'house',
        name: 'House',
        emoji: '🏠',
        baseCost: 1000,
        baseProduction: 10,
        description: 'Generates passive income from residents',
        category: 'residential'
    },
    factory: {
        id: 'factory',
        name: 'Factory',
        emoji: '🏭',
        baseCost: 5000,
        baseProduction: 50,
        description: 'Industrial production facility',
        category: 'industrial'
    },
    solar_farm: {
        id: 'solar_farm',
        name: 'Solar Farm',
        emoji: '☀️',
        baseCost: 3000,
        baseProduction: 30,
        description: 'Clean energy production',
        category: 'energy'
    },
    wind_turbine: {
        id: 'wind_turbine',
        name: 'Wind Turbine',
        emoji: '💨',
        baseCost: 2500,
        baseProduction: 25,
        description: 'Wind power generator',
        category: 'energy'
    },
    ev_station: {
        id: 'ev_station',
        name: 'EV Station',
        emoji: '⚡',
        baseCost: 2000,
        baseProduction: 20,
        description: 'Electric vehicle charging station',
        category: 'infrastructure'
    },
    battery_storage: {
        id: 'battery_storage',
        name: 'Battery Storage',
        emoji: '🔋',
        baseCost: 4000,
        baseProduction: 40,
        description: 'Energy storage facility',
        category: 'energy'
    }
};

// Tier configurations
export const TIER_MULTIPLIERS: Record<string, { production: number; cost: number; color: string }> = {
    bronze: { production: 1.0, cost: 1.0, color: '#CD7F32' },
    silver: { production: 1.5, cost: 2.0, color: '#C0C0C0' },
    gold: { production: 2.0, cost: 4.0, color: '#FFD700' },
    platinum: { production: 3.0, cost: 8.0, color: '#E5E4E2' },
    diamond: { production: 5.0, cost: 16.0, color: '#B9F2FF' }
};

class BuildingService {
    // Get all buildings for a user
    async getUserBuildings(userId: string): Promise<UserBuilding[]> {
        const { data, error } = await supabase
            .from('user_buildings')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user buildings:', error);
            return [];
        }

        return data || [];
    }

    // Get buildings in a geographic area
    async getBuildingsInArea(
        minLat: number,
        maxLat: number,
        minLng: number,
        maxLng: number
    ): Promise<UserBuilding[]> {
        const { data, error } = await supabase
            .from('user_buildings')
            .select('*')
            .gte('lat', minLat)
            .lte('lat', maxLat)
            .gte('lng', minLng)
            .lte('lng', maxLng);

        if (error) {
            console.error('Error fetching buildings in area:', error);
            return [];
        }

        return data || [];
    }

    // Purchase a new building
    async purchaseBuilding(
        userId: string,
        buildingType: string,
        tier: string,
        lat: number,
        lng: number,
        name: string
    ): Promise<{ success: boolean; building?: UserBuilding; error?: string }> {
        const buildingConfig = BUILDING_TYPES[buildingType];
        const tierConfig = TIER_MULTIPLIERS[tier];

        if (!buildingConfig || !tierConfig) {
            return { success: false, error: 'Invalid building type or tier' };
        }

        const cost = buildingConfig.baseCost * tierConfig.cost;
        const productionRate = buildingConfig.baseProduction * tierConfig.production;

        // Check user balance
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return { success: false, error: 'Could not fetch user profile' };
        }

        if (profile.coins < cost) {
            return { success: false, error: `Not enough coins. Need ${cost}, have ${profile.coins}` };
        }

        // Deduct coins and create building in a transaction-like manner
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ coins: profile.coins - cost })
            .eq('id', userId);

        if (updateError) {
            return { success: false, error: 'Failed to deduct coins' };
        }

        const { data: building, error: insertError } = await supabase
            .from('user_buildings')
            .insert({
                user_id: userId,
                building_type: buildingType,
                tier,
                lat,
                lng,
                name,
                production_rate: productionRate,
                level: 1,
                stored_rent: 0,
                last_collected_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            // Refund coins if building creation failed
            await supabase
                .from('profiles')
                .update({ coins: profile.coins })
                .eq('id', userId);
            return { success: false, error: 'Failed to create building' };
        }

        return { success: true, building };
    }

    // Collect rent from a building
    async collectRent(buildingId: string, userId: string): Promise<{ success: boolean; amount?: number; error?: string }> {
        const { data: building, error: fetchError } = await supabase
            .from('user_buildings')
            .select('*')
            .eq('id', buildingId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !building) {
            return { success: false, error: 'Building not found' };
        }

        // Calculate accumulated rent
        const lastCollected = new Date(building.last_collected_at);
        const now = new Date();
        const hoursPassed = (now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60);
        const accumulatedRent = Math.floor(hoursPassed * building.production_rate) + (building.stored_rent || 0);

        if (accumulatedRent <= 0) {
            return { success: false, error: 'No rent to collect yet' };
        }

        // Update building and user coins
        const { error: updateBuildingError } = await supabase
            .from('user_buildings')
            .update({
                last_collected_at: now.toISOString(),
                stored_rent: 0
            })
            .eq('id', buildingId);

        if (updateBuildingError) {
            return { success: false, error: 'Failed to update building' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', userId)
            .single();

        const { error: updateCoinsError } = await supabase
            .from('profiles')
            .update({ coins: (profile?.coins || 0) + accumulatedRent })
            .eq('id', userId);

        if (updateCoinsError) {
            return { success: false, error: 'Failed to add coins' };
        }

        return { success: true, amount: accumulatedRent };
    }

    // Upgrade building tier
    async upgradeBuilding(buildingId: string, userId: string): Promise<{ success: boolean; building?: UserBuilding; error?: string }> {
        const { data: building, error: fetchError } = await supabase
            .from('user_buildings')
            .select('*')
            .eq('id', buildingId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !building) {
            return { success: false, error: 'Building not found' };
        }

        const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
        const currentTierIndex = tiers.indexOf(building.tier);

        if (currentTierIndex >= tiers.length - 1) {
            return { success: false, error: 'Building is already at maximum tier' };
        }

        const nextTier = tiers[currentTierIndex + 1];
        const buildingConfig = BUILDING_TYPES[building.building_type];
        const nextTierConfig = TIER_MULTIPLIERS[nextTier];
        const currentTierConfig = TIER_MULTIPLIERS[building.tier];

        const upgradeCost = buildingConfig.baseCost * (nextTierConfig.cost - currentTierConfig.cost);

        // Check user balance
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', userId)
            .single();

        if (profileError || !profile || profile.coins < upgradeCost) {
            return { success: false, error: `Not enough coins. Need ${upgradeCost}` };
        }

        // Deduct coins
        await supabase
            .from('profiles')
            .update({ coins: profile.coins - upgradeCost })
            .eq('id', userId);

        // Upgrade building
        const newProductionRate = buildingConfig.baseProduction * nextTierConfig.production;
        const { data: updatedBuilding, error: updateError } = await supabase
            .from('user_buildings')
            .update({
                tier: nextTier,
                production_rate: newProductionRate,
                level: building.level + 1
            })
            .eq('id', buildingId)
            .select()
            .single();

        if (updateError) {
            return { success: false, error: 'Failed to upgrade building' };
        }

        return { success: true, building: updatedBuilding };
    }

    // Calculate pending rent for a building
    calculatePendingRent(building: UserBuilding): number {
        const lastCollected = new Date(building.last_collected_at);
        const now = new Date();
        const hoursPassed = (now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60);
        return Math.floor(hoursPassed * building.production_rate) + (building.stored_rent || 0);
    }

    // Get building cost
    getBuildingCost(buildingType: string, tier: string): number {
        const buildingConfig = BUILDING_TYPES[buildingType];
        const tierConfig = TIER_MULTIPLIERS[tier];
        if (!buildingConfig || !tierConfig) return 0;
        return buildingConfig.baseCost * tierConfig.cost;
    }
}

export const buildingService = new BuildingService();
