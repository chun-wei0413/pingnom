import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../App';

// Mock Expo modules
jest.mock('expo-font');
jest.mock('expo-asset');

describe('App', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<App />);
    // This is a basic smoke test to ensure the app can render
    expect(true).toBe(true);
  });
});