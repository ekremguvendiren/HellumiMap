import { supabase } from './supabase';
import { calculateNextLevelXp, COIN_REWARDS } from '../utils/gamification';

export interface Report {
    id: string;
    user_id: string;
    type: 'SPEED_CAMERA' | 'POLICE' | 'TRAFFIC' | 'HAZARD' | 'HELLUMI_SPOT' | 'ACCIDENT' | 'MAP_ISSUE' | 'GAS' | 'PLACE' | 'HELP';
    description?: string;
    location: any; // PostGIS point
    latitude: number; // Parsed for UI
    longitude: number; // Parsed for UI
    created_at: string;
    expires_at: string;
    verification_score: number;
}

export const ReportService = {
    /**
   * Fetch all fixed radars (All Island)
   */
    getFixedRadars: async () => {
        const { data, error } = await supabase
            .from('fixed_radars')
            .select('*');

        if (error) {
            console.error("Error fetching fixed radars:", error);
            return [];
        }
        return data;
    },

    /**
     * Fetch Hellumi Stars (Curated Spots)
     */
    getHellumiStars: async () => {
        const { data, error } = await supabase
            .from('hellumi_stars')
            .select('*');

        if (error) {
            console.error("Error fetching Hellumi Stars:", error);
            return [];
        }
        return data;
    },

    /**
     * Create a new report in Supabase
       * @param userId The ID of the reporting user
       * @param type The type of report
       * @param latitude Geo Lat
       * @param longitude Geo Long
       */
    async createReport(
        userId: string,
        type: 'SPEED_CAMERA' | 'POLICE' | 'TRAFFIC' | 'HAZARD' | 'HELLUMI_SPOT' | 'ACCIDENT' | 'MAP_ISSUE' | 'GAS' | 'PLACE' | 'HELP',
        latitude: number,
        longitude: number
    ) {
        // Determine Region (Mocking logic for now)
        const regionName = "General";

        const { data, error } = await supabase
            .from('reports')
            .insert({
                user_id: userId,
                type,
                region_name: regionName,
                // PostGIS Format: POINT(long lat) - Note the order!
                location: `POINT(${longitude} ${latitude})`
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating report:', error);
            throw error;
        }

        // --- Gamification Logic Start ---
        try {
            // 1. Calculate XP
            let xpReward = 0;
            switch (type) {
                case 'POLICE': xpReward = 15; break;
                case 'SPEED_CAMERA': xpReward = 15; break;
                case 'HAZARD': xpReward = 15; break;
                case 'ACCIDENT': xpReward = 20; break;
                case 'TRAFFIC': xpReward = 10; break;
                case 'HELLUMI_SPOT': xpReward = 50; break; // High reward for custom spots
                case 'GAS': xpReward = 5; break;
                case 'MAP_ISSUE': xpReward = 15; break;
                case 'PLACE': xpReward = 5; break;
                case 'HELP': xpReward = 25; break; // Help requests get more
                default: xpReward = 5;
            }

            // 2. Calculate Coins (20% Random Chance)
            let coinReward = 0;
            if (Math.random() < 0.2) {
                // Random between 5-10
                coinReward = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
            }

            // 3. Update User Profile
            if (xpReward > 0 || coinReward > 0) {
                // Fetch current user data to calc level
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('xp, level, coins')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    let newXp = (profile.xp || 0) + xpReward;
                    let newCoins = (profile.coins || 0) + coinReward;
                    let currentLevel = profile.level || 1;



                    // Level Up Formula: Level^2 * 500
                    const xpNeeded = calculateNextLevelXp(currentLevel);

                    if (newXp >= xpNeeded) {
                        currentLevel += 1;
                        newCoins += COIN_REWARDS.LEVEL_UP_BONUS; // Bonus 1000 Coins
                        // We rely on client (MapScreen) to detect this change and show animation
                    }

                    await supabase
                        .from('profiles')
                        .update({
                            xp: newXp,
                            coins: newCoins,
                            level: currentLevel
                        })
                        .eq('id', userId);
                }
            }
        } catch (rewardError) {
            console.error("Error distributing rewards:", rewardError);
            // Don't fail the report creation if reward fails
        }
        // --- Gamification Logic End ---

        return data;
    },

    /**
     * Fetch all active reports that haven't expired
     */
    async getActiveReports() {
        const { data, error } = await supabase
            .from('reports')
            .select(`
        *,
        profiles (username, current_tier, emoji_avatar)
      `)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }

        return data;
    }
};
