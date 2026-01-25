import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../common/GlassContainer';
import { calculateNextLevelXp } from '../../utils/gamification';

interface PlayerDashboardModalProps {
    visible: boolean;
    onClose: () => void;
    user: any;
}

const TABS = ['Food', 'Mods', 'Bots', 'Other'];

export const PlayerDashboardModal: React.FC<PlayerDashboardModalProps> = ({ visible, onClose, user }) => {
    const [activeTab, setActiveTab] = useState('Food');

    // MOCK DATA for Inventory/Mods
    const FOOD_ITEMS = [
        { id: 1, name: 'Single malt scotch', effect: 'Heals +300💚', charges: 6, icon: '🥃' },
        { id: 2, name: 'Burger', effect: 'Heals +100💚', charges: 3, icon: '🍔' },
        { id: 3, name: 'Energy Drink', effect: 'Speed +10%', charges: 1, icon: '⚡' },
    ];

    const MOD_ITEMS = [
        { id: 1, name: 'Coin magnet', effect: 'Base stealing +219%', active: true, icon: '🧲' },
        { id: 2, name: 'Coin magnet', effect: 'Base stealing +225%', active: true, icon: '🧲' },
        { id: 3, name: 'Shield Generator', effect: 'Defense +50%', active: false, icon: '🛡️' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'Food':
                return (
                    <ScrollView className="flex-1 px-4 pt-4">
                        {FOOD_ITEMS.map((item) => (
                            <View key={item.id} className="flex-row items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mb-2">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-black/30 rounded-lg items-center justify-center mr-3 border border-white/10">
                                        <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                                    </View>
                                    <View>
                                        <Text className="font-bold text-gray-100 text-lg">{item.name}</Text>
                                        <Text className="text-green-400 font-semibold">{item.effect}</Text>
                                        <Text className="text-gray-500 text-xs">{item.charges} charges</Text>
                                    </View>
                                </View>
                                <TouchableOpacity className="bg-green-600/80 px-6 py-2 rounded-full border border-green-500/30 active:bg-green-600">
                                    <Text className="text-white font-bold uppercase shadow-sm">Drink</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                );
            case 'Mods':
                return (
                    <ScrollView className="flex-1 px-4 pt-4">
                        <View className="flex-row items-center justify-between bg-green-900/20 border border-green-500/30 p-3 rounded-xl mb-4">
                            <View className="flex-row items-center">
                                <Ionicons name="construct-outline" size={24} color="#4ade80" />
                                <View className="ml-3">
                                    <Text className="font-bold text-green-100">Fuse mods</Text>
                                    <Text className="text-green-400/70 text-xs">Create better mods!</Text>
                                </View>
                            </View>
                            <TouchableOpacity className="bg-green-500/20 px-4 py-1.5 rounded-full border border-green-500/50">
                                <Text className="text-green-400 font-bold">Open</Text>
                            </TouchableOpacity>
                        </View>

                        {MOD_ITEMS.map((item) => (
                            <View key={item.id} className="flex-row items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mb-2">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-10 h-10 bg-black/30 rounded-full items-center justify-center mr-3 border border-white/10">
                                        <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                                    </View>
                                    <View>
                                        <Text className="font-bold text-gray-100 text-lg">{item.name}</Text>
                                        <Text className="text-gray-400 text-xs">{item.effect}</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={item.active}
                                    trackColor={{ false: "#3f3f46", true: "#22c55e" }}
                                    thumbColor={"white"}
                                />
                            </View>
                        ))}
                    </ScrollView>
                );
            default:
                return (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-gray-600 font-bold text-xl">Coming Soon</Text>
                    </View>
                );
        }
    };

    const nextLevelXp = calculateNextLevelXp(user?.level || 1);
    const xpNeeded = Math.max(0, nextLevelXp - (user?.xp || 0));

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 justify-end">
                {/* Backdrop Touch to Close */}
                <TouchableOpacity className="absolute inset-0 bg-black/60" onPress={onClose} />

                <GlassContainer intensity={95} className="h-[85%] rounded-t-[32px] overflow-hidden bg-slate-900/95 border-t border-white/15">
                    {/* Header */}
                    <View className="pt-6 pb-4 px-6 border-b border-white/5">
                        {/* Drag Handle */}
                        <View className="w-12 h-1 bg-white/20 rounded-full self-center mb-6" />

                        <View className="flex-row justify-between items-start mb-6">
                            <View className="flex-row items-center">
                                <View className="w-16 h-16 bg-black/40 rounded-full border-2 border-white/10 items-center justify-center shadow-lg mr-4">
                                    <Text style={{ fontSize: 32 }}>{user?.emoji_avatar || '👽'}</Text>
                                </View>
                                <View>
                                    <Text className="text-2xl font-black text-white tracking-wide">{user?.username || 'Player'}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <View className="bg-blue-600 px-2 py-0.5 rounded text-xs mr-2 shadow-sm">
                                            <Text className="text-white font-bold text-[10px]">Lvl {user?.level || 1}</Text>
                                        </View>
                                        <Text className="text-amber-400 text-xs font-bold tracking-wide">⭐ {xpNeeded} XP to level-up</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity onPress={onClose} className="bg-white/10 p-2 rounded-full active:bg-white/20">
                                <Ionicons name="close" size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Status Circles (Health & Regen) */}
                        <View className="flex-row space-x-4 mb-2">
                            <View className="w-24 h-24 rounded-full border-4 border-green-500/20 bg-black/20 items-center justify-center">
                                <Text className="text-green-500 font-bold text-xs">💚 Health</Text>
                                <Text className="text-white font-black text-2xl shadow-sm">{user?.health || 100}</Text>
                            </View>
                            <View className="w-24 h-24 rounded-full border-4 border-green-400/20 bg-black/20 items-center justify-center">
                                <Text className="text-green-400 font-bold text-xs">+💚/min</Text>
                                <Text className="text-white font-black text-2xl shadow-sm">5</Text>
                            </View>

                            {/* Quick Stats Bars */}
                            <View className="flex-1 justify-center space-y-3">
                                <View className="flex-row items-center">
                                    <View className="flex-1 h-2 bg-gray-700 rounded-full mr-2 overflow-hidden">
                                        <View className="w-[20%] h-full bg-red-500 shadow-sm" />
                                    </View>
                                    <Text className="text-xs font-bold w-8 text-gray-300">⚔️10</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View className="flex-1 h-2 bg-gray-700 rounded-full mr-2 overflow-hidden">
                                        <View className="w-[5%] h-full bg-blue-400 shadow-sm" />
                                    </View>
                                    <Text className="text-xs font-bold w-8 text-gray-300">🛡️0</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View className="flex-1 h-2 bg-gray-700 rounded-full mr-2 overflow-hidden">
                                        <View style={{ width: `${Math.min(user?.energy || 100, 100)}%` }} className="h-full bg-yellow-400 shadow-sm" />
                                    </View>
                                    <Text className="text-xs font-bold w-8 text-gray-300">⚡{user?.energy || 100}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View className="flex-row bg-black/20 mx-4 mt-4 p-1 rounded-xl">
                        {TABS.map(tab => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === tab ? 'bg-white/10 shadow-sm' : ''}`}
                            >
                                <Text className={`font-bold ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tab Content */}
                    <View className="flex-1">
                        {renderContent()}
                    </View>
                </GlassContainer>
            </View>
        </Modal>
    );
};
