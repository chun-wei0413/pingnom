import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/store';
import { loadStoredAuth } from './src/store/authSlice';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Load stored authentication on app start
    dispatch(loadStoredAuth() as any);
  }, [dispatch]);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
