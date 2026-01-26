// Building Marker Component for Map Display
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { UserBuilding, buildingService, BUILDING_TYPES, TIER_MULTIPLIERS } from '../../services/buildingService';
import { useAuth } from '../../context/AuthContext';

interface BuildingMarkerProps {
    building: UserBuilding;
    isOwner?: boolean;
    onUpdate?: () => void;
}

export const BuildingMarker: React.FC<BuildingMarkerProps> = ({
    building,
    isOwner = false,
    onUpdate
}) => {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [collecting, setCollecting] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const buildingType = BUILDING_TYPES[building.building_type];
    const tierConfig = TIER_MULTIPLIERS[building.tier];
    const pendingRent = buildingService.calculatePendingRent(building);

    const handleCollectRent = async () => {
        if (!user) return;
        setCollecting(true);
        setMessage(null);

        const result = await buildingService.collectRent(building.id, user.id);

        if (result.success) {
            setMessage(`💰 Collected ${result.amount} coins!`);
            onUpdate?.();
        } else {
            setMessage(`❌ ${result.error}`);
        }

        setCollecting(false);
    };

    const handleUpgrade = async () => {
        if (!user) return;
        setUpgrading(true);
        setMessage(null);

        const result = await buildingService.upgradeBuilding(building.id, user.id);

        if (result.success) {
            setMessage(`⬆️ Upgraded to ${result.building?.tier}!`);
            onUpdate?.();
        } else {
            setMessage(`❌ ${result.error}`);
        }

        setUpgrading(false);
    };

    const getTierIndex = () => {
        const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
        return tiers.indexOf(building.tier);
    };

    const getNextTierCost = () => {
        const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
        const currentIndex = getTierIndex();
        if (currentIndex >= tiers.length - 1) return null;

        const nextTier = tiers[currentIndex + 1];
        const nextConfig = TIER_MULTIPLIERS[nextTier];
        return buildingType.baseCost * (nextConfig.cost - tierConfig.cost);
    };

    return (
        <>
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.markerContainer}>
                <View style={[styles.marker, { borderColor: tierConfig.color }]}>
                    <Text style={styles.emoji}>{buildingType?.emoji || '🏢'}</Text>
                    {isOwner && pendingRent > 0 && (
                        <View style={styles.rentBadge}>
                            <Text style={styles.rentBadgeText}>💰</Text>
                        </View>
                    )}
                </View>
                {/* Level indicator */}
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Lv.{building.level}</Text>
                </View>
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalEmoji}>{buildingType?.emoji || '🏢'}</Text>
                            <View style={styles.titleContainer}>
                                <Text style={styles.modalTitle}>{building.name || buildingType?.name}</Text>
                                <View style={[styles.tierBadge, { backgroundColor: tierConfig.color }]}>
                                    <Text style={styles.tierText}>{building.tier.toUpperCase()}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Stats */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>Lv.{building.level}</Text>
                                <Text style={styles.statLabel}>Level</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{building.production_rate}/h</Text>
                                <Text style={styles.statLabel}>Production</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{pendingRent}</Text>
                                <Text style={styles.statLabel}>Pending</Text>
                            </View>
                        </View>

                        {/* Description */}
                        <Text style={styles.description}>{buildingType?.description}</Text>

                        {/* Message */}
                        {message && (
                            <Text style={styles.message}>{message}</Text>
                        )}

                        {/* Actions for owner */}
                        {isOwner && (
                            <View style={styles.actions}>
                                {pendingRent > 0 && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.collectButton]}
                                        onPress={handleCollectRent}
                                        disabled={collecting}
                                    >
                                        <Text style={styles.actionButtonText}>
                                            {collecting ? '⏳ Collecting...' : `💰 Collect ${pendingRent} Coins`}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {getNextTierCost() !== null && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.upgradeButton]}
                                        onPress={handleUpgrade}
                                        disabled={upgrading}
                                    >
                                        <Text style={styles.actionButtonText}>
                                            {upgrading ? '⏳ Upgrading...' : `⬆️ Upgrade (${getNextTierCost()} Coins)`}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {getTierIndex() >= 4 && (
                                    <Text style={styles.maxTierText}>✨ Maximum tier reached!</Text>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.actionButton, styles.closeButton]}
                            onPress={() => setShowModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: 'center',
    },
    marker: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 3,
    },
    emoji: {
        fontSize: 22,
    },
    rentBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rentBadgeText: {
        fontSize: 10,
    },
    levelBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
    },
    levelText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalEmoji: {
        fontSize: 48,
        marginRight: 16,
    },
    titleContainer: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    tierBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    tierText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 4,
    },
    description: {
        color: '#aaa',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    message: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
    },
    actions: {
        gap: 12,
        marginBottom: 12,
    },
    actionButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    collectButton: {
        backgroundColor: '#FFD700',
    },
    upgradeButton: {
        backgroundColor: '#4CAF50',
    },
    actionButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    maxTierText: {
        color: '#B9F2FF',
        fontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    closeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default BuildingMarker;
