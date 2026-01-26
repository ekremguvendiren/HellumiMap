// Onboarding Tutorial Component
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_KEY = '@hellumimap_tutorial_complete';

interface TutorialStep {
    title: string;
    description: string;
    emoji: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: 'Welcome to HellumiMap! 🎮',
        description: 'A location-based game where you conquer territories, build structures, and battle for monuments across Cyprus!',
        emoji: '🗺️'
    },
    {
        title: 'Build Your Empire 🏠',
        description: 'Tap the BUILD button to place buildings at your location. Buildings generate passive income over time!',
        emoji: '🏗️'
    },
    {
        title: 'Capture Monuments 🏛️',
        description: 'Famous landmarks are world bosses. Attack them to capture and earn taxes from the territory!',
        emoji: '⚔️'
    },
    {
        title: 'Report Traffic 🚗',
        description: 'Help other drivers by reporting police, speed cameras, and hazards. Earn XP for every report!',
        emoji: '📍'
    },
    {
        title: 'Complete Quests 📋',
        description: 'Daily quests give you bonus coins and XP. Complete them all to level up faster!',
        emoji: '🎯'
    },
    {
        title: 'Join a Faction ⚔️',
        description: 'Team up with other players! Your faction competes for territory control across the island.',
        emoji: '🛡️'
    }
];

interface OnboardingTutorialProps {
    visible: boolean;
    onComplete: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
    visible,
    onComplete
}) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = async () => {
        try {
            await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
        } catch (e) {
            console.error('Error saving tutorial state:', e);
        }
        onComplete();
    };

    const step = TUTORIAL_STEPS[currentStep];
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Progress Dots */}
                    <View style={styles.progressDots}>
                        {TUTORIAL_STEPS.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    index === currentStep && styles.activeDot,
                                    index < currentStep && styles.completedDot
                                ]}
                            />
                        ))}
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.emoji}>{step.emoji}</Text>
                        <Text style={styles.title}>{step.title}</Text>
                        <Text style={styles.description}>{step.description}</Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        {!isLastStep && (
                            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                                <Text style={styles.skipText}>Skip</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                            <Text style={styles.nextText}>
                                {isLastStep ? "Let's Go! 🚀" : 'Next →'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Utility function to check if tutorial was completed
export const checkTutorialComplete = async (): Promise<boolean> => {
    try {
        const value = await AsyncStorage.getItem(TUTORIAL_KEY);
        return value === 'true';
    } catch (e) {
        return false;
    }
};

// Utility to reset tutorial (for testing)
export const resetTutorial = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(TUTORIAL_KEY);
    } catch (e) {
        console.error('Error resetting tutorial:', e);
    }
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#1a1a2e',
        borderRadius: 24,
        padding: 32,
        width: width - 40,
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    progressDots: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 32,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    activeDot: {
        backgroundColor: '#4CAF50',
        width: 24,
    },
    completedDot: {
        backgroundColor: '#4CAF50',
    },
    content: {
        alignItems: 'center',
        marginBottom: 32,
    },
    emoji: {
        fontSize: 72,
        marginBottom: 24,
    },
    title: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        color: '#aaa',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        width: '100%',
    },
    skipButton: {
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    skipText: {
        color: '#888',
        fontSize: 16,
    },
    nextButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 25,
        flex: 1,
        alignItems: 'center',
    },
    nextText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OnboardingTutorial;
