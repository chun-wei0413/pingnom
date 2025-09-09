import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { configureStore } from '@reduxjs/toolkit';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import authSlice from '../store/authSlice';
import { api } from '../services/api';

jest.mock('../services/api');

type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Preferences: undefined;
  Privacy: undefined;
  ChangePassword: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

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

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="ProfileHome">
      <Stack.Screen 
        name="ProfileHome" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: '編輯個人資料' }}
      />
      <Stack.Screen 
        name="Preferences" 
        component={PreferencesScreen}
        options={{ title: '偏好設定' }}
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen}
        options={{ title: '隱私設定' }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ title: '變更密碼' }}
      />
    </Stack.Navigator>
  );
};

const renderWithProviders = (store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        <ProfileStackNavigator />
      </NavigationContainer>
    </Provider>
  );
};

const mockApi = api as jest.Mocked<typeof api>;

describe('Profile Navigation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock all API responses
    mockApi.updateProfile.mockResolvedValue({
      success: true,
      data: { message: 'Profile updated successfully' },
    });
    
    mockApi.updatePreferences.mockResolvedValue({
      success: true,
      data: { message: 'Preferences updated successfully' },
    });
    
    mockApi.updatePrivacy.mockResolvedValue({
      success: true,
      data: { message: 'Privacy settings updated successfully' },
    });
    
    mockApi.changePassword.mockResolvedValue({
      success: true,
      data: { message: 'Password changed successfully' },
    });
    
    mockApi.getUserProfile.mockResolvedValue({
      success: true,
      data: {
        display_name: 'Test User',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        preferences: {
          cuisine_types: ['chinese', 'japanese'],
          dietary_restrictions: ['vegetarian'],
          min_price: 100,
          max_price: 800,
        },
        privacy_settings: {
          is_discoverable: true,
          show_location: true,
          allow_friend_request: true,
        },
      },
    });
  });

  it('should start with ProfileScreen', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('個人資料')).toBeTruthy();
    });

    expect(screen.getByText('Test User')).toBeTruthy();
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('should navigate from ProfileScreen to EditProfile', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('個人資料設定')).toBeTruthy();
    });

    const editProfileOption = screen.getByText('個人資料設定');
    fireEvent.press(editProfileOption);

    await waitFor(() => {
      expect(screen.getByText('編輯個人資料')).toBeTruthy();
    });

    expect(screen.getByText('顯示名稱 *')).toBeTruthy();
    expect(screen.getByText('電子郵件 *')).toBeTruthy();
  });

  it('should navigate from ProfileScreen to Preferences', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('偏好設定')).toBeTruthy();
    });

    const preferencesOption = screen.getByText('偏好設定');
    fireEvent.press(preferencesOption);

    await waitFor(() => {
      expect(screen.getByText('料理偏好')).toBeTruthy();
    });

    expect(screen.getByText('飲食限制')).toBeTruthy();
    expect(screen.getByText('價格範圍')).toBeTruthy();
  });

  it('should navigate from ProfileScreen to Privacy', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('隱私設定')).toBeTruthy();
    });

    const privacyOption = screen.getByText('隱私設定');
    fireEvent.press(privacyOption);

    await waitFor(() => {
      expect(screen.getByText('個人隱私')).toBeTruthy();
    });

    expect(screen.getByText('允許被搜尋')).toBeTruthy();
    expect(screen.getByText('顯示位置資訊')).toBeTruthy();
    expect(screen.getByText('接受好友邀請')).toBeTruthy();
  });

  it('should navigate from ProfileScreen to ChangePassword', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('變更密碼')).toBeTruthy();
    });

    const changePasswordOption = screen.getByText('變更密碼');
    fireEvent.press(changePasswordOption);

    await waitFor(() => {
      expect(screen.getByText('目前密碼 *')).toBeTruthy();
    });

    expect(screen.getByText('新密碼 *')).toBeTruthy();
    expect(screen.getByText('確認新密碼 *')).toBeTruthy();
  });

  it('should navigate using the edit profile button', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('編輯個人資料')).toBeTruthy();
    });

    const editButton = screen.getByText('編輯個人資料');
    fireEvent.press(editButton);

    await waitFor(() => {
      expect(screen.getByText('顯示名稱 *')).toBeTruthy();
    });
  });

  it('should complete full user flow: Profile -> EditProfile -> Save -> Back', async () => {
    renderWithProviders();

    // 開始在ProfileScreen
    await waitFor(() => {
      expect(screen.getByText('個人資料設定')).toBeTruthy();
    });

    // 導航到EditProfile
    const editProfileOption = screen.getByText('個人資料設定');
    fireEvent.press(editProfileOption);

    await waitFor(() => {
      expect(screen.getByText('編輯個人資料')).toBeTruthy();
    });

    // 編輯資料
    const displayNameInput = screen.getByDisplayValue('Test User');
    fireEvent.changeText(displayNameInput, 'Updated User');

    // 保存變更
    const saveButton = screen.getByText('儲存變更');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updateProfile).toHaveBeenCalledWith({
        display_name: 'Updated User',
        email: 'test@example.com',
      });
    });

    // 應該回到ProfileScreen
    await waitFor(() => {
      expect(screen.getByText('個人資料')).toBeTruthy();
    });
  });

  it('should complete preferences flow: Profile -> Preferences -> Save -> Back', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('偏好設定')).toBeTruthy();
    });

    // 導航到Preferences
    const preferencesOption = screen.getByText('偏好設定');
    fireEvent.press(preferencesOption);

    await waitFor(() => {
      expect(screen.getByText('料理偏好')).toBeTruthy();
    });

    // 選擇料理類型
    const chineseOption = screen.getByText('中式料理');
    fireEvent.press(chineseOption);

    // 保存偏好設定
    const saveButton = screen.getByText('儲存偏好設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updatePreferences).toHaveBeenCalled();
    });

    // 應該回到ProfileScreen
    await waitFor(() => {
      expect(screen.getByText('個人資料')).toBeTruthy();
    });
  });

  it('should complete privacy flow: Profile -> Privacy -> Save -> Back', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('隱私設定')).toBeTruthy();
    });

    // 導航到Privacy
    const privacyOption = screen.getByText('隱私設定');
    fireEvent.press(privacyOption);

    await waitFor(() => {
      expect(screen.getByText('個人隱私')).toBeTruthy();
    });

    // 修改隱私設定
    const discoverableToggle = screen.getAllByRole('switch')[0];
    fireEvent(discoverableToggle, 'onValueChange', false);

    // 保存隱私設定
    const saveButton = screen.getByText('儲存隱私設定');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockApi.updatePrivacy).toHaveBeenCalled();
    });

    // 應該回到ProfileScreen
    await waitFor(() => {
      expect(screen.getByText('個人資料')).toBeTruthy();
    });
  });

  it('should complete password change flow: Profile -> ChangePassword -> Save -> Back', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('變更密碼')).toBeTruthy();
    });

    // 導航到ChangePassword
    const changePasswordOption = screen.getByText('變更密碼');
    fireEvent.press(changePasswordOption);

    await waitFor(() => {
      expect(screen.getByText('目前密碼 *')).toBeTruthy();
    });

    // 輸入密碼
    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(newPasswordInput, 'NewPassword456!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword456!');

    // 更新密碼
    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword456!',
      });
    });

    // 應該回到ProfileScreen
    await waitFor(() => {
      expect(screen.getByText('個人資料')).toBeTruthy();
    });
  });

  it('should handle cancel actions correctly', async () => {
    renderWithProviders();

    // 測試取消編輯個人資料
    await waitFor(() => {
      expect(screen.getByText('個人資料設定')).toBeTruthy();
    });

    const editProfileOption = screen.getByText('個人資料設定');
    fireEvent.press(editProfileOption);

    await waitFor(() => {
      expect(screen.getByText('取消')).toBeTruthy();
    });

    const cancelButton = screen.getByText('取消');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('個人資料')).toBeTruthy();
    });
  });

  it('should maintain navigation state during API operations', async () => {
    // 模擬慢速API
    let resolveProfileUpdate: (value: any) => void;
    const profileUpdatePromise = new Promise((resolve) => {
      resolveProfileUpdate = resolve;
    });
    
    mockApi.updateProfile.mockReturnValue(profileUpdatePromise);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('個人資料設定')).toBeTruthy();
    });

    // 導航到編輯頁面
    const editProfileOption = screen.getByText('個人資料設定');
    fireEvent.press(editProfileOption);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeTruthy();
    });

    // 修改並保存
    const displayNameInput = screen.getByDisplayValue('Test User');
    fireEvent.changeText(displayNameInput, 'New Name');

    const saveButton = screen.getByText('儲存變更');
    fireEvent.press(saveButton);

    // 應該顯示載入狀態
    await waitFor(() => {
      expect(screen.getByText('儲存中...')).toBeTruthy();
    });

    // 完成API操作
    resolveProfileUpdate!({
      success: true,
      data: { message: 'Updated' },
    });

    // 應該回到主頁面
    await waitFor(() => {
      expect(screen.getByText('個人資料')).toBeTruthy();
    });
  });

  it('should handle API errors without breaking navigation', async () => {
    mockApi.updateProfile.mockResolvedValue({
      success: false,
      message: 'Update failed',
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('個人資料設定')).toBeTruthy();
    });

    const editProfileOption = screen.getByText('個人資料設定');
    fireEvent.press(editProfileOption);

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

    // 即使API失敗，導航應該仍然正常
    expect(screen.getByText('編輯個人資料')).toBeTruthy();
  });
});