// Quest and Achievement Service
import { supabase } from './supabase';

// Types
export interface Quest {
    id: string;
    name: string;
    description: string;
    emoji: string;
    quest_type: 'collect_rent' | 'attack_monument' | 'make_report' | 'travel_distance' | 'login';
    target_value: number;
    coin_reward: number;
    xp_reward: number;
}

export interface QuestProgress {
    id: string;
    quest_id: string;
    current_value: number;
    completed: boolean;
    claimed: boolean;
    quest?: Quest;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    emoji: string;
    requirement_type: string;
    requirement_value: number;
    xp_reward: number;
}

export interface UserAchievement {
    id: string;
    achievement_id: string;
    unlocked_at: string;
    achievement?: Achievement;
}

export interface Faction {
    id: string;
    name: string;
    emoji: string;
    color: string;
    description: string;
    member_count: number;
    total_xp: number;
}

class QuestService {
    // === DAILY QUESTS ===

    async getDailyQuests(): Promise<Quest[]> {
        const { data, error } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching daily quests:', error);
            return [];
        }
        return data || [];
    }

    async getUserQuestProgress(userId: string): Promise<QuestProgress[]> {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('user_quest_progress')
            .select('*, quest:daily_quests(*)')
            .eq('user_id', userId)
            .eq('reset_date', today);

        if (error) {
            console.error('Error fetching quest progress:', error);
            return [];
        }
        return data || [];
    }

    async initDailyQuests(userId: string): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const quests = await this.getDailyQuests();

        for (const quest of quests) {
            await supabase
                .from('user_quest_progress')
                .upsert({
                    user_id: userId,
                    quest_id: quest.id,
                    current_value: 0,
                    completed: false,
                    claimed: false,
                    reset_date: today
                }, { onConflict: 'user_id,quest_id,reset_date' });
        }
    }

    async updateQuestProgress(
        userId: string,
        questType: string,
        incrementBy: number = 1
    ): Promise<{ completed: boolean; quest?: Quest }> {
        const today = new Date().toISOString().split('T')[0];

        // Find matching quest
        const { data: quests } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('quest_type', questType)
            .eq('is_active', true);

        if (!quests || quests.length === 0) return { completed: false };

        const quest = quests[0] as Quest;

        // Get current progress
        const { data: progress } = await supabase
            .from('user_quest_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('quest_id', quest.id)
            .eq('reset_date', today)
            .single();

        const currentValue = (progress?.current_value || 0) + incrementBy;
        const completed = currentValue >= quest.target_value;

        // Update progress
        await supabase
            .from('user_quest_progress')
            .upsert({
                user_id: userId,
                quest_id: quest.id,
                current_value: currentValue,
                completed,
                claimed: progress?.claimed || false,
                reset_date: today
            }, { onConflict: 'user_id,quest_id,reset_date' });

        return { completed: completed && !progress?.completed, quest: completed ? quest : undefined };
    }

    async claimQuestReward(userId: string, questId: string): Promise<{ success: boolean; coins?: number; xp?: number }> {
        const today = new Date().toISOString().split('T')[0];

        // Get progress and quest
        const { data: progress } = await supabase
            .from('user_quest_progress')
            .select('*, quest:daily_quests(*)')
            .eq('user_id', userId)
            .eq('quest_id', questId)
            .eq('reset_date', today)
            .single();

        if (!progress || !progress.completed || progress.claimed) {
            return { success: false };
        }

        const quest = progress.quest as Quest;

        // Mark as claimed
        await supabase
            .from('user_quest_progress')
            .update({ claimed: true })
            .eq('id', progress.id);

        // Award rewards
        const { data: profile } = await supabase
            .from('profiles')
            .select('coins, xp')
            .eq('id', userId)
            .single();

        await supabase
            .from('profiles')
            .update({
                coins: (profile?.coins || 0) + quest.coin_reward,
                xp: (profile?.xp || 0) + quest.xp_reward
            })
            .eq('id', userId);

        return { success: true, coins: quest.coin_reward, xp: quest.xp_reward };
    }

    // === ACHIEVEMENTS ===

    async getAllAchievements(): Promise<Achievement[]> {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .order('requirement_value');

        if (error) {
            console.error('Error fetching achievements:', error);
            return [];
        }
        return data || [];
    }

    async getUserAchievements(userId: string): Promise<UserAchievement[]> {
        const { data, error } = await supabase
            .from('user_achievements')
            .select('*, achievement:achievements(*)')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching user achievements:', error);
            return [];
        }
        return data || [];
    }

    async checkAndUnlockAchievements(
        userId: string,
        stats: { buildings_owned?: number; monuments_captured?: number; level_reached?: number; reports_made?: number }
    ): Promise<Achievement[]> {
        const achievements = await this.getAllAchievements();
        const unlocked = await this.getUserAchievements(userId);
        const unlockedIds = new Set(unlocked.map(u => u.achievement_id));

        const newlyUnlocked: Achievement[] = [];

        for (const achievement of achievements) {
            if (unlockedIds.has(achievement.id)) continue;

            let value = 0;
            switch (achievement.requirement_type) {
                case 'buildings_owned': value = stats.buildings_owned || 0; break;
                case 'monuments_captured': value = stats.monuments_captured || 0; break;
                case 'level_reached': value = stats.level_reached || 0; break;
                case 'reports_made': value = stats.reports_made || 0; break;
            }

            if (value >= achievement.requirement_value) {
                // Unlock achievement
                await supabase.from('user_achievements').insert({
                    user_id: userId,
                    achievement_id: achievement.id
                });

                // Award XP
                await supabase.rpc('add_xp', { user_id: userId, amount: achievement.xp_reward });

                newlyUnlocked.push(achievement);
            }
        }

        return newlyUnlocked;
    }

    // === FACTIONS ===

    async getAllFactions(): Promise<Faction[]> {
        const { data, error } = await supabase
            .from('factions')
            .select('*')
            .order('total_xp', { ascending: false });

        if (error) {
            console.error('Error fetching factions:', error);
            return [];
        }
        return data || [];
    }

    async joinFaction(userId: string, factionId: string): Promise<{ success: boolean; error?: string }> {
        // Check current faction
        const { data: profile } = await supabase
            .from('profiles')
            .select('faction_id')
            .eq('id', userId)
            .single();

        if (profile?.faction_id) {
            // Leave old faction
            await supabase.rpc('decrement_faction_members', { faction_id: profile.faction_id });
        }

        // Join new faction
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ faction_id: factionId })
            .eq('id', userId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        // Increment member count
        await supabase
            .from('factions')
            .update({ member_count: supabase.rpc('increment', { x: 1 }) })
            .eq('id', factionId);

        return { success: true };
    }

    async getUserFaction(userId: string): Promise<Faction | null> {
        const { data: profile } = await supabase
            .from('profiles')
            .select('faction_id')
            .eq('id', userId)
            .single();

        if (!profile?.faction_id) return null;

        const { data: faction } = await supabase
            .from('factions')
            .select('*')
            .eq('id', profile.faction_id)
            .single();

        return faction;
    }
}

export const questService = new QuestService();
