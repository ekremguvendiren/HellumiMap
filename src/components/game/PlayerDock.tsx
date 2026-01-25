import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { GlassContainer } from '../common/GlassContainer';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface PlayerDockProps {
    user: any;
    onPress: () => void;
    onSearchPress: () => void;
    onBuildPress: () => void;
}

export const PlayerDock: React.FC<PlayerDockProps> = ({ user, onPress, onSearchPress, onBuildPress }) => {
    // Format large numbers
    const formatNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <View className="absolute bottom-8 left-4 right-4 items-center justify-center z-50">
            <View className="flex-row items-center w-full max-w-sm">

                {/* 1. Avatar (Floating Outside) */}
                <TouchableOpacity onPress={onPress} className="z-20 mr-[-24px] shadow-2xl">
                    <View className="w-[72px] h-[72px] rounded-full bg-gray-900 border-2 border-green-500 items-center justify-center shadow-lg">
                        <Text style={{ fontSize: 36 }}>{user?.emoji_avatar || '👽'}</Text>
                    </View>
                </TouchableOpacity>

                {/* 2. Stats Pill (Glass Container) */}
                <GlassContainer intensity={80} className="flex-1 rounded-full flex-row items-center pl-8 pr-3 py-2 bg-black/60 border border-white/10 shadow-lg h-[64px]">

                    <View className="flex-1 justify-center ml-2">
                        <Text className="text-white font-black text-lg tracking-wider shadow-sm" numberOfLines={1}>
                            {user?.username || 'Player'}
                        </Text>
                        <View className="flex-row items-center space-x-3 mt-0.5">
                            <View className="flex-row items-center">
                                <Text className="text-green-400 text-xs font-bold mr-1">💚</Text>
                                <Text className="text-green-400 text-xs font-bold">
                                    {formatNumber(user?.health || 100)}
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-yellow-400 text-xs font-bold mr-1">💰</Text>
                                <Text className="text-yellow-400 text-xs font-bold">
                                    {formatNumber(user?.coins)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Right Action Buttons */}
                    <View className="flex-row items-center space-x-2">
                        {/* Build Button */}
                        <TouchableOpacity
                            onPress={onBuildPress}
                            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 items-center justify-center active:bg-white/20"
                        >
                            <Ionicons name="hammer" size={20} color="#FACC15" />
                        </TouchableOpacity>

                        {/* Search Button */}
                        <TouchableOpacity
                            onPress={onSearchPress}
                            className="w-10 h-10 rounded-full bg-blue-600/80 border border-blue-400/30 items-center justify-center shadow-lg active:bg-blue-500"
                        >
                            <Ionicons name="search" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                </GlassContainer>
            </View>
        </View>
    );
};
