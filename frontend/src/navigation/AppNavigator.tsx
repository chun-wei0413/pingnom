import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { RootStackParamList } from '@/types/navigation';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import Loading from '@/components/common/Loading';

const Stack = createStackNavigator<RootStackParamList>();

// Suppress React Native Web warnings
const originalWarn = console.warn;
console.warn = (message) => {
  if (
    typeof message === 'string' &&
    (message.includes('shadow*') || 
     message.includes('pointerEvents') ||
     message.includes('deprecated'))
  ) {
    return;
  }
  originalWarn(message);
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // TODO: Check for stored authentication token and validate it
    // For now, we'll just show the auth flow
    console.log('🔵 AppNavigator - Initial load', { isAuthenticated, user, isLoading });
  }, []);

  useEffect(() => {
    console.log('🔵 AppNavigator - Auth state changed', { isAuthenticated, user, isLoading });
  }, [isAuthenticated, user, isLoading]);

  // Show loading screen during initial app load
  if (isLoading) {
    console.log('🔵 AppNavigator - Showing loading screen');
    return <Loading text="載入中..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && user ? (
          <Stack.Screen name="MainNavigator" component={MainNavigator} />
        ) : (
          <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;