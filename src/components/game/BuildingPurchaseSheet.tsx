// Building Purchase Sheet Component
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { BUILDING_TYPES, TIER_MULTIPLIERS, buildingService, BuildingType } from '../../services/buildingService';
import { useAuth } from '../../context/AuthContext';

interface BuildingPurchaseSheetProps {
    visible: boolean;
    onClose: () => void;
    lat: number;
    lng: number;
    onPurchased?: () => void;
}

export const BuildingPurchaseSheet: React.FC<BuildingPurchaseSheetProps> = ({
    visible,
    onClose,
    lat,
    lng,
    onPurchased
}) => {
    const { user, profile } = useAuth();
    const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
    const [selectedTier, setSelectedTier] = useState<string>('bronze');
    const [buildingName, setBuildingName] = useState('');
    const [purchasing, setPurchasing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

    const handlePurchase = async () => {
        if (!user || !selectedBuilding) return;

        setPurchasing(true);
        setMessage(null);

        const name = buildingName.trim() || BUILDING_TYPES[selectedBuilding].name;

        const result = await buildingService.purchaseBuilding(
            user.id,
            selectedBuilding,
            selectedTier,
            lat,
            lng,
            name
        );

        if (result.success) {
            setMessage(`✅ ${name} built successfully!`);
            setTimeout(() => {
                onPurchased?.();
                onClose();
                setSelectedBuilding(null);
                setBuildingName('');
                setSelectedTier('bronze');
                setMessage(null);
            }, 1500);
        } else {
            setMessage(`❌ ${result.error}`);
        }

        setPurchasing(false);
    };

    const getCost = (buildingType: string, tier: string): number => {
        return buildingService.getBuildingCost(buildingType, tier);
    };

    const canAfford = selectedBuilding ?
        (profile?.coins || 0) >= getCost(selectedBuilding, selectedTier) :
        false;

    const renderBuildingOption = (id: string, building: BuildingType) => {
        const isSelected = selectedBuilding === id;
        const cost = getCost(id, selectedTier);
        const affordable = (profile?.coins || 0) >= cost;

        return (
            <TouchableOpacity
                key={id}
                style={[
                    styles.buildingOption,
                    isSelected && styles.selectedOption,
                    !affordable && styles.unaffordableOption
                ]}
                onPress={() => setSelectedBuilding(id)}
            >
                <Text style={styles.buildingEmoji}>{building.emoji}</Text>
                <Text style={styles.buildingName}>{building.name}</Text>
                <Text style={[styles.buildingCost, !affordable && styles.unaffordableCost]}>
                    {cost} 🪙
                </Text>
            </TouchableOpacity>
        );
    };

    const renderTierOption = (tier: string) => {
        const config = TIER_MULTIPLIERS[tier];
        const isSelected = selectedTier === tier;

        return (
            <TouchableOpacity
                key={tier}
                style={[
                    styles.tierOption,
                    isSelected && styles.selectedTier,
                    { borderColor: config.color }
                ]}
                onPress={() => setSelectedTier(tier)}
            >
                <View style={[styles.tierDot, { backgroundColor: config.color }]} />
                <Text style={styles.tierName}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Text>
                <Text style={styles.tierMultiplier}>{config.production}x</Text>
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
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>🏗️ Build New Structure</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Balance Display */}
                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Your Balance:</Text>
                        <Text style={styles.balanceValue}>{profile?.coins || 0} 🪙</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Building Selection */}
                        <Text style={styles.sectionTitle}>Select Building Type</Text>
                        <View style={styles.buildingsGrid}>
                            {Object.entries(BUILDING_TYPES).map(([id, building]) =>
                                renderBuildingOption(id, building)
                            )}
                        </View>

                        {/* Tier Selection */}
                        <Text style={styles.sectionTitle}>Select Tier</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.tiersScroll}
                        >
                            {tiers.map(renderTierOption)}
                        </ScrollView>

                        {/* Building Name */}
                        <Text style={styles.sectionTitle}>Building Name (Optional)</Text>
                        <TextInput
                            style={styles.nameInput}
                            value={buildingName}
                            onChangeText={setBuildingName}
                            placeholder="Enter custom name..."
                            placeholderTextColor="#666"
                            maxLength={30}
                        />

                        {/* Selected Summary */}
                        {selectedBuilding && (
                            <View style={styles.summary}>
                                <Text style={styles.summaryTitle}>Summary</Text>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Building:</Text>
                                    <Text style={styles.summaryValue}>
                                        {BUILDING_TYPES[selectedBuilding].emoji} {BUILDING_TYPES[selectedBuilding].name}
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Tier:</Text>
                                    <Text style={[styles.summaryValue, { color: TIER_MULTIPLIERS[selectedTier].color }]}>
                                        {selectedTier.toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Production:</Text>
                                    <Text style={styles.summaryValue}>
                                        {BUILDING_TYPES[selectedBuilding].baseProduction * TIER_MULTIPLIERS[selectedTier].production}/hour
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Total Cost:</Text>
                                    <Text style={[styles.summaryValue, !canAfford && styles.unaffordableCost]}>
                                        {getCost(selectedBuilding, selectedTier)} 🪙
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Message */}
                        {message && (
                            <Text style={styles.message}>{message}</Text>
                        )}
                    </ScrollView>

                    {/* Purchase Button */}
                    <TouchableOpacity
                        style={[
                            styles.purchaseButton,
                            (!selectedBuilding || !canAfford || purchasing) && styles.disabledButton
                        ]}
                        onPress={handlePurchase}
                        disabled={!selectedBuilding || !canAfford || purchasing}
                    >
                        <Text style={styles.purchaseButtonText}>
                            {purchasing ? '⏳ Building...' :
                                !canAfford ? '💸 Not Enough Coins' :
                                    '🏗️ Build Structure'}
                        </Text>
                    </TouchableOpacity>
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
    sheet: {
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
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeButton: {
        color: '#888',
        fontSize: 24,
        padding: 4,
    },
    balanceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    balanceLabel: {
        color: '#aaa',
        fontSize: 14,
    },
    balanceValue: {
        color: '#FFD700',
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 12,
    },
    buildingsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    buildingOption: {
        width: '30%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedOption: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    unaffordableOption: {
        opacity: 0.5,
    },
    buildingEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    buildingName: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    buildingCost: {
        color: '#FFD700',
        fontSize: 11,
        marginTop: 4,
    },
    unaffordableCost: {
        color: '#F44336',
    },
    tiersScroll: {
        marginBottom: 16,
    },
    tierOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 12,
        borderWidth: 2,
    },
    selectedTier: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    tierDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    tierName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
    },
    tierMultiplier: {
        color: '#4CAF50',
        fontSize: 12,
    },
    nameInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
    },
    summary: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    summaryTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: '#888',
        fontSize: 14,
    },
    summaryValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    message: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
    },
    purchaseButton: {
        backgroundColor: '#4CAF50',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    disabledButton: {
        backgroundColor: '#444',
    },
    purchaseButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default BuildingPurchaseSheet;
