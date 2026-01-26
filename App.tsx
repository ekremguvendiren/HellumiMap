import "./global.css";
import './src/i18n'; // Initialize i18n
import React, { useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Enable Immersive Mode (Hide System Bars)
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setBackgroundColorAsync('#00000000'); // Transparent
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </ErrorBoundary>
  );
}
