import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { GlassContainer } from '../common/GlassContainer';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

interface AdminToolsModalProps {
    visible: boolean;
    onClose: () => void;
    user: any;
    onTeleport: (lat: number, lon: number) => void;
}

export const AdminToolsModal: React.FC<AdminToolsModalProps> = ({ visible, onClose, user, onTeleport }) => {
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');

    if (!visible) return null;

    const addMoney = async (amount: number) => {
        const { error } = await supabase.rpc('increment_player_stats', {
            user_id: user.id,
            add_coins: amount,
            add_xp: 0
        });
        if (error) {
            // Fallback
            await supabase.from('profiles').update({ coins: (user.coins || 0) + amount }).eq('id', user.id);
        }
        Alert.alert("Ka-ching! 💸", `Added ${amount} Coins.`);
        onClose();
    };

    const addXp = async (amount: number) => {
        await supabase.from('profiles').update({ xp: (user.xp || 0) + amount }).eq('id', user.id);
        Alert.alert("Brain Power! 🧠", `Added ${amount} XP.`);
        onClose();
    };

    const handleTeleport = () => {
        const l = parseFloat(lat);
        const lg = parseFloat(lon);
        if (!isNaN(l) && !isNaN(lg)) {
            onTeleport(l, lg);
            onClose();
        } else {
            Alert.alert("Invalid Coordinates");
        }
    }

    return (
        <View className="absolute inset-0 bg-black/80 items-center justify-center z-[100] p-6">
            <GlassContainer className="w-full max-w-md p-6 border-2 border-red-500/50">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-bold text-red-500">ADMIN PANEL 🛡️</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={32} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView>
                    <Text className="text-white font-bold mb-2">Economy Cheat Codes</Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        <TouchableOpacity onPress={() => addMoney(1000)} className="bg-green-600 p-3 rounded-lg flex-1">
                            <Text className="text-white font-bold text-center">+1K 💰</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => addMoney(50000)} className="bg-green-800 p-3 rounded-lg flex-1">
                            <Text className="text-white font-bold text-center">+50K 💰</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => addMoney(1000000)} className="bg-yellow-600 p-3 rounded-lg w-full mt-2">
                            <Text className="text-white font-bold text-center">MAKE IT RAIN (+1M) 💸</Text>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-white font-bold mb-2">Progression</Text>
                    <View className="flex-row gap-2 mb-6">
                        <TouchableOpacity onPress={() => addXp(5000)} className="bg-blue-600 p-3 rounded-lg flex-1">
                            <Text className="text-white font-bold text-center">+5K XP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => addXp(50000)} className="bg-blue-800 p-3 rounded-lg flex-1">
                            <Text className="text-white font-bold text-center">MAX LEVEL</Text>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-white font-bold mb-2">Teleportation Device</Text>
                    <View className="flex-row space-x-2 mb-2">
                        <TextInput
                            className="bg-white/10 text-white p-2 rounded flex-1"
                            placeholder="Lat (e.g. 35.123)"
                            placeholderTextColor="#666"
                            value={lat}
                            onChangeText={setLat}
                            keyboardType="numeric"
                        />
                        <TextInput
                            className="bg-white/10 text-white p-2 rounded flex-1"
                            placeholder="Lon (e.g. 33.123)"
                            placeholderTextColor="#666"
                            value={lon}
                            onChangeText={setLon}
                            keyboardType="numeric"
                        />
                    </View>
                    <TouchableOpacity onPress={handleTeleport} className="bg-purple-600 p-3 rounded-lg">
                        <Text className="text-white font-bold text-center">WARP 🌀</Text>
                    </TouchableOpacity>

                </ScrollView>
            </GlassContainer>
        </View>
    );
};
