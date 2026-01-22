import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { GlassContainer } from '../components/common/GlassContainer';
import { COLORS } from '../constants/colors';
import { getTier } from '../utils/gamification';

// Mock Data (In real app, fetch from Supabase 'profiles' or 'weekly_wardens')
const MOCK_LEADERBOARD = [
    { id: '1', username: 'Mehmet88', xp: 12500, region: 'Kyrenia' }, // Legend
    { id: '2', username: 'SarahCy', xp: 4200, region: 'Nicosia' },   // Warden
    { id: '3', username: 'DriftKing', xp: 3800, region: 'Famagusta' },
    { id: '4', username: 'Tourist1', xp: 600, region: 'Paphos' },
    { id: '5', username: 'Newbie', xp: 120, region: 'Kyrenia' },
    { id: '6', username: 'User_6', xp: 90, region: 'Kyrenia' },
    { id: '7', username: 'User_7', xp: 80, region: 'Nicosia' },
    { id: '8', username: 'User_8', xp: 50, region: 'Famagusta' },
];

export const LeaderboardScreen = () => {
    const [activeTab, setActiveTab] = useState<'AllTime' | 'Kyrenia' | 'Nicosia' | 'Famagusta'>('Kyrenia');

    // Filter data
    const filteredData = activeTab === 'AllTime'
        ? MOCK_LEADERBOARD
        : MOCK_LEADERBOARD.filter(u => u.region === activeTab);

    const sortedData = [...filteredData].sort((a, b) => b.xp - a.xp);
    const top3 = sortedData.slice(0, 3);
    const rest = sortedData.slice(3);

    return (
        <View className="flex-1 bg-gray-100">
            <SafeAreaView className="flex-1">
                <View className="px-6 py-4 flex-1">
                    <Text className="text-2xl font-bold text-deepsea mb-4">District Wardens 🏆</Text>

                    {/* Tabs */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 max-h-12">
                        {['Kyrenia', 'Nicosia', 'Famagusta', 'AllTime'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 mr-2 rounded-full border ${activeTab === tab ? 'bg-deepsea border-deepsea' : 'bg-white border-gray-200'}`}
                            >
                                <Text className={`font-semibold ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}>
                                    {tab === 'AllTime' ? 'Global' : tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Top 3 Podium */}
                    {top3.length > 0 && (
                        <View className="flex-row justify-center items-end space-x-4 mb-4 h-48">
                            {/* 2nd Place */}
                            {top3[1] && (
                                <View className="items-center">
                                    <Text className="text-gray-500 font-bold mb-1">{top3[1].username}</Text>
                                    <View className="w-16 h-16 bg-gray-200 rounded-full mb-2 border-2 border-gray-300 items-center justify-center">
                                        <Text className="text-2xl">🥈</Text>
                                    </View>
                                    <View className="w-20 h-24 bg-white/50 rounded-t-lg items-center justify-center">
                                        <Text className="font-bold text-xl text-gray-600">2</Text>
                                    </View>
                                </View>
                            )}

                            {/* 1st Place - Golden Glow */}
                            {top3[0] && (
                                <View className="items-center z-10">
                                    <Text className="text-deepsea font-bold mb-1 text-lg">{top3[0].username}</Text>
                                    <View className="w-20 h-20 bg-yellow-100 rounded-full mb-2 border-4 border-yellow-400 items-center justify-center shadow-yellow-500/50 shadow-lg">
                                        <Text className="text-4xl">👑</Text>
                                    </View>
                                    <View className="w-24 h-32 bg-gradient-to-t from-yellow-100 to-white rounded-t-lg items-center justify-center shadow-xl border-t border-yellow-200">
                                        <Text className="font-bold text-4xl text-yellow-600">1</Text>
                                        <Text className="text-xs text-yellow-600 font-bold mt-1 line-clamp-1 p-1 text-center">
                                            {getTier(top3[0].xp).name}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* 3rd Place */}
                            {top3[2] && (
                                <View className="items-center">
                                    <Text className="text-gray-500 font-bold mb-1">{top3[2].username}</Text>
                                    <View className="w-16 h-16 bg-orange-100 rounded-full mb-2 border-2 border-orange-300 items-center justify-center">
                                        <Text className="text-2xl">🥉</Text>
                                    </View>
                                    <View className="w-20 h-20 bg-white/50 rounded-t-lg items-center justify-center">
                                        <Text className="font-bold text-2xl text-orange-600">3</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* List */}
                    <ScrollView className="space-y-3 flex-1">
                        {rest.map((user, index) => {
                            const rank = index + 4;
                            const tier = getTier(user.xp);
                            return (
                                <GlassContainer key={user.id} className="flex-row items-center justify-between py-3 px-4 mb-2">
                                    <View className="flex-row items-center space-x-3">
                                        <Text className="font-bold text-gray-500 w-6 text-center">{rank}</Text>
                                        <View className="w-10 h-10 bg-gray-200 rounded-full justify-center items-center">
                                            <Text className="text-xs font-bold text-gray-700">{tier.name[0]}</Text>
                                        </View>
                                        <View>
                                            <Text className="font-semibold text-gray-800">{user.username}</Text>
                                            <Text className="text-xs" style={{ color: tier.color }}>{tier.name}</Text>
                                        </View>
                                    </View>
                                    <Text className="font-bold text-deepsea">{user.xp.toLocaleString()} XP</Text>
                                </GlassContainer>
                            )
                        })}
                        <View className="h-10" />
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
};
