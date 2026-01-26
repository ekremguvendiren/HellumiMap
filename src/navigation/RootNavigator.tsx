import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { MapScreen } from '../screens/MapScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { SafetyScreen } from '../screens/SafetyScreen';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: {
                backgroundColor: 'rgba(26, 26, 46, 0.95)',
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                borderRadius: 25,
                height: 60,
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                borderTopWidth: 0,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
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
                tabBarIcon: ({ focused }) => (
                    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>🗺️</Text>
                )
            }}
        />
        <Tab.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{
                tabBarIcon: ({ focused }) => (
                    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>🏆</Text>
                )
            }}
        />
        <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
                tabBarIcon: ({ focused }) => (
                    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>👤</Text>
                )
            }}
        />
    </Tab.Navigator>
);

export const RootNavigator = () => {
    const { session, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            SplashScreen.hideAsync();
        }
    }, [loading]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.deepsea} />
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
