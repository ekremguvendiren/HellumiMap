import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { GlassContainer } from '../common/GlassContainer';

interface WazeSearchBarProps {
    onFocus: () => void;
    placeholder?: string;
    leftComponent?: React.ReactNode;
}

export const WazeSearchBar: React.FC<WazeSearchBarProps> = ({
    onFocus,
    placeholder = "Where to?",
    leftComponent
}) => {
    return (
        <View className="absolute bottom-0 w-full bg-gray-900 pt-4 pb-8 px-4 border-t border-white/10 rounded-t-3xl flex-row items-center z-50">

            {/* Left Button (e.g., My Waze / Avatar) */}
            {leftComponent && (
                <View className="mr-3">
                    {leftComponent}
                </View>
            )}

            {/* Search Input Area */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onFocus}
                className="flex-1 bg-gray-800 h-14 rounded-full flex-row items-center px-5 border border-white/5"
            >
                <Text className="text-2xl mr-3">🔍</Text>
                <Text className="text-gray-400 text-lg font-semibold">{placeholder}</Text>

                {/* Voice Icon (Right within input) */}
                <View className="absolute right-2 top-2 p-2 rounded-full bg-gray-700">
                    <Text className="text-xl">🎙️</Text>
                </View>
            </TouchableOpacity>

        </View>
    );
};
