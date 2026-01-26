import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { GlassContainer } from '../common/GlassContainer';
import { DominionService, InventoryItem } from '../../services/dominionService';
import { COLORS } from '../../constants/colors';

interface BackpackModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string;
}

export const BackpackModal = ({ visible, onClose, userId }: BackpackModalProps) => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) loadInventory();
    }, [visible]);

    const loadInventory = async () => {
        setLoading(true);
        const inv = await DominionService.getInventory(userId);
        setItems(inv || []);
        setLoading(false);
    };

    const handleEquip = async (item: InventoryItem) => {
        const success = await DominionService.toggleEquipItem(userId, item.id, item.is_equipped ?? false);
        if (success) {
            // Optimistic update or reload
            loadInventory();
            Alert.alert(item.is_equipped ? "Unequipped" : "Equipped", `${item.item_type} updated.`);
        } else {
            Alert.alert("Error", "Could not update equipment.");
        }
    };

    const renderItem = ({ item }: { item: InventoryItem }) => (
        <View className="flex-row items-center justify-between bg-white/10 p-3 rounded-lg mb-2 border border-white/20">
            <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center mr-3">
                    <Text className="text-xl">
                        {item.item_type === 'SWORD' ? '🗡️' :
                            item.item_type === 'SHIELD' ? '🛡️' :
                                item.item_type === 'POTION' ? '🧪' : '🔋'}
                    </Text>
                </View>
                <View>
                    <Text className="text-white font-bold">{item.item_type}</Text>
                    <Text className="text-gray-400 text-xs">Power: {item.power_value || 0}</Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={() => handleEquip(item)}
                className={`px-3 py-1 rounded-full ${item.is_equipped ? 'bg-green-500' : 'bg-blue-500'}`}
            >
                <Text className="text-white text-xs font-bold">
                    {item.is_equipped ? 'Equipped' : 'Equip'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 bg-black/80 items-center justify-center p-4">
                <GlassContainer className="w-full max-w-md h-3/4 p-4">
                    <View className="flex-row justify-between items-center mb-4 border-b border-white/20 pb-2">
                        <Text className="text-xl font-bold text-white">🎒 Backpack</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text className="text-gray-400 text-lg">Close</Text>
                        </TouchableOpacity>
                    </View>

                    {items.length === 0 && !loading ? (
                        <View className="flex-1 items-center justify-center">
                            <Text className="text-gray-400">Empty like space...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={items}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                        />
                    )}
                </GlassContainer>
            </View>
        </Modal>
    );
};
