import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { COLORS } from '../constants/colors';
import { GlassContainer } from '../components/common/GlassContainer';

export const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // Navigate to Profile Setup
                Alert.alert('Success', 'Account created! Let\'s set up your profile.', [
                    { text: 'OK', onPress: () => navigation.navigate('ProfileSetup') }
                ]);
            }
        } catch (error: any) {
            Alert.alert('Registration Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-900 justify-center px-6">
            <SafeAreaView>
                <GlassContainer className="p-6 w-full max-w-md self-center">
                    <Text className="text-3xl font-bold text-white mb-6 text-center">Create Account</Text>

                    <Text className="text-gray-400 mb-1 ml-1">Email</Text>
                    <TextInput
                        className="bg-white/10 text-white p-4 rounded-xl mb-4 border border-white/20"
                        placeholder="you@example.com"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text className="text-gray-400 mb-1 ml-1">Password</Text>
                    <TextInput
                        className="bg-white/10 text-white p-4 rounded-xl mb-6 border border-white/20"
                        placeholder="••••••••"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        onPress={handleRegister}
                        disabled={loading}
                        className={`p-4 rounded-xl items-center mb-4 ${loading ? 'bg-gray-600' : 'bg-orange-500'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} className="items-center">
                        <Text className="text-gray-400">Already have an account? <Text className="text-orange-400 font-bold">Log In</Text></Text>
                    </TouchableOpacity>
                </GlassContainer>
            </SafeAreaView>
        </View>
    );
};
