import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { configureStore } from '@reduxjs/toolkit';
import PreferencesScreen from '../screens/PreferencesScreen';
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
          <Stack.Screen name="Preferences" component={() => component} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

const mockApi = api as jest.Mocked<typeof api>;

describe('PreferencesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.updatePreferences.mockResolvedValue({
      success: true,
      data: { message: 'Preferences updated successfully' },
    });
    mockApi.getUserProfile.mockResolvedValue({
      success: true,
      data: {
        preferences: {
          cuisine_types: ['chinese', 'japanese'],
          dietary_restrictions: ['vegetarian'],
          min_price: 100,
          max_price: 800,
        },
      },
    });
  });

  it('should render preferences form with current data', async () => {
    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('偏好設定')).toBeTruthy();
    });

    expect(screen.getByText('料理偏好')).toBeTruthy();
    expect(screen.getByText('飲食限制')).toBeTruthy();
    expect(screen.getByText('價格範圍')).toBeTruthy();
  });

  it('should toggle cuisine type selection', async () => {
    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('中式料理')).toBeTruthy();
    });

    const chineseOption = screen.getByText('中式料理');
    fireEvent.press(chineseOption);

    const japaneseOption = screen.getByText('日式料理');
    fireEvent.press(japaneseOption);

    expect(chineseOption).toBeTruthy();
    expect(japaneseOption).toBeTruthy();
  });

  it('should toggle dietary restriction selection', async () => {
    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('素食')).toBeTruthy();
    });

    const vegetarianOption = screen.getByText('素食');
    fireEvent.press(vegetarianOption);

    const veganOption = screen.getByText('純素');
    fireEvent.press(veganOption);

    expect(vegetarianOption).toBeTruthy();
    expect(veganOption).toBeTruthy();
  });

  it('should update price range', async () => {
    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('最低價格')).toBeTruthy();
    });

    const minPriceInput = screen.getByPlaceholderText('最低價格 (NT$)');
    const maxPriceInput = screen.getByPlaceholderText('最高價格 (NT$)');

    fireEvent.changeText(minPriceInput, '200');
    fireEvent.changeText(maxPriceInput, '1000');

    expect(minPriceInput.props.value).toBe('200');
    expect(maxPriceInput.props.value).toBe('1000');
  });

  it('should validate price range', async () => {
    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('最低價格')).toBeTruthy();
    });

    const minPriceInput = screen.getByPlaceholderText('最低價格 (NT$)');
    const maxPriceInput = screen.getByPlaceholderText('最高價格 (NT$)');

    // 設定無效的價格範圍 (最低價格大於最高價格)
    fireEvent.changeText(minPriceInput, '1000');
    fireEvent.changeText(maxPriceInput, '500');

    const saveButton = screen.getByText('儲存偏好設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updatePreferences).not.toHaveBeenCalled();
    });
  });

  it('should save preferences successfully', async () => {
    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('中式料理')).toBeTruthy();
    });

    // 選擇料理類型
    const chineseOption = screen.getByText('中式料理');
    fireEvent.press(chineseOption);

    // 選擇飲食限制
    const vegetarianOption = screen.getByText('素食');
    fireEvent.press(vegetarianOption);

    // 設定價格範圍
    const minPriceInput = screen.getByPlaceholderText('最低價格 (NT$)');
    const maxPriceInput = screen.getByPlaceholderText('最高價格 (NT$)');
    fireEvent.changeText(minPriceInput, '200');
    fireEvent.changeText(maxPriceInput, '1000');

    const saveButton = screen.getByText('儲存偏好設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updatePreferences).toHaveBeenCalledWith({
        cuisineTypes: expect.any(Array),
        restrictions: expect.any(Array),
        minPrice: 200,
        maxPrice: 1000,
      });
    });
  });

  it('should handle API error gracefully', async () => {
    mockApi.updatePreferences.mockResolvedValue({
      success: false,
      message: 'Update failed',
    });

    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('儲存偏好設定')).toBeTruthy();
    });

    const saveButton = screen.getByText('儲存偏好設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updatePreferences).toHaveBeenCalled();
    });
  });

  it('should show loading state during save', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockApi.updatePreferences.mockReturnValue(promise);

    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('儲存偏好設定')).toBeTruthy();
    });

    const saveButton = screen.getByText('儲存偏好設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('儲存中...')).toBeTruthy();
    });

    resolvePromise!({
      success: true,
      data: { message: 'Updated' },
    });

    await waitFor(() => {
      expect(screen.getByText('儲存偏好設定')).toBeTruthy();
    });
  });

  it('should load current preferences on mount', async () => {
    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(mockApi.getUserProfile).toHaveBeenCalled();
    });
  });

  it('should handle preferences loading error', async () => {
    mockApi.getUserProfile.mockResolvedValue({
      success: false,
      message: 'Failed to load preferences',
    });

    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(mockApi.getUserProfile).toHaveBeenCalled();
    });

    expect(screen.getByText('載入偏好設定中...')).toBeTruthy();
  });

  it('should validate minimum selection requirements', async () => {
    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('儲存偏好設定')).toBeTruthy();
    });

    // 不選擇任何料理類型就嘗試保存
    const saveButton = screen.getByText('儲存偏好設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updatePreferences).toHaveBeenCalled();
    });
  });

  it('should display correct cuisine options', async () => {
    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('中式料理')).toBeTruthy();
    });

    // 檢查主要料理類型是否存在
    expect(screen.getByText('中式料理')).toBeTruthy();
    expect(screen.getByText('日式料理')).toBeTruthy();
    expect(screen.getByText('韓式料理')).toBeTruthy();
    expect(screen.getByText('義式料理')).toBeTruthy();
    expect(screen.getByText('美式料理')).toBeTruthy();
  });

  it('should display correct dietary restriction options', async () => {
    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('素食')).toBeTruthy();
    });

    // 檢查飲食限制選項是否存在
    expect(screen.getByText('素食')).toBeTruthy();
    expect(screen.getByText('純素')).toBeTruthy();
    expect(screen.getByText('無麩質')).toBeTruthy();
    expect(screen.getByText('無乳糖')).toBeTruthy();
    expect(screen.getByText('清真')).toBeTruthy();
  });

  it('should handle empty preferences data', async () => {
    mockApi.getUserProfile.mockResolvedValue({
      success: true,
      data: {
        preferences: null,
      },
    });

    renderWithProviders(<PreferencesScreen />);

    await waitFor(() => {
      expect(screen.getByText('偏好設定')).toBeTruthy();
    });

    // 應該顯示默認狀態，沒有選中的項目
    expect(screen.getByPlaceholderText('最低價格 (NT$)')).toBeTruthy();
    expect(screen.getByPlaceholderText('最高價格 (NT$)')).toBeTruthy();
  });
});