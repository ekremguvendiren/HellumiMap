// Achievements Modal Component
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { questService, Achievement, UserAchievement } from '../../services/questService';
import { useAuth } from '../../context/AuthContext';

interface AchievementsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
    visible,
    onClose
}) => {
    const { user } = useAuth();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible && user) {
            loadAchievements();
        }
    }, [visible, user]);

    const loadAchievements = async () => {
        if (!user) return;
        setLoading(true);

        const [all, userAchievements] = await Promise.all([
            questService.getAllAchievements(),
            questService.getUserAchievements(user.id)
        ]);

        setAchievements(all);
        setUnlocked(new Set(userAchievements.map(a => a.achievement_id)));
        setLoading(false);
    };

    const renderAchievement = ({ item }: { item: Achievement }) => {
        const isUnlocked = unlocked.has(item.id);

        return (
            <View style={[styles.achievementCard, !isUnlocked && styles.lockedCard]}>
                <View style={[styles.emojiContainer, isUnlocked && styles.unlockedEmoji]}>
                    <Text style={[styles.emoji, !isUnlocked && styles.lockedEmoji]}>
                        {isUnlocked ? item.emoji : '🔒'}
                    </Text>
                </View>
                <View style={styles.info}>
                    <Text style={[styles.name, !isUnlocked && styles.lockedText]}>
                        {item.name}
                    </Text>
                    <Text style={styles.description}>{item.description}</Text>
                    <Text style={styles.reward}>🎁 {item.xp_reward} XP</Text>
                </View>
                {isUnlocked && (
                    <View style={styles.unlockedBadge}>
                        <Text style={styles.unlockedText}>✓</Text>
                    </View>
                )}
            </View>
        );
    };

    const unlockedCount = unlocked.size;
    const totalCount = achievements.length;
    const completionPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

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
                        <Text style={styles.title}>🏅 Achievements</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Progress Summary */}
                    <View style={styles.progressSummary}>
                        <Text style={styles.progressTitle}>
                            {unlockedCount} / {totalCount} Unlocked
                        </Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
                        </View>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
                    ) : (
                        <FlatList
                            data={achievements}
                            renderItem={renderAchievement}
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
        marginBottom: 16,
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
    progressSummary: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    progressTitle: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 4,
    },
    loader: {
        marginTop: 40,
    },
    list: {
        paddingBottom: 20,
    },
    achievementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    lockedCard: {
        opacity: 0.6,
    },
    emojiContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    unlockedEmoji: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    emoji: {
        fontSize: 28,
    },
    lockedEmoji: {
        opacity: 0.5,
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    lockedText: {
        color: '#888',
    },
    description: {
        color: '#888',
        fontSize: 13,
        marginTop: 2,
    },
    reward: {
        color: '#FFD700',
        fontSize: 12,
        marginTop: 4,
    },
    unlockedBadge: {
        backgroundColor: '#4CAF50',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unlockedText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AchievementsModal;
