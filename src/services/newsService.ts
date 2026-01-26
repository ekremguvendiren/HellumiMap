// World News Service - Global Event Feed
import { supabase } from './supabase';

export interface WorldNews {
    id: string;
    event_type: 'monument_captured' | 'building_constructed' | 'player_leveled' | 'territory_war' | 'market_event' | 'alliance_formed';
    title: string;
    description: string;
    actor_id: string | null;
    target_id: string | null;
    metadata: Record<string, unknown>;
    region: string | null;
    importance: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
}

export interface NewsFilter {
    eventTypes?: string[];
    region?: string;
    importance?: string[];
    limit?: number;
}

// Event type configurations
export const NEWS_EVENT_CONFIGS: Record<string, { emoji: string; color: string }> = {
    monument_captured: { emoji: '⚔️', color: '#FF4444' },
    building_constructed: { emoji: '🏗️', color: '#44AA44' },
    player_leveled: { emoji: '⬆️', color: '#4444FF' },
    territory_war: { emoji: '🔥', color: '#FF8800' },
    market_event: { emoji: '📊', color: '#AA44AA' },
    alliance_formed: { emoji: '🤝', color: '#44AAAA' }
};

class NewsService {
    // Get latest news
    async getLatestNews(limit: number = 50): Promise<WorldNews[]> {
        const { data, error } = await supabase
            .from('world_news')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching news:', error);
            return [];
        }

        return data || [];
    }

    // Get news with filters
    async getFilteredNews(filter: NewsFilter): Promise<WorldNews[]> {
        let query = supabase
            .from('world_news')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter.eventTypes && filter.eventTypes.length > 0) {
            query = query.in('event_type', filter.eventTypes);
        }

        if (filter.region) {
            query = query.eq('region', filter.region);
        }

        if (filter.importance && filter.importance.length > 0) {
            query = query.in('importance', filter.importance);
        }

        query = query.limit(filter.limit || 50);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching filtered news:', error);
            return [];
        }

        return data || [];
    }

    // Get news for a specific region
    async getRegionalNews(region: string, limit: number = 20): Promise<WorldNews[]> {
        const { data, error } = await supabase
            .from('world_news')
            .select('*')
            .eq('region', region)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching regional news:', error);
            return [];
        }

        return data || [];
    }

    // Get news involving a specific player
    async getPlayerNews(playerId: string, limit: number = 20): Promise<WorldNews[]> {
        const { data, error } = await supabase
            .from('world_news')
            .select('*')
            .or(`actor_id.eq.${playerId},target_id.eq.${playerId}`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching player news:', error);
            return [];
        }

        return data || [];
    }

    // Create news event (usually called from backend/triggers, but available for client-side)
    async createNewsEvent(event: Omit<WorldNews, 'id' | 'created_at'>): Promise<{ success: boolean; news?: WorldNews; error?: string }> {
        const { data, error } = await supabase
            .from('world_news')
            .insert(event)
            .select()
            .single();

        if (error) {
            console.error('Error creating news:', error);
            return { success: false, error: error.message };
        }

        return { success: true, news: data };
    }

    // Subscribe to real-time news
    subscribeToNews(onNewEvent: (news: WorldNews) => void): () => void {
        const subscription = supabase
            .channel('world_news_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'world_news'
                },
                (payload) => {
                    onNewEvent(payload.new as WorldNews);
                }
            )
            .subscribe();

        // Return unsubscribe function
        return () => {
            subscription.unsubscribe();
        };
    }

    // Get breaking news (high/critical importance from last 24 hours)
    async getBreakingNews(): Promise<WorldNews[]> {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('world_news')
            .select('*')
            .in('importance', ['high', 'critical'])
            .gte('created_at', oneDayAgo)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching breaking news:', error);
            return [];
        }

        return data || [];
    }

    // Format news for display
    formatNewsItem(news: WorldNews): {
        emoji: string;
        color: string;
        timeAgo: string;
    } {
        const config = NEWS_EVENT_CONFIGS[news.event_type] || { emoji: '📰', color: '#888888' };

        // Calculate time ago
        const created = new Date(news.created_at);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeAgo: string;
        if (diffMins < 1) {
            timeAgo = 'Just now';
        } else if (diffMins < 60) {
            timeAgo = `${diffMins}m ago`;
        } else if (diffHours < 24) {
            timeAgo = `${diffHours}h ago`;
        } else {
            timeAgo = `${diffDays}d ago`;
        }

        return {
            emoji: config.emoji,
            color: config.color,
            timeAgo
        };
    }
}

export const newsService = new NewsService();
