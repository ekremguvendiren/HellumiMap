import React from 'react';
import { View, Text, SafeAreaView, Image } from 'react-native';
import { GoogleLogin } from '../components/auth/GoogleLogin';
import { COLORS } from '../constants/colors';
import { useTranslation } from 'react-i18next';

export const LoginScreen = () => {
    const { t } = useTranslation();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-8 justify-center items-center">
                {/* Logo or Mascot */}
                <View className="w-32 h-32 bg-orange-100 rounded-full items-center justify-center mb-8 border-4 border-orange-200">
                    <Text className="text-6xl">🍊</Text>
                </View>

                <Text className="text-3xl font-bold text-gray-900 mb-2">HellumiMap</Text>
                <Text className="text-gray-500 text-center mb-12">
                    The waze of Cyprus.
                </Text>

                <View className="w-full">
                    <Text className="text-center text-gray-400 mb-4 font-semibold">{t('auth.login_title')}</Text>
                    <GoogleLogin />
                </View>

                <Text className="text-xs text-gray-400 mt-8 text-center px-8">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </Text>
            </View>
        </SafeAreaView>
    );
};
