import "./global.css";
import './src/i18n'; // Initialize i18n
import React from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator />
    </>
  );
}
