import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ScrollView, SafeAreaView, TouchableOpacity, Alert, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GlassContainer } from '../components/common/GlassContainer';
import { COLORS } from '../constants/colors';
import { getTier, getTierProgress } from '../utils/gamification';
import { supabase } from '../services/supabase';
import Constants from 'expo-constants'; // For version

export const ProfileScreen = () => {
    const { t, i18n } = useTranslation();
    const [ghostMode, setGhostMode] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) setUserProfile(data);
        }
    };

    const USER = userProfile || { username: 'Loading...', xp: 0, level: 1, emoji_avatar: '😎' };

    const tier = getTier(USER.xp);
    const progress = getTierProgress(USER.xp, USER.level);

    const toggleGhostMode = () => setGhostMode(!ghostMode);

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        Alert.alert(t('common.success'), `Language changed to ${lang.toUpperCase()}`);
    };

    return (
        <View className="flex-1 bg-gray-100">
            <SafeAreaView className="flex-1">
                <ScrollView className="px-6 py-4">
                    <Text className="text-2xl font-bold text-deepsea mb-6">{t('profile.stats')}</Text>

                    {/* Header Card */}
                    <GlassContainer className="mb-6 p-4 items-center">
                        <View className="w-24 h-24 bg-gray-300 rounded-full mb-3 border-4 border-white shadow-sm items-center justify-center relative">
                            {/* Display current emoji or default */}
                            <Text className="text-4xl">{USER.emoji_avatar || '😎'}</Text>

                            {/* Edit Badge */}
                            <View className="absolute bottom-0 right-0 bg-deepsea rounded-full p-1 border-2 border-white">
                                <Text className="text-white text-xs">✏️</Text>
                            </View>
                        </View>
                        <Text className="text-xl font-bold text-gray-800">{USER.username}</Text>
                        <Text className="text-deepsea font-semibold">{tier.name}</Text>

                        {/* XP Progress */}
                        <View className="w-full mt-4">
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-xs text-gray-500">{USER.xp} XP</Text>
                                <Text className="text-xs text-gray-500">Next Tier</Text>
                            </View>
                            <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <View
                                    style={{ width: `${progress}%`, backgroundColor: tier.color }}
                                    className="h-full rounded-full"
                                />
                            </View>
                        </View>
                    </GlassContainer>

                    {/* Settings Section */}
                    <Text className="text-lg font-bold text-gray-700 mb-3">{t('profile.settings')}</Text>
                    <GlassContainer className="mb-6">
                        <View className="flex-row items-center justify-between py-2 border-b border-gray-100 pb-2 mb-2">
                            <View>
                                <Text className="font-semibold text-gray-800">{t('profile.ghost_mode')} 👻</Text>
                                <Text className="text-xs text-gray-500 w-48">Hide from map.</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#767577", true: COLORS.deepsea }}
                                thumbColor={ghostMode ? "#f4f3f4" : "#f4f3f4"}
                                onValueChange={toggleGhostMode}
                                value={ghostMode}
                            />
                        </View>

                        {/* Language Switcher */}
                        <View className="flex-row items-center justify-between py-2">
                            <Text className="font-semibold text-gray-800">{t('profile.language')} 🌐</Text>
                            <View className="flex-row space-x-2">
                                {['en', 'tr', 'el', 'ru'].map(lang => (
                                    <TouchableOpacity
                                        key={lang}
                                        onPress={() => changeLanguage(lang)}
                                        className={`px-3 py-1 rounded-md ${i18n.language === lang ? 'bg-deepsea' : 'bg-gray-200'}`}
                                    >
                                        <Text className={`font-bold ${i18n.language === lang ? 'text-white' : 'text-gray-600'}`}>
                                            {lang.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>


                        {/* Logout Button */}
                        <TouchableOpacity
                            onPress={async () => {
                                const { error } = await import('../services/supabase').then(m => m.supabase.auth.signOut());
                                if (error) Alert.alert("Error", error.message);
                            }}
                            className="flex-row items-center justify-center py-3 mt-2 border-t border-gray-100"
                        >
                            <Text className="text-red-500 font-bold">Log Out 🚪</Text>
                        </TouchableOpacity>
                    </GlassContainer>

                    {/* About App */}
                    <Text className="text-lg font-bold text-gray-700 mb-3">About App ℹ️</Text>
                    <GlassContainer className="mb-6 p-4">
                        <View className="flex-row justify-between mb-2">
                            <Text className="font-bold text-gray-600">Version</Text>
                            <Text className="text-gray-500">1.0.0 (Build 5)</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="font-bold text-gray-600">Developer</Text>
                            <Text className="text-gray-500">Ekrem Guvendiren</Text>
                        </View>
                        <View className="mt-4 border-t border-gray-100 pt-2">
                            <Text className="text-xs text-center text-gray-400">© 2024 Halloumi Map. All rights reserved.</Text>
                        </View>
                    </GlassContainer>

                    {/* Badges Gallery */}
                    <Text className="text-lg font-bold text-gray-700 mb-3">{t('profile.badges')}</Text>
                    <View className="flex-row flex-wrap justify-between">
                        {/* Mock Badges */}
                        {['Kyrenia', 'Nicosia'].map(region => (
                            <GlassContainer key={region} className="w-[48%] mb-4 items-center py-4">
                                <Text className="text-3xl mb-2">🏅</Text>
                                <Text className="font-bold text-gray-700">{region}</Text>
                                <Text className="text-xs text-gray-500">Week 42</Text>
                            </GlassContainer>
                        ))}
                        {/* Locked Badge */}
                        <GlassContainer className="w-[48%] mb-4 items-center py-4 opacity-50">
                            <Text className="text-3xl mb-2">🔒</Text>
                            <Text className="font-bold text-gray-700">Famagusta</Text>
                            <Text className="text-xs text-gray-500">Locked</Text>
                        </GlassContainer>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View >
    );
};
