// Daily Quests Modal Component
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { questService, Quest, QuestProgress } from '../../services/questService';
import { useAuth } from '../../context/AuthContext';

interface DailyQuestsModalProps {
    visible: boolean;
    onClose: () => void;
    onQuestCompleted?: (coins: number, xp: number) => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
    visible,
    onClose,
    onQuestCompleted
}) => {
    const { user, refreshProfile } = useAuth();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [progress, setProgress] = useState<QuestProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);

    useEffect(() => {
        if (visible && user) {
            loadQuests();
        }
    }, [visible, user]);

    const loadQuests = async () => {
        if (!user) return;
        setLoading(true);

        // Initialize daily quests for today
        await questService.initDailyQuests(user.id);

        const [allQuests, userProgress] = await Promise.all([
            questService.getDailyQuests(),
            questService.getUserQuestProgress(user.id)
        ]);

        setQuests(allQuests);
        setProgress(userProgress);
        setLoading(false);
    };

    const getQuestProgress = (questId: string): QuestProgress | undefined => {
        return progress.find(p => p.quest_id === questId);
    };

    const handleClaim = async (quest: Quest) => {
        if (!user) return;
        setClaiming(quest.id);

        const result = await questService.claimQuestReward(user.id, quest.id);

        if (result.success) {
            await refreshProfile();
            onQuestCompleted?.(result.coins || 0, result.xp || 0);
            await loadQuests(); // Refresh progress
        }

        setClaiming(null);
    };

    const renderQuest = ({ item }: { item: Quest }) => {
        const prog = getQuestProgress(item.id);
        const currentValue = prog?.current_value || 0;
        const progressPercent = Math.min(100, (currentValue / item.target_value) * 100);
        const isCompleted = prog?.completed || false;
        const isClaimed = prog?.claimed || false;

        return (
            <View style={styles.questCard}>
                <View style={styles.questHeader}>
                    <Text style={styles.questEmoji}>{item.emoji}</Text>
                    <View style={styles.questInfo}>
                        <Text style={styles.questName}>{item.name}</Text>
                        <Text style={styles.questDescription}>{item.description}</Text>
                    </View>
                    {isClaimed ? (
                        <View style={styles.claimedBadge}>
                            <Text style={styles.claimedText}>✓</Text>
                        </View>
                    ) : isCompleted ? (
                        <TouchableOpacity
                            style={styles.claimButton}
                            onPress={() => handleClaim(item)}
                            disabled={claiming === item.id}
                        >
                            <Text style={styles.claimButtonText}>
                                {claiming === item.id ? '...' : 'Claim'}
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${progressPercent}%` },
                                isCompleted && styles.progressComplete
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {currentValue}/{item.target_value}
                    </Text>
                </View>

                {/* Rewards */}
                <View style={styles.rewards}>
                    <Text style={styles.rewardText}>💰 {item.coin_reward}</Text>
                    <Text style={styles.rewardText}>⭐ {item.xp_reward} XP</Text>
                </View>
            </View>
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
                        <Text style={styles.title}>📋 Daily Quests</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>Complete quests to earn rewards!</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
                    ) : (
                        <FlatList
                            data={quests}
                            renderItem={renderQuest}
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
        maxHeight: '80%',
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
        marginBottom: 16,
    },
    loader: {
        marginTop: 40,
    },
    list: {
        paddingBottom: 20,
    },
    questCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    questHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    questEmoji: {
        fontSize: 32,
        marginRight: 12,
    },
    questInfo: {
        flex: 1,
    },
    questName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    questDescription: {
        color: '#888',
        fontSize: 13,
        marginTop: 2,
    },
    claimButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    claimButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    claimedBadge: {
        backgroundColor: '#888',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    claimedText: {
        color: '#fff',
        fontSize: 16,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        marginRight: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 4,
    },
    progressComplete: {
        backgroundColor: '#4CAF50',
    },
    progressText: {
        color: '#888',
        fontSize: 12,
        width: 50,
        textAlign: 'right',
    },
    rewards: {
        flexDirection: 'row',
        gap: 16,
    },
    rewardText: {
        color: '#aaa',
        fontSize: 13,
    },
});

export default DailyQuestsModal;
