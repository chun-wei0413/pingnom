import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';

// Suppress all React Native Web style warnings
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('shadow*') ||
      message.includes('pointerEvents') ||
      message.includes('deprecated') ||
      message.includes('boxShadow') ||
      message.includes('style props')
    ) {
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('shadow*') ||
      message.includes('pointerEvents') ||
      message.includes('deprecated') ||
      message.includes('boxShadow') ||
      message.includes('style props')
    ) {
      return;
    }
    originalError(...args);
  };
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}