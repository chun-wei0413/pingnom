import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { configureStore } from '@reduxjs/toolkit';
import EditProfileScreen from '../screens/EditProfileScreen';
import authSlice from '../store/authSlice';
import { api } from '../services/api';

jest.mock('../services/api');

const Stack = createStackNavigator();

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: {
          id: 'user123',
          email: 'test@example.com',
          display_name: 'Test User',
          created_at: '2024-01-01T00:00:00Z',
        },
        token: 'mock-token',
        ...initialState,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="EditProfile" component={() => component} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

const mockApi = api as jest.Mocked<typeof api>;

describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.updateProfile.mockResolvedValue({
      success: true,
      data: { message: 'Profile updated successfully' },
    });
    mockApi.getUserProfile.mockResolvedValue({
      success: true,
      data: {
        display_name: 'Test User',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      },
    });
  });

  it('should render edit profile form with current user data', async () => {
    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeTruthy();
      expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
    });

    expect(screen.getByText('編輯個人資料')).toBeTruthy();
    expect(screen.getByText('顯示名稱 *')).toBeTruthy();
    expect(screen.getByText('電子郵件 *')).toBeTruthy();
  });

  it('should validate required fields', async () => {
    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeTruthy();
    });

    const displayNameInput = screen.getByDisplayValue('Test User');
    const emailInput = screen.getByDisplayValue('test@example.com');
    
    fireEvent.changeText(displayNameInput, '');
    fireEvent.changeText(emailInput, '');

    const saveButton = screen.getByText('儲存變更');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updateProfile).not.toHaveBeenCalled();
    });
  });

  it('should validate email format', async () => {
    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
    });

    const emailInput = screen.getByDisplayValue('test@example.com');
    fireEvent.changeText(emailInput, 'invalid-email');

    const saveButton = screen.getByText('儲存變更');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updateProfile).not.toHaveBeenCalled();
    });
  });

  it('should validate display name length', async () => {
    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeTruthy();
    });

    const displayNameInput = screen.getByDisplayValue('Test User');
    fireEvent.changeText(displayNameInput, 'a'.repeat(51)); // 超過50字符限制

    const saveButton = screen.getByText('儲存變更');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updateProfile).not.toHaveBeenCalled();
    });
  });

  it('should update profile successfully', async () => {
    const mockGoBack = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      ...jest.requireActual('@react-navigation/native'),
      useNavigation: () => ({
        goBack: mockGoBack,
      }),
    }));

    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeTruthy();
    });

    const displayNameInput = screen.getByDisplayValue('Test User');
    const emailInput = screen.getByDisplayValue('test@example.com');

    fireEvent.changeText(displayNameInput, 'Updated Name');
    fireEvent.changeText(emailInput, 'updated@example.com');

    const saveButton = screen.getByText('儲存變更');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updateProfile).toHaveBeenCalledWith({
        display_name: 'Updated Name',
        email: 'updated@example.com',
      });
    });
  });

  it('should handle API error gracefully', async () => {
    mockApi.updateProfile.mockResolvedValue({
      success: false,
      message: 'Update failed',
    });

    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeTruthy();
    });

    const displayNameInput = screen.getByDisplayValue('Test User');
    fireEvent.changeText(displayNameInput, 'New Name');

    const saveButton = screen.getByText('儲存變更');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updateProfile).toHaveBeenCalled();
    });
  });

  it('should show loading state during save', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockApi.updateProfile.mockReturnValue(promise);

    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeTruthy();
    });

    const displayNameInput = screen.getByDisplayValue('Test User');
    fireEvent.changeText(displayNameInput, 'New Name');

    const saveButton = screen.getByText('儲存變更');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('儲存中...')).toBeTruthy();
    });

    resolvePromise!({
      success: true,
      data: { message: 'Updated' },
    });

    await waitFor(() => {
      expect(screen.getByText('儲存變更')).toBeTruthy();
    });
  });

  it('should load user profile data on mount', async () => {
    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => {
      expect(mockApi.getUserProfile).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeTruthy();
      expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
    });
  });

  it('should handle profile loading error', async () => {
    mockApi.getUserProfile.mockResolvedValue({
      success: false,
      message: 'Failed to load profile',
    });

    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => {
      expect(mockApi.getUserProfile).toHaveBeenCalled();
    });

    expect(screen.getByText('載入中...')).toBeTruthy();
  });

  it('should cancel editing and go back', () => {
    const mockGoBack = jest.fn();
    
    jest.mock('@react-navigation/native', () => ({
      ...jest.requireActual('@react-navigation/native'),
      useNavigation: () => ({
        goBack: mockGoBack,
      }),
    }));

    renderWithProviders(<EditProfileScreen />);

    const cancelButton = screen.getByText('取消');
    fireEvent.press(cancelButton);

    expect(mockGoBack).toHaveBeenCalled();
  });
});