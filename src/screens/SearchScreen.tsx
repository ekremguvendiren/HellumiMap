import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../components/common/GlassContainer';
import { COLORS } from '../constants/colors';

// Mock Data for Search
const SEARCH_RESULTS = [
    { id: '1', name: 'Home', address: 'My Base', icon: 'home' },
    { id: '2', name: 'Work', address: 'Office', icon: 'briefcase' },
    { id: '3', name: 'Nicosia Old Town', address: 'Ledra Street', icon: 'location' },
    { id: '4', name: 'Ercan Airport', address: 'Tymbou', icon: 'airplane' },
    { id: '5', name: 'Kyrenia Harbour', address: 'Kyrenia', icon: 'boat' },
];

export const SearchScreen = () => {
    const navigation = useNavigation();
    const [query, setQuery] = useState('');

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="flex-row items-center p-4 border-b border-white/10 active:bg-white/5"
            onPress={() => {
                // Navigate back with result (placeholder)
                navigation.goBack();
            }}
        >
            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-4">
                <Ionicons name={item.icon as any} size={20} color={COLORS.neonCyan} />
            </View>
            <View className="flex-1">
                <Text className="text-white font-bold text-base">{item.name}</Text>
                <Text className="text-gray-400 text-xs">{item.address}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-900">
            <GlassContainer intensity={95} className="flex-1 bg-black/80 pt-12">
                {/* Header */}
                <View className="flex-row items-center px-4 pb-4 border-b border-white/10">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View className="flex-1 bg-white/10 flex-row items-center px-3 py-2 rounded-full border border-white/20">
                        <Ionicons name="search" size={20} color="gray" />
                        <TextInput
                            className="flex-1 ml-2 text-white font-bold text-base"
                            placeholder="Where to?"
                            placeholderTextColor="gray"
                            value={query}
                            onChangeText={setQuery}
                            autoFocus
                        />
                    </View>
                </View>

                {/* Results */}
                <FlatList
                    data={SEARCH_RESULTS.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                />
            </GlassContainer>
        </View>
    );
};
