import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '../../constants/colors';
import { useTranslation } from 'react-i18next';

interface ReportFABProps {
    onReport: (type: 'POLICE' | 'SPEED_CAMERA' | 'HAZARD' | 'HELLUMI_SPOT' | 'ACCIDENT') => void;
}

export const ReportFAB = ({ onReport }: ReportFABProps) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    // Simple state-based visibility toggle for MVP (can be animated later)
    return (
        <View className="items-center">
            {expanded && (
                <View className="mb-3 space-y-3 items-center">
                    {/* Hellumi Spot */}
                    <TouchableOpacity
                        onPress={() => { onReport('HELLUMI_SPOT'); setExpanded(false); }}
                        className="bg-yellow-400 p-3 rounded-full shadow-lg flex-row items-center space-x-2"
                        style={{ width: 140 }}
                    >
                        <Text className="text-xl">🧀</Text>
                        <Text className="font-bold text-gray-900 text-xs ml-1">Hellumi Spot</Text>
                    </TouchableOpacity>

                    {/* Accident */}
                    <TouchableOpacity
                        onPress={() => { onReport('ACCIDENT'); setExpanded(false); }}
                        className="bg-red-600 p-3 rounded-full shadow-lg flex-row items-center"
                        style={{ width: 140 }}
                    >
                        <Text className="text-xl">💥</Text>
                        <Text className="font-bold text-white text-xs ml-2">Accident</Text>
                    </TouchableOpacity>

                    {/* Hazard */}
                    <TouchableOpacity
                        onPress={() => { onReport('HAZARD'); setExpanded(false); }}
                        className="bg-orange-500 p-3 rounded-full shadow-lg flex-row items-center"
                        style={{ width: 140 }}
                    >
                        <Text className="text-xl">🚧</Text>
                        <Text className="font-bold text-white text-xs ml-2">Hazard</Text>
                    </TouchableOpacity>

                    {/* Radar */}
                    <TouchableOpacity
                        onPress={() => { onReport('SPEED_CAMERA'); setExpanded(false); }}
                        className="bg-red-500 p-3 rounded-full shadow-lg flex-row items-center"
                        style={{ width: 140 }}
                    >
                        <Text className="text-xl">📷</Text>
                        <Text className="font-bold text-white text-xs ml-2">Radar</Text>
                    </TouchableOpacity>

                    {/* Police */}
                    <TouchableOpacity
                        onPress={() => { onReport('POLICE'); setExpanded(false); }}
                        className="bg-blue-500 p-3 rounded-full shadow-lg flex-row items-center"
                        style={{ width: 140 }}
                    >
                        <Text className="text-xl">👮</Text>
                        <Text className="font-bold text-white text-xs ml-2">Police</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Main FAB */}
            <TouchableOpacity
                className="h-16 w-16 rounded-full items-center justify-center shadow-lg border-4 border-white/20"
                style={{ backgroundColor: expanded ? COLORS.slate : COLORS.emergency }}
                onPress={() => setExpanded(!expanded)}
            >
                <Text className="text-white text-3xl font-bold">{expanded ? '×' : '+'}</Text>
            </TouchableOpacity>
        </View>
    );
};
