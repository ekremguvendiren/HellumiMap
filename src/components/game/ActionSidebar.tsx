import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GlassContainer } from '../common/GlassContainer';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface ActionSidebarProps {
    onGiftsPress: () => void;
    onLeaderboardPress: () => void;
    onChatPress?: () => void;
    unreadGifts?: number;
}

export const ActionSidebar: React.FC<ActionSidebarProps> = ({
    onGiftsPress,
    onLeaderboardPress,
    onChatPress,
    unreadGifts = 0
}) => {
    return (
        <View className="absolute right-4 top-40 z-40 space-y-4">
            {/* Gifts / Inventory */}
            <TouchableOpacity onPress={onGiftsPress}>
                <GlassContainer intensity={90} className="w-14 h-14 rounded-full items-center justify-center bg-black/80 border border-white/20 shadow-xl overflow-visible">
                    <Text style={{ fontSize: 24, lineHeight: 28, textAlign: 'center', includeFontPadding: false }}>🎒</Text>
                    {unreadGifts > 0 && (
                        <View className="absolute -top-1 -right-1 bg-red-600 w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm z-50">
                            <Text className="text-white text-[10px] font-bold">{unreadGifts}</Text>
                        </View>
                    )}
                </GlassContainer>
            </TouchableOpacity>

            {/* Leaderboard */}
            <TouchableOpacity onPress={onLeaderboardPress}>
                <GlassContainer intensity={90} className="w-14 h-14 rounded-full items-center justify-center bg-black/80 border border-white/20 shadow-xl">
                    <Text style={{ fontSize: 24, lineHeight: 28, textAlign: 'center', includeFontPadding: false }}>🏆</Text>
                </GlassContainer>
            </TouchableOpacity>

            <TouchableOpacity onPress={onChatPress}>
                <GlassContainer intensity={90} className="w-14 h-14 rounded-full items-center justify-center bg-black/80 border border-white/20 shadow-xl">
                    <Text style={{ fontSize: 24, lineHeight: 28, textAlign: 'center', includeFontPadding: false }}>🌍</Text>
                </GlassContainer>
            </TouchableOpacity>
        </View>
    );
};
