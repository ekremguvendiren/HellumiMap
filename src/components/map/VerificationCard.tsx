import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GlassContainer } from '../common/GlassContainer';

interface VerificationCardProps {
    reportType: string;
    onVerify: () => void;
    onReject: () => void;
}

export const VerificationCard = ({ reportType, onVerify, onReject }: VerificationCardProps) => {
    const { t } = useTranslation();

    return (
        <GlassContainer className="p-4 mx-4 mb-4">
            <Text className="text-gray-800 font-bold text-lg mb-2 text-center">
                {t('map.still_there', { type: reportType })}
            </Text>
            <View className="flex-row justify-between space-x-4">
                <TouchableOpacity
                    className="flex-1 bg-red-100 py-3 rounded-xl items-center border border-red-200"
                    onPress={onReject}
                >
                    <Text className="text-red-700 font-bold">{t('map.no_verify')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 bg-green-100 py-3 rounded-xl items-center border border-green-200"
                    onPress={onVerify}
                >
                    <Text className="text-green-700 font-bold">{t('map.yes_verify')}</Text>
                </TouchableOpacity>
            </View>
        </GlassContainer>
    );
};
