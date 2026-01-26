// Monument Marker Component for Map Display
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Monument, monumentService } from '../../services/monumentService';
import { useAuth } from '../../context/AuthContext';

interface MonumentMarkerProps {
    monument: Monument;
    userLat: number;
    userLng: number;
    onUpdate?: () => void;
}

export const MonumentMarker: React.FC<MonumentMarkerProps> = ({
    monument,
    userLat,
    userLng,
    onUpdate
}) => {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [attacking, setAttacking] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const status = monumentService.getMonumentStatus(monument);
    const isOwner = monument.owner_id === user?.id;

    const handleAttack = async () => {
        if (!user) return;
        setAttacking(true);
        setMessage(null);

        const result = await monumentService.attackMonument(
            monument.id,
            user.id,
            userLat,
            userLng
        );

        if (result.success) {
            if (result.captured) {
                setMessage(`🎉 Captured! You now own ${monument.name}!`);
            } else {
                setMessage(`⚔️ Dealt ${result.damage} damage! HP: ${result.monumentHealth}`);
            }
            onUpdate?.();
        } else {
            setMessage(`❌ ${result.error}`);
        }

        setAttacking(false);
    };

    const handlePayTax = async () => {
        if (!user) return;
        const result = await monumentService.payTax(monument.id, user.id);

        if (result.success) {
            setMessage(`✅ Tax paid! Protected for 24h`);
            onUpdate?.();
        } else {
            setMessage(`❌ ${result.error}`);
        }
    };

    const getHealthColor = () => {
        if (status.healthPercent > 60) return '#4CAF50';
        if (status.healthPercent > 30) return '#FF9800';
        return '#F44336';
    };

    const getTaxBadge = () => {
        if (!isOwner) return null;

        switch (status.taxStatus) {
            case 'paid':
                return <View style={[styles.taxBadge, { backgroundColor: '#4CAF50' }]}><Text style={styles.taxBadgeText}>✓</Text></View>;
            case 'due':
                return <View style={[styles.taxBadge, { backgroundColor: '#FF9800' }]}><Text style={styles.taxBadgeText}>!</Text></View>;
            case 'overdue':
                return <View style={[styles.taxBadge, { backgroundColor: '#F44336' }]}><Text style={styles.taxBadgeText}>⚠</Text></View>;
            default:
                return null;
        }
    };

    return (
        <>
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.markerContainer}>
                <View style={[styles.marker, isOwner && styles.ownedMarker]}>
                    <Text style={styles.emoji}>{monument.emoji || '🏛️'}</Text>
                    {getTaxBadge()}
                </View>
                {/* Health bar */}
                <View style={styles.healthBarContainer}>
                    <View
                        style={[
                            styles.healthBar,
                            { width: `${status.healthPercent}%`, backgroundColor: getHealthColor() }
                        ]}
                    />
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
                            <Text style={styles.modalEmoji}>{monument.emoji || '🏛️'}</Text>
                            <Text style={styles.modalTitle}>{monument.name}</Text>
                            {isOwner && <Text style={styles.ownerBadge}>OWNED</Text>}
                        </View>

                        {/* Health Section */}
                        <View style={styles.statsSection}>
                            <Text style={styles.statLabel}>Health</Text>
                            <View style={styles.healthBarLarge}>
                                <View
                                    style={[
                                        styles.healthBarFill,
                                        { width: `${status.healthPercent}%`, backgroundColor: getHealthColor() }
                                    ]}
                                />
                            </View>
                            <Text style={styles.healthText}>
                                {monument.health} / {monument.max_health}
                            </Text>
                        </View>

                        {/* Owner Info */}
                        {monument.owner_id && (
                            <View style={styles.ownerSection}>
                                <Text style={styles.statLabel}>
                                    {isOwner ? 'You own this monument' : 'Owned by another player'}
                                </Text>
                                {isOwner && status.hoursUntilTaxDue !== null && (
                                    <Text style={styles.taxInfo}>
                                        Tax Due: {status.hoursUntilTaxDue.toFixed(1)}h remaining
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Message */}
                        {message && (
                            <Text style={styles.message}>{message}</Text>
                        )}

                        {/* Actions */}
                        <View style={styles.actions}>
                            {!isOwner && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.attackButton]}
                                    onPress={handleAttack}
                                    disabled={attacking}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {attacking ? '⏳ Attacking...' : '⚔️ Attack (-10 Energy)'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {isOwner && (status.taxStatus === 'due' || status.taxStatus === 'overdue') && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.taxButton]}
                                    onPress={handlePayTax}
                                >
                                    <Text style={styles.actionButtonText}>
                                        💰 Pay Tax (500 Coins)
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.actionButton, styles.closeButton]}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
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
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 3,
        borderColor: '#9C27B0',
    },
    ownedMarker: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    emoji: {
        fontSize: 24,
    },
    taxBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    taxBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    healthBarContainer: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 2,
        marginTop: 4,
        overflow: 'hidden',
    },
    healthBar: {
        height: '100%',
        borderRadius: 2,
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
        fontSize: 40,
        marginRight: 12,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    ownerBadge: {
        backgroundColor: '#4CAF50',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    statsSection: {
        marginBottom: 20,
    },
    statLabel: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 8,
    },
    healthBarLarge: {
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    healthBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    healthText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
    },
    ownerSection: {
        marginBottom: 20,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
    },
    taxInfo: {
        color: '#FF9800',
        fontSize: 14,
        marginTop: 4,
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
    },
    actionButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    attackButton: {
        backgroundColor: '#F44336',
    },
    taxButton: {
        backgroundColor: '#FF9800',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default MonumentMarker;
