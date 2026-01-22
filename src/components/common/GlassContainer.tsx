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
    style?: ViewStyle;
    className?: string; // For Tailwind classes
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
    children,
    intensity = 50,
    style,
    className = ""
}) => {
    return (
        <BlurView
            intensity={intensity}
            tint="light"
            className={`overflow-hidden rounded-3xl border border-white/20 ${className}`}
            style={style}
        >
            <View className="bg-white/10 p-4">
                {children}
            </View>
        </BlurView>
    );
};
