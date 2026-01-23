import React from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { GlassContainer } from '../components/common/GlassContainer';

export const SafetyScreen = () => {
    const navigation = useNavigation<any>();

    const handleAgree = () => {
        // Navigate to Login or Map depending on auth flow
        // For now, we assume simple flow: Safety -> Login/Map
        navigation.replace('Login');
    };

    return (
        <View className="flex-1 bg-gray-900 justify-center items-center p-6">
            <SafeAreaView className="w-full max-w-md">
                <View className="items-center mb-10">
                    <Text className="text-6xl mb-4">⚠️</Text>
                    <Text className="text-3xl font-bold text-white text-center">STAY SAFE!</Text>
                    <Text className="text-gray-400 text-center mt-2">HellumiMap Protocol</Text>
                </View>

                <GlassContainer className="p-6">
                    <Text className="text-white font-bold text-lg mb-4 text-center">
                        This is a game, stay aware of your surroundings.
                    </Text>

                    <View className="space-y-4">
                        <View className="flex-row items-start">
                            <Text className="text-red-500 font-bold mr-2 text-xl">1.</Text>
                            <Text className="text-gray-200 flex-1 text-base">
                                Do not use your real name. Use a gamertag.
                            </Text>
                        </View>

                        <View className="flex-row items-start">
                            <Text className="text-red-500 font-bold mr-2 text-xl">2.</Text>
                            <Text className="text-gray-200 flex-1 text-base">
                                Never meet strangers in real life solely based on this app.
                            </Text>
                        </View>

                        <View className="flex-row items-start">
                            <Text className="text-red-500 font-bold mr-2 text-xl">3.</Text>
                            <Text className="text-gray-200 flex-1 text-base">
                                <Text className="font-bold text-red-400">DO NOT PLAY WHILE DRIVING.</Text> Keep your eyes on the road.
                            </Text>
                        </View>

                        <View className="flex-row items-start">
                            <Text className="text-red-500 font-bold mr-2 text-xl">4.</Text>
                            <Text className="text-gray-200 flex-1 text-base">
                                Respect restricted areas (UN Buffer Zone 🇺🇳, Military Areas 🪖). Do not trespass.
                            </Text>
                        </View>
                    </View>
                </GlassContainer>

                <TouchableOpacity
                    onPress={handleAgree}
                    className="mt-10 bg-red-600 p-4 rounded-xl shadow-lg items-center active:bg-red-700"
                >
                    <Text className="text-white font-bold text-xl tracking-wider">I AGREE</Text>
                </TouchableOpacity>

                <Text className="text-gray-600 text-center mt-6 text-xs">
                    By clicking "I Agree", you accept full responsibility for your actions.
                </Text>
            </SafeAreaView>
        </View>
    );
};
