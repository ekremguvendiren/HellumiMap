import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { GlassContainer } from '../common/GlassContainer';

interface PlayerCardProps {
    username: string;
    level: number;
    currentXP: number;
    nextLevelXP: number;
    avatarEmoji?: string;
    onPress?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    username,
    level,
    currentXP,
    nextLevelXP,
    avatarEmoji = '👤',
    onPress
}) => {
    const progress = Math.min(Math.max(currentXP / nextLevelXP, 0), 1);
    const xpRemaining = nextLevelXP - currentXP;
    const xpDisplay = xpRemaining > 1000000
        ? `${(xpRemaining / 1000000).toFixed(2)}M`
        : xpRemaining > 1000
            ? `${(xpRemaining / 1000).toFixed(1)}K`
            : xpRemaining.toString();

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            className="absolute bottom-10 left-4 right-4 z-50"
        >
            <GlassContainer intensity={80} className="rounded-full !border-0 bg-white">
                <View className="flex-row items-center pb-1">
                    {/* Avatar Circle */}
                    <View className="relative mr-3">
                        <View className="w-14 h-14 bg-gray-200 rounded-full items-center justify-center border-2 border-white shadow-sm">
                            <Text style={{ fontSize: 30 }}>{avatarEmoji}</Text>
                        </View>
                        {/* Level Badge */}
                        <View className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-6 h-6 items-center justify-center border border-white">
                            <Text className="text-white text-[10px] font-bold">{level}</Text>
                        </View>
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                        <View className="flex-row items-center">
                            <Text className="text-black font-extrabold text-lg mr-2">{username}</Text>
                            <View className="bg-blue-500 px-2 py-0.5 rounded-full">
                                <Text className="text-white text-[10px] font-bold">{level}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center">
                            <Text className="text-gray-500 text-xs font-semibold mr-1">⭐</Text>
                            <Text className="text-gray-600 text-xs font-bold">{xpDisplay} to level-up</Text>
                        </View>
                    </View>
                </View>

                {/* Progress Bar (Bottom Line) */}
                <View className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 w-full">
                    <View
                        style={{ width: `${progress * 100}%` }}
                        className="h-full bg-green-500"
                    />
                </View>
            </GlassContainer>
        </TouchableOpacity>
    );
};
