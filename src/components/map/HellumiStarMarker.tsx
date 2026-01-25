import React from 'react';
import { View, Text, Image } from 'react-native';
import { Marker, Callout } from 'react-native-maps';

export interface HellumiStar {
    id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
}

interface HellumiStarMarkerProps {
    spot: HellumiStar;
}

export const HellumiStarMarker = ({ spot }: HellumiStarMarkerProps) => {
    return (
        <Marker
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            title={spot.name}
            tracksViewChanges={false}
        >
            {/* Custom Gold Halloumi Icon */}
            <View className="items-center">
                <View className="w-10 h-10 bg-yellow-400 rounded-full border-2 border-white shadow-lg items-center justify-center transform rotate-45">
                    <Text className="transform -rotate-45 text-xl">🧀</Text>
                </View>
                <View className="bg-black/70 px-2 rounded-full mt-1">
                    <Text className="text-yellow-400 text-[8px] font-bold">STAR</Text>
                </View>
            </View>

            <Callout tooltip>
                <View className="w-56 bg-gray-900 rounded-xl p-4 border border-yellow-500 shadow-xl">
                    <View className="flex-row items-center mb-2">
                        <Text className="text-2xl mr-2">🧀</Text>
                        <Text className="text-white font-bold text-lg flex-1">{spot.name}</Text>
                    </View>
                    <Text className="text-gray-300 text-xs italic mb-3">"{spot.description}"</Text>

                    <View className="bg-yellow-500 py-2 rounded-lg items-center">
                        <Text className="text-black font-bold text-xs uppercase">Navigate</Text>
                    </View>
                </View>
            </Callout>
        </Marker>
    );
};
