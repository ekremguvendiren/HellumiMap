// Monument Capture & Tax Service for Geopolitical Simulation
import { supabase } from './supabase';

export interface Monument {
    id: string;
    name: string;
    lat: number;
    lng: number;
    health: number;
    max_health: number;
    emoji: string;
    owner_id: string | null;
    captured_at: string | null;
    tax_expires_at: string | null;
    created_at: string;
}

export interface AttackResult {
    success: boolean;
    damage?: number;
    monumentHealth?: number;
    captured?: boolean;
    error?: string;
}

export interface TaxPayment {
    success: boolean;
    amount?: number;
    newExpiry?: string;
    error?: string;
}

// Attack costs and configurations
const ATTACK_ENERGY_COST = 10;
const BASE_DAMAGE = 100;
const TAX_AMOUNT = 500; // Coins per day
const TAX_DURATION_HOURS = 24;
const CAPTURE_RADIUS_KM = 0.5; // Must be within 500m to interact

class MonumentService {
    // Get all monuments
    async getAllMonuments(): Promise<Monument[]> {
        const { data, error } = await supabase
            .from('monuments')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching monuments:', error);
            return [];
        }

        return data || [];
    }

    // Get monuments in a geographic area
    async getMonumentsInArea(
        minLat: number,
        maxLat: number,
        minLng: number,
        maxLng: number
    ): Promise<Monument[]> {
        const { data, error } = await supabase
            .from('monuments')
            .select('*')
            .gte('lat', minLat)
            .lte('lat', maxLat)
            .gte('lng', minLng)
            .lte('lng', maxLng);

        if (error) {
            console.error('Error fetching monuments in area:', error);
            return [];
        }

        return data || [];
    }

    // Get user's owned monuments
    async getUserMonuments(userId: string): Promise<Monument[]> {
        const { data, error } = await supabase
            .from('monuments')
            .select('*')
            .eq('owner_id', userId);

        if (error) {
            console.error('Error fetching user monuments:', error);
            return [];
        }

        return data || [];
    }

    // Attack a monument
    async attackMonument(
        monumentId: string,
        userId: string,
        userLat: number,
        userLng: number
    ): Promise<AttackResult> {
        // Fetch monument
        const { data: monument, error: monumentError } = await supabase
            .from('monuments')
            .select('*')
            .eq('id', monumentId)
            .single();

        if (monumentError || !monument) {
            return { success: false, error: 'Monument not found' };
        }

        // Check if user owns this monument
        if (monument.owner_id === userId) {
            return { success: false, error: 'Cannot attack your own monument' };
        }

        // Check distance
        const distance = this.calculateDistance(userLat, userLng, monument.lat, monument.lng);
        if (distance > CAPTURE_RADIUS_KM) {
            return { success: false, error: `Too far! Must be within ${CAPTURE_RADIUS_KM * 1000}m` };
        }

        // Check user energy
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('energy')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return { success: false, error: 'Could not fetch user profile' };
        }

        if ((profile.energy || 0) < ATTACK_ENERGY_COST) {
            return { success: false, error: `Not enough energy. Need ${ATTACK_ENERGY_COST}` };
        }

        // Deduct energy
        await supabase
            .from('profiles')
            .update({ energy: profile.energy - ATTACK_ENERGY_COST })
            .eq('id', userId);

        // Calculate damage (could be enhanced with user stats, weapons, etc.)
        const damage = BASE_DAMAGE;
        const newHealth = Math.max(0, monument.health - damage);
        const captured = newHealth === 0;

        // Update monument
        const updateData: Partial<Monument> = {
            health: captured ? monument.max_health : newHealth // Reset health on capture
        };

        if (captured) {
            updateData.owner_id = userId;
            updateData.captured_at = new Date().toISOString();
            updateData.tax_expires_at = null; // Remove previous tax
        }

        const { error: updateError } = await supabase
            .from('monuments')
            .update(updateData)
            .eq('id', monumentId);

        if (updateError) {
            return { success: false, error: 'Failed to update monument' };
        }

        // Award XP for attack
        await supabase.rpc('add_xp', { user_id: userId, amount: captured ? 100 : 10 });

        return {
            success: true,
            damage,
            monumentHealth: captured ? monument.max_health : newHealth,
            captured
        };
    }

    // Pay tax for a monument
    async payTax(monumentId: string, userId: string): Promise<TaxPayment> {
        const { data: monument, error: monumentError } = await supabase
            .from('monuments')
            .select('*')
            .eq('id', monumentId)
            .eq('owner_id', userId)
            .single();

        if (monumentError || !monument) {
            return { success: false, error: 'Monument not found or not owned by you' };
        }

        // Check user coins
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', userId)
            .single();

        if (profileError || !profile || profile.coins < TAX_AMOUNT) {
            return { success: false, error: `Not enough coins. Need ${TAX_AMOUNT}` };
        }

        // Deduct coins
        await supabase
            .from('profiles')
            .update({ coins: profile.coins - TAX_AMOUNT })
            .eq('id', userId);

        // Extend tax expiry
        const currentExpiry = monument.tax_expires_at ? new Date(monument.tax_expires_at) : new Date();
        const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()) + TAX_DURATION_HOURS * 60 * 60 * 1000);

        const { error: updateError } = await supabase
            .from('monuments')
            .update({ tax_expires_at: newExpiry.toISOString() })
            .eq('id', monumentId);

        if (updateError) {
            return { success: false, error: 'Failed to update tax' };
        }

        return {
            success: true,
            amount: TAX_AMOUNT,
            newExpiry: newExpiry.toISOString()
        };
    }

    // Collect tax income from owned monuments
    async collectTaxIncome(userId: string): Promise<{ success: boolean; total?: number; error?: string }> {
        const { data: monuments, error } = await supabase
            .from('monuments')
            .select('*')
            .eq('owner_id', userId)
            .not('tax_expires_at', 'is', null)
            .gt('tax_expires_at', new Date().toISOString());

        if (error) {
            return { success: false, error: 'Failed to fetch monuments' };
        }

        // Calculate income based on number of monuments and time owned
        const incomePerMonument = 50; // Coins per hour per monument
        const total = (monuments?.length || 0) * incomePerMonument;

        if (total > 0) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('coins')
                .eq('id', userId)
                .single();

            await supabase
                .from('profiles')
                .update({ coins: (profile?.coins || 0) + total })
                .eq('id', userId);
        }

        return { success: true, total };
    }

    // Check if tax is overdue and remove ownership
    async processOverdueTaxes(): Promise<void> {
        const { error } = await supabase
            .from('monuments')
            .update({
                owner_id: null,
                captured_at: null,
                tax_expires_at: null
            })
            .not('owner_id', 'is', null)
            .lt('tax_expires_at', new Date().toISOString());

        if (error) {
            console.error('Error processing overdue taxes:', error);
        }
    }

    // Calculate distance between two points in km (Haversine formula)
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    // Get monument status info
    getMonumentStatus(monument: Monument): {
        isOwned: boolean;
        healthPercent: number;
        taxStatus: 'paid' | 'due' | 'overdue' | 'none';
        hoursUntilTaxDue: number | null;
    } {
        const isOwned = monument.owner_id !== null;
        const healthPercent = (monument.health / monument.max_health) * 100;

        let taxStatus: 'paid' | 'due' | 'overdue' | 'none' = 'none';
        let hoursUntilTaxDue: number | null = null;

        if (isOwned && monument.tax_expires_at) {
            const expiry = new Date(monument.tax_expires_at);
            const now = new Date();
            const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (hoursLeft > 6) {
                taxStatus = 'paid';
            } else if (hoursLeft > 0) {
                taxStatus = 'due';
            } else {
                taxStatus = 'overdue';
            }
            hoursUntilTaxDue = Math.max(0, hoursLeft);
        }

        return { isOwned, healthPercent, taxStatus, hoursUntilTaxDue };
    }
}

export const monumentService = new MonumentService();
