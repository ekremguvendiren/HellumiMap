// Faction Selection Modal Component
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { questService, Faction } from '../../services/questService';
import { useAuth } from '../../context/AuthContext';

interface FactionModalProps {
    visible: boolean;
    onClose: () => void;
    onJoined?: (faction: Faction) => void;
}

export const FactionModal: React.FC<FactionModalProps> = ({
    visible,
    onClose,
    onJoined
}) => {
    const { user, refreshProfile } = useAuth();
    const [factions, setFactions] = useState<Faction[]>([]);
    const [currentFaction, setCurrentFaction] = useState<Faction | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<string | null>(null);

    useEffect(() => {
        if (visible && user) {
            loadFactions();
        }
    }, [visible, user]);

    const loadFactions = async () => {
        if (!user) return;
        setLoading(true);

        const [all, current] = await Promise.all([
            questService.getAllFactions(),
            questService.getUserFaction(user.id)
        ]);

        setFactions(all);
        setCurrentFaction(current);
        setLoading(false);
    };

    const handleJoin = async (faction: Faction) => {
        if (!user) return;

        if (currentFaction) {
            Alert.alert(
                'Switch Faction?',
                `Leave ${currentFaction.name} and join ${faction.name}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Switch',
                        style: 'destructive',
                        onPress: () => confirmJoin(faction)
                    }
                ]
            );
        } else {
            confirmJoin(faction);
        }
    };

    const confirmJoin = async (faction: Faction) => {
        if (!user) return;
        setJoining(faction.id);

        const result = await questService.joinFaction(user.id, faction.id);

        if (result.success) {
            setCurrentFaction(faction);
            await refreshProfile();
            onJoined?.(faction);
            Alert.alert('Welcome!', `You've joined ${faction.name}! ${faction.emoji}`);
        } else {
            Alert.alert('Error', result.error || 'Failed to join faction');
        }

        setJoining(null);
    };

    const renderFaction = ({ item }: { item: Faction }) => {
        const isCurrent = currentFaction?.id === item.id;

        return (
            <TouchableOpacity
                style={[styles.factionCard, { borderColor: item.color }]}
                onPress={() => handleJoin(item)}
                disabled={isCurrent || joining !== null}
            >
                <View style={[styles.emojiContainer, { backgroundColor: item.color + '20' }]}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                </View>

                <View style={styles.info}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.name, { color: item.color }]}>{item.name}</Text>
                        {isCurrent && (
                            <View style={[styles.currentBadge, { backgroundColor: item.color }]}>
                                <Text style={styles.currentBadgeText}>JOINED</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.description}>{item.description}</Text>
                    <View style={styles.stats}>
                        <Text style={styles.statText}>👥 {item.member_count} members</Text>
                        <Text style={styles.statText}>⭐ {(item.total_xp / 1000).toFixed(1)}K XP</Text>
                    </View>
                </View>

                {!isCurrent && (
                    <View style={styles.joinArrow}>
                        <Text style={styles.arrowText}>→</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>⚔️ Factions</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        Join a faction to compete with your team and earn exclusive rewards!
                    </Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
                    ) : (
                        <FlatList
                            data={factions}
                            renderItem={renderFaction}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        color: '#888',
        fontSize: 24,
        padding: 4,
    },
    subtitle: {
        color: '#888',
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    loader: {
        marginTop: 40,
    },
    list: {
        paddingBottom: 20,
    },
    factionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
    },
    emojiContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    emoji: {
        fontSize: 28,
    },
    info: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    currentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    currentBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    description: {
        color: '#888',
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },
    stats: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    statText: {
        color: '#aaa',
        fontSize: 12,
    },
    joinArrow: {
        padding: 8,
    },
    arrowText: {
        color: '#888',
        fontSize: 20,
    },
});

export default FactionModal;
