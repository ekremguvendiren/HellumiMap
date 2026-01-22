import * as Speech from 'expo-speech';
import i18n from '../i18n';

export const VoiceService = {
    /**
     * Speak a warning message to the user
     * @param message Text to speak
     */
    speak: (message: string) => {
        Speech.speak(message, {
            language: i18n.language, // Use current app language (en, tr, el)
            pitch: 1.0,
            rate: 0.9,
        });
    },

    /**
     * Stop any current speech
     */
    stop: () => {
        Speech.stop();
    },

    /**
     * Pre-defined alerts (Getters to always fetch fresh translation)
     */
    get alerts() {
        return {
            police: i18n.t('map.police_ahead'),
            traffic: i18n.t('map.traffic_ahead'),
            hazard: i18n.t('map.hazard_ahead')
        };
    },

    getRadarAlert: (speed: number) => {
        return i18n.t('map.radar_ahead', { speed });
    }
};
