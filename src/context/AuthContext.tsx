// Authentication Context - Provides user auth state throughout the app
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export interface UserProfile {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    coins: number;
    gems: number;
    xp: number;
    level: number;
    energy: number;
    max_energy: number;
    health: number;
    max_health: number;
    faction: string | null;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // Create default profile if not exists
                if (error.code === 'PGRST116') {
                    const newProfile: Partial<UserProfile> = {
                        id: userId,
                        username: `player_${userId.substring(0, 8)}`,
                        display_name: 'New Player',
                        coins: 1000,
                        gems: 10,
                        xp: 0,
                        level: 1,
                        energy: 100,
                        max_energy: 100,
                        health: 100,
                        max_health: 100,
                    };

                    const { data: created, error: createError } = await supabase
                        .from('profiles')
                        .insert(newProfile)
                        .select()
                        .single();

                    if (!createError && created) {
                        setProfile(created as UserProfile);
                    }
                }
            } else {
                setProfile(data as UserProfile);
            }
        } catch (error) {
            console.error('Error in fetchProfile:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error as Error | null };
    };

    const signUp = async (email: string, password: string, username: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (!error && data.user) {
            // Create profile for new user
            await supabase.from('profiles').insert({
                id: data.user.id,
                username,
                display_name: username,
                coins: 1000,
                gems: 10,
                xp: 0,
                level: 1,
                energy: 100,
                max_energy: 100,
                health: 100,
                max_health: 100,
            });
        }

        return { error: error as Error | null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return { error: new Error('Not authenticated') };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (!error) {
            setProfile(prev => prev ? { ...prev, ...updates } : null);
        }

        return { error: error as Error | null };
    };

    const value: AuthContextType = {
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
