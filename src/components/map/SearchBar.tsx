import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../common/GlassContainer';

interface SearchResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
}

interface SearchBarProps {
    onPlaceSelected: (details: { lat: number, lng: number, name: string }) => void;
}

export const SearchBar = ({ onPlaceSelected }: SearchBarProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                await searchPlaces(query);
            } else {
                setResults([]);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    const searchPlaces = async (text: string) => {
        setLoading(true);
        try {
            // Nominatim API: Free OpenStreetMap Search
            // Requires User-Agent header
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=cy&addressdetails=1&limit=5`,
                {
                    headers: {
                        'User-Agent': 'HellumiMap/1.0'
                    }
                }
            );
            const data = await response.json();
            setResults(data);
            setShowResults(true);
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: SearchResult) => {
        setQuery(item.display_name.split(',')[0]); // Show only main name
        setShowResults(false);
        onPlaceSelected({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            name: item.display_name
        });
    };

    return (
        <View className="absolute top-12 left-4 right-4 z-50">
            <GlassContainer className="px-4 py-2 bg-black/40 border border-white/10 rounded-2xl">
                <View className="flex-row items-center h-10">
                    <Ionicons name="search" size={20} color="white" style={{ marginRight: 8 }} />
                    <TextInput
                        className="flex-1 text-white text-base h-full"
                        placeholder="Where to? (Nereye?)"
                        placeholderTextColor="#9ca3af"
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => setShowResults(true)}
                    />
                    {loading && <ActivityIndicator size="small" color="white" />}
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                            <Ionicons name="close-circle" size={18} color="gray" />
                        </TouchableOpacity>
                    )}
                </View>
            </GlassContainer>

            {/* Results List */}
            {showResults && results.length > 0 && (
                <View className="mt-2 bg-gray-900/90 rounded-xl border border-white/10 overflow-hidden shadow-xl">
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.place_id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="px-4 py-3 border-b border-gray-800 flex-row items-center"
                                onPress={() => handleSelect(item)}
                            >
                                <Ionicons name="location-outline" size={16} color="#d1d5db" style={{ marginRight: 10 }} />
                                <Text className="text-gray-200 text-sm flex-1" numberOfLines={1}>
                                    {item.display_name}
                                </Text>
                            </TouchableOpacity>
                        )}
                        keyboardShouldPersistTaps="handled"
                    />
                </View>
            )}
        </View>
    );
};
