import React from 'react';
import { View, Text, Image } from 'react-native';
import { GlassContainer } from '../common/GlassContainer';
import { COLORS } from '../../constants/colors';

interface GameHUDProps {
    coins: number;
    gems?: number;
    health?: number;
    maxHealth?: number;
    energy?: number;
    maxEnergy?: number;
    level?: number;
    backpackCount?: number;
    backpackCapacity?: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
    coins,
    gems = 0,
    health = 100,
    maxHealth = 100,
    energy = 100,
    maxEnergy = 100,
    level = 1,
    backpackCount = 0,
    backpackCapacity = 50
}) => {
    // Format large numbers (e.g. 9.3B)
    const formatNumber = (num: number) => {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <View className="absolute top-12 right-4 flex-row items-center space-x-2 z-50">
            {/* Stats Row */}
            <View className="flex-row items-center bg-black/60 rounded-full px-3 py-1 border border-white/10">
                {/* Level - Primary Stat */}
                <View className="flex-row items-center mr-3">
                    <Text className="text-lg mr-1">🌟</Text>
                    <Text className="text-yellow-400 font-bold text-xs">Lv.{level}</Text>
                </View>

                {/* Energy (Bolt) */}
                <View className="flex-row items-center mr-3">
                    <Text className="text-lg mr-1">⚡</Text>
                    <Text className="text-white font-bold text-xs">{formatNumber(energy)}</Text>
                </View>

                {/* Coins */}
                <View className="flex-row items-center mr-3">
                    <Text className="text-lg mr-1">💰</Text>
                    <Text className="text-white font-bold text-xs">{formatNumber(coins)}</Text>
                </View>

                {/* Health (Hearts) */}
                <View className="flex-row items-center mr-3">
                    <Text className="text-lg mr-1">💚</Text>
                    <Text className="text-white font-bold text-xs">{formatNumber(health)}</Text>
                </View>

                {/* Backpack */}
                <View className="flex-row items-center">
                    <Text className="text-lg mr-1">🎒</Text>
                    <Text className="text-white font-bold text-xs">{backpackCount}/{backpackCapacity}</Text>
                </View>
            </View>
        </View>
    );
};

