import React, { useEffect } from 'react';
import { TouchableOpacity, Text, Alert, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../services/supabase';
import { useTranslation } from 'react-i18next';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// REPLACE WITH YOUR ACTUAL CLIENT IDS
const CONFIG = {
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
};

export const GoogleLogin = () => {
    const { t } = useTranslation();
    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: CONFIG.iosClientId,
        androidClientId: CONFIG.androidClientId,
        webClientId: CONFIG.webClientId,
        redirectUri: makeRedirectUri({
            scheme: 'hellumimap',
            path: 'auth/callback'
        })
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            signInWithSupabase(id_token);
        }
    }, [response]);

    const signInWithSupabase = async (idToken: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
            });

            if (error) throw error;

            // Check if profile exists, if not create default
            if (data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (!profile) {
                    // Create new profile
                    await supabase.from('profiles').insert({
                        id: data.user.id,
                        username: data.user.user_metadata.full_name || 'Traveler',
                        avatar_url: data.user.user_metadata.avatar_url,
                        xp: 0,
                        tier: 'Traveler'
                    });
                    // Here we would trigger the "Onboarding Modal" in the parent component
                }
            }

            Alert.alert("Welcome!", "Signed in with Google.");

        } catch (error: any) {
            Alert.alert("Login Error", error.message);
        }
    };

    return (
        <TouchableOpacity
            disabled={!request}
            onPress={() => promptAsync()}
            className="flex-row items-center justify-center bg-white border border-gray-300 py-3 px-4 rounded-xl shadow-sm space-x-2 w-full"
        >
            {/* Google Icon (Text for now) */}
            <Text className="text-xl">🇬</Text>
            <Text className="text-gray-700 font-bold text-base">{t('auth.google_continue')}</Text>
        </TouchableOpacity>
    );
};
