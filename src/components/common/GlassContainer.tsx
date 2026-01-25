import React from 'react';
import { View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { cssInterop } from 'nativewind';

cssInterop(BlurView, {
    className: 'style',
});

interface GlassContainerProps {
    children: React.ReactNode;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    style?: ViewStyle;
    className?: string; // Outer container class
    contentContainerClassName?: string; // Inner view class
    rounded?: string; // Optional override for roundedness
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
    children,
    intensity = 50,
    tint = 'dark', // Default to dark for Cheapshot vibe
    style,
    className = "",
    contentContainerClassName = "p-4", // Default padding, can be overridden
    rounded = "rounded-3xl" // Default rounded, can be overridden
}) => {
    return (
        <BlurView
            intensity={intensity}
            tint={tint}
            className={`overflow-hidden border border-white/10 ${rounded} ${className}`}
            style={style}
        >
            <View className={`bg-black/10 ${contentContainerClassName}`}>
                {children}
            </View>
        </BlurView>
    );
};
