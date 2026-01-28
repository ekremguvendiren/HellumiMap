import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Alert, StyleSheet } from 'react-native';
import { DominionService, InventoryItem } from '../../services/dominionService';
import { BlurView } from 'expo-blur';

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
        try {
            const inv = await DominionService.getInventory(userId);
            setItems(inv || []);
        } catch (e) {
            console.error('[BackpackModal] Error loading inventory:', e);
        }
        setLoading(false);
    };

    const handleEquip = async (item: InventoryItem) => {
        const success = await DominionService.toggleEquipItem(userId, item.id, item.is_equipped ?? false);
        if (success) {
            loadInventory();
            Alert.alert(item.is_equipped ? "Unequipped" : "Equipped", `${item.item_type} updated.`);
        } else {
            Alert.alert("Error", "Could not update equipment.");
        }
    };

    const renderItem = ({ item }: { item: InventoryItem }) => (
        <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>
                        {item.item_type === 'SWORD' ? '🗡️' :
                            item.item_type === 'SHIELD' ? '🛡️' :
                                item.item_type === 'POTION' ? '🧪' : '🔋'}
                    </Text>
                </View>
                <View>
                    <Text style={styles.itemName}>{item.item_type}</Text>
                    <Text style={styles.itemPower}>Power: {item.power_value || 0}</Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={() => handleEquip(item)}
                style={[styles.equipButton, item.is_equipped ? styles.equipped : styles.notEquipped]}
            >
                <Text style={styles.equipText}>
                    {item.is_equipped ? 'Equipped' : 'Equip'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>🎒 Backpack</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Loading...</Text>
                        </View>
                    ) : items.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Empty like space...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={items}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '75%',
        backgroundColor: '#1a1a2e',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeText: {
        color: '#888',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 100,
    },
    emptyText: {
        color: '#888',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2a2a3e',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 20,
    },
    itemName: {
        color: '#fff',
        fontWeight: 'bold',
    },
    itemPower: {
        color: '#888',
        fontSize: 12,
    },
    equipButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    equipped: {
        backgroundColor: '#4CAF50',
    },
    notEquipped: {
        backgroundColor: '#2196F3',
    },
    equipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
