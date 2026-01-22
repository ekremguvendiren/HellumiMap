import React from 'react';
import { View, Text } from 'react-native';

interface XPProgressBarProps {
    currentXP: number;
    nextTierXP: number;
    tierName: string;
}

export const XPProgressBar = ({ currentXP, nextTierXP, tierName }: XPProgressBarProps) => {
    const progress = Math.min((currentXP / nextTierXP) * 100, 100);

    return (
        <View className="absolute top-28 left-4 right-4 z-40 items-center">
            {/* Glass pill for XP */}
            <View className="px-4 py-1 bg-black/60 rounded-full border border-white/10 flex-row items-center space-x-2">
                <Text className="text-yellow-400 font-bold text-xs">{tierName}</Text>

                {/* Bar Container */}
                <View className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </View>

                <Text className="text-white text-[10px] font-bold">{currentXP} / {nextTierXP} XP</Text>
            </View>
        </View>
    );
};
