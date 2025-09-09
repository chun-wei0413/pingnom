import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { configureStore } from '@reduxjs/toolkit';
import PrivacyScreen from '../screens/PrivacyScreen';
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
          <Stack.Screen name="Privacy" component={() => component} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

const mockApi = api as jest.Mocked<typeof api>;

describe('PrivacyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.updatePrivacy.mockResolvedValue({
      success: true,
      data: { message: 'Privacy settings updated successfully' },
    });
    mockApi.getUserProfile.mockResolvedValue({
      success: true,
      data: {
        privacy_settings: {
          is_discoverable: true,
          show_location: true,
          allow_friend_request: true,
        },
      },
    });
  });

  it('should render privacy settings with current values', async () => {
    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('隱私設定')).toBeTruthy();
    });

    expect(screen.getByText('個人隱私')).toBeTruthy();
    expect(screen.getByText('允許被搜尋')).toBeTruthy();
    expect(screen.getByText('顯示位置資訊')).toBeTruthy();
    expect(screen.getByText('接受好友邀請')).toBeTruthy();
    expect(screen.getByText('您的隱私很重要')).toBeTruthy();
  });

  it('should toggle discoverable setting', async () => {
    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('允許被搜尋')).toBeTruthy();
    });

    const discoverableToggle = screen.getAllByRole('switch')[0];
    fireEvent(discoverableToggle, 'onValueChange', false);

    expect(discoverableToggle.props.value).toBe(false);
  });

  it('should toggle location sharing setting', async () => {
    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('顯示位置資訊')).toBeTruthy();
    });

    const locationToggle = screen.getAllByRole('switch')[1];
    fireEvent(locationToggle, 'onValueChange', false);

    expect(locationToggle.props.value).toBe(false);
  });

  it('should toggle friend request setting', async () => {
    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('接受好友邀請')).toBeTruthy();
    });

    const friendRequestToggle = screen.getAllByRole('switch')[2];
    fireEvent(friendRequestToggle, 'onValueChange', false);

    expect(friendRequestToggle.props.value).toBe(false);
  });

  it('should save privacy settings successfully', async () => {
    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('允許被搜尋')).toBeTruthy();
    });

    // 修改隱私設定
    const discoverableToggle = screen.getAllByRole('switch')[0];
    const locationToggle = screen.getAllByRole('switch')[1];
    const friendRequestToggle = screen.getAllByRole('switch')[2];

    fireEvent(discoverableToggle, 'onValueChange', false);
    fireEvent(locationToggle, 'onValueChange', false);
    fireEvent(friendRequestToggle, 'onValueChange', true);

    const saveButton = screen.getByText('儲存隱私設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updatePrivacy).toHaveBeenCalledWith({
        isDiscoverable: false,
        showLocation: false,
        allowFriendRequest: true,
      });
    });
  });

  it('should handle API error gracefully', async () => {
    mockApi.updatePrivacy.mockResolvedValue({
      success: false,
      message: 'Update failed',
    });

    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('儲存隱私設定')).toBeTruthy();
    });

    const saveButton = screen.getByText('儲存隱私設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updatePrivacy).toHaveBeenCalled();
    });
  });

  it('should show loading state during save', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockApi.updatePrivacy.mockReturnValue(promise);

    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('儲存隱私設定')).toBeTruthy();
    });

    const saveButton = screen.getByText('儲存隱私設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('儲存中...')).toBeTruthy();
    });

    resolvePromise!({
      success: true,
      data: { message: 'Updated' },
    });

    await waitFor(() => {
      expect(screen.getByText('儲存隱私設定')).toBeTruthy();
    });
  });

  it('should load current privacy settings on mount', async () => {
    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(mockApi.getUserProfile).toHaveBeenCalled();
    });
  });

  it('should handle privacy settings loading error', async () => {
    mockApi.getUserProfile.mockResolvedValue({
      success: false,
      message: 'Failed to load privacy settings',
    });

    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(mockApi.getUserProfile).toHaveBeenCalled();
    });

    expect(screen.getByText('載入隱私設定中...')).toBeTruthy();
  });

  it('should show loading indicator while fetching settings', () => {
    mockApi.getUserProfile.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<PrivacyScreen />);

    expect(screen.getByText('載入隱私設定中...')).toBeTruthy();
  });

  it('should display setting descriptions correctly', async () => {
    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('允許被搜尋')).toBeTruthy();
    });

    expect(screen.getByText('其他用戶可以透過搜尋找到您')).toBeTruthy();
    expect(screen.getByText('在聚餐活動中顯示您的位置')).toBeTruthy();
    expect(screen.getByText('其他用戶可以向您發送好友邀請')).toBeTruthy();
  });

  it('should display privacy notice', async () => {
    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('您的隱私很重要')).toBeTruthy();
    });

    expect(screen.getByText('我們會保護您的個人資訊。您可以隨時調整這些設定，控制其他用戶能看到的資訊範圍。')).toBeTruthy();
  });

  it('should handle missing privacy settings data', async () => {
    mockApi.getUserProfile.mockResolvedValue({
      success: true,
      data: {
        privacy_settings: null,
      },
    });

    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('隱私設定')).toBeTruthy();
    });

    // 應該顯示默認值 (true)
    const switches = screen.getAllByRole('switch');
    switches.forEach(switchElement => {
      expect(switchElement.props.value).toBe(true);
    });
  });

  it('should handle partial privacy settings data', async () => {
    mockApi.getUserProfile.mockResolvedValue({
      success: true,
      data: {
        privacy_settings: {
          is_discoverable: false,
          // 缺少 show_location 和 allow_friend_request
        },
      },
    });

    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('隱私設定')).toBeTruthy();
    });

    // 第一個開關應該是 false，其他應該是默認值 true
    const switches = screen.getAllByRole('switch');
    expect(switches[0].props.value).toBe(false);
    expect(switches[1].props.value).toBe(true);
    expect(switches[2].props.value).toBe(true);
  });

  it('should disable save button while loading', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockApi.updatePrivacy.mockReturnValue(promise);

    renderWithProviders(<PrivacyScreen />);

    await waitFor(() => {
      expect(screen.getByText('儲存隱私設定')).toBeTruthy();
    });

    const saveButton = screen.getByText('儲存隱私設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('儲存中...')).toBeTruthy();
    });

    // 在載入狀態下按鈕應該被禁用
    const disabledButton = screen.getByText('儲存中...');
    expect(disabledButton.props.accessibilityState?.disabled).toBeTruthy();

    resolvePromise!({
      success: true,
      data: { message: 'Updated' },
    });
  });
});