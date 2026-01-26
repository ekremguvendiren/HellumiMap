import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, SafeAreaView, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { GlassContainer } from '../components/common/GlassContainer';
import { COLORS } from '../constants/colors';

// ONLY FACES: Animals, Humans, Fantasy, Robots (No Flags, No Vehicles)
const AVATARS = [
    '😎', '🤠', '🥳', '🤯', '🦁', '🦊',
    '🐱', '🐶', '🐯', '🐼', '🐨', '🐷',
    '👽', '🤖', '💀', '👻', '🧜‍♀️', '🧛‍♂️',
    '🦄', '🐲', '🐙', '🦖', '🦍', '🦅'
];

export const ProfileSetupScreen = () => {
    const navigation = useNavigation<any>();
    const [nickname, setNickname] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [customAvatar, setCustomAvatar] = useState('');
    const [loading, setLoading] = useState(false);

    // Use current selection logic
    const finalAvatar = customAvatar.length > 0 ? customAvatar : selectedAvatar;

    const handleStartGame = async () => {
        if (!nickname.trim()) {
            Alert.alert('Required', 'Please enter a nickname.');
            return;
        }

        setLoading(true);
        try {
            // 1. Robust Auth Check
            let { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Retry getting session if user object is null (common Supabase edge case on signup)
                const { data: { session } } = await supabase.auth.getSession();
                user = session?.user || null;

                if (!user) throw new Error("No authenticated user found. Please Login again.");
            }

            // 2. Insert or Upsert Profile
            // We use user.id which is guaranteed to exist now
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: nickname,
                    emoji_avatar: finalAvatar,
                    coins: 1000, // Welcome Bonus
                    energy: 100, // Full Energy Tank
                    xp: 0,
                    level: 1,
                    joined_at: new Date().toISOString()
                });

            if (error) throw error;

            console.log("Profile created! Navigating to Main...");

            // 3. Navigate and Reset Stack
            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });

        } catch (error: any) {
            console.error("Profile Setup Error:", error);
            Alert.alert('Error', error.message || 'Failed to setup profile.');

            // If auth is truly missing, redirect to login
            if (error.message.includes("No authenticated user")) {
                await supabase.auth.signOut();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-900">
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

                    {/* LOGO */}
                    <View className="items-center mb-8 mt-4">
                        <Image
                            source={require('../../assets/hellumi_logo.png')}
                            style={{ width: 100, height: 100, borderRadius: 25, marginBottom: 16 }}
                            resizeMode="contain"
                        />
                        <Text className="text-3xl font-bold text-white mb-2">Welcome! 👋</Text>
                        <Text className="text-gray-400 text-center">Let's set up your profile.</Text>
                    </View>

                    <GlassContainer className="p-6">

                        {/* Nickname Input */}
                        <Text className="text-gray-400 mb-2 font-bold">Nickname</Text>
                        <TextInput
                            className="bg-black/30 text-white p-4 rounded-xl mb-6 border border-white/10 text-lg font-bold"
                            placeholder="HalloumiHunter"
                            placeholderTextColor="#6b7280"
                            value={nickname}
                            onChangeText={setNickname}
                            maxLength={15}
                        />

                        {/* Custom Avatar Input */}
                        <Text className="text-gray-400 mb-2 font-bold">Your Avatar</Text>
                        <View className="flex-row items-center mb-6 space-x-4">
                            <View className="w-20 h-20 rounded-full bg-orange-500 items-center justify-center border-4 border-white shadow-lg">
                                <Text className="text-5xl">{finalAvatar}</Text>
                            </View>

                            <View className="flex-1">
                                <Text className="text-gray-500 text-xs mb-1">TYPE YOUR OWN:</Text>
                                <TextInput
                                    className="bg-black/30 text-white p-3 rounded-lg border border-white/10 text-center text-xl"
                                    placeholder="Type Emoji..."
                                    placeholderTextColor="#6b7280"
                                    value={customAvatar}
                                    onChangeText={(text) => setCustomAvatar(text.slice(-2))} // Limit length
                                    maxLength={2}
                                />
                            </View>
                        </View>

                        {/* Preset Selection */}
                        <Text className="text-gray-400 mb-2 text-xs uppercase font-bold">Or Pick a Face</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {AVATARS.map((avatar) => (
                                <TouchableOpacity
                                    key={avatar}
                                    onPress={() => {
                                        setSelectedAvatar(avatar);
                                        setCustomAvatar(''); // Clear custom
                                    }}
                                    className={`w-14 h-14 items-center justify-center rounded-full mb-3 ${selectedAvatar === avatar && customAvatar === '' ? 'bg-orange-500 border-2 border-white' : 'bg-white/5'}`}
                                >
                                    <Text className="text-3xl">{avatar}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={handleStartGame}
                            disabled={loading}
                            className={`mt-6 p-4 rounded-xl items-center ${loading ? 'bg-gray-600' : 'bg-orange-500'}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-xl">Start Playing 🚀</Text>
                            )}
                        </TouchableOpacity>

                    </GlassContainer>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};
