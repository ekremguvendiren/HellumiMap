import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { MapScreen } from '../screens/MapScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS } from '../constants/colors';
import { SafetyScreen } from '../screens/SafetyScreen';

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
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Safety">
                <Stack.Screen name="Safety" component={SafetyScreen} />
                <Stack.Screen name="Login" component={MainTabs} />
                {/* Note: In real auth flow, Login would be separate, but here we jump to MainTabs which assumes auth or handles it */}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
