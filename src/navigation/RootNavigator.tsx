import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Image } from 'react-native';
import { MapScreen } from '../screens/MapScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { SafetyScreen } from '../screens/SafetyScreen';
import { COLORS } from '../constants/colors';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                borderRadius: 25,
                height: 60,
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                borderTopWidth: 0,
            },
            tabBarActiveTintColor: COLORS.deepsea,
            tabBarInactiveTintColor: 'gray',
            tabBarShowLabel: false,
        }}
    >
        <Tab.Screen
            name="Map"
            component={MapScreen}
            options={{
                tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 12 }} /> // Replace with Icon
            }}
        />
        <Tab.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{
                tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 4 }} /> // Replace with Icon
            }}
        />
        <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
                tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 12 }} /> // Replace with Icon
            }}
        />
    </Tab.Navigator>
);

export const RootNavigator = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Image
                    source={require('../../assets/hellumi_logo.png')}
                    style={{ width: 150, height: 150, borderRadius: 30, marginBottom: 20 }}
                    resizeMode="contain"
                />
                <ActivityIndicator size="small" color={COLORS.orange} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    // Authenticated Stack
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="Search" component={SearchScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                    </>
                ) : (
                    // Auth Stack
                    <>
                        <Stack.Screen name="Safety" component={SafetyScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
