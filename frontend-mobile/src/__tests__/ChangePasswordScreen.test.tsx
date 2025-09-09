import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { configureStore } from '@reduxjs/toolkit';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
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
          <Stack.Screen name="ChangePassword" component={() => component} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

const mockApi = api as jest.Mocked<typeof api>;

describe('ChangePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.changePassword.mockResolvedValue({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  });

  it('should render change password form', () => {
    renderWithProviders(<ChangePasswordScreen />);

    expect(screen.getByText('變更密碼')).toBeTruthy();
    expect(screen.getByText('目前密碼 *')).toBeTruthy();
    expect(screen.getByText('新密碼 *')).toBeTruthy();
    expect(screen.getByText('確認新密碼 *')).toBeTruthy();
    expect(screen.getByText('更新密碼')).toBeTruthy();
    expect(screen.getByText('取消')).toBeTruthy();
  });

  it('should validate required fields', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).not.toHaveBeenCalled();
    });
  });

  it('should validate current password is required', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).not.toHaveBeenCalled();
    });
  });

  it('should validate new password is required', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123!');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).not.toHaveBeenCalled();
    });
  });

  it('should validate password length requirement', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(newPasswordInput, '1234567'); // 少於8字符
    fireEvent.changeText(confirmPasswordInput, '1234567');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).not.toHaveBeenCalled();
    });
  });

  it('should validate password complexity requirements', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(newPasswordInput, 'onlylowercase'); // 缺少大寫字母和數字/特殊字符
    fireEvent.changeText(confirmPasswordInput, 'onlylowercase');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).not.toHaveBeenCalled();
    });
  });

  it('should validate passwords match', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(newPasswordInput, 'NewPassword123!');
    fireEvent.changeText(confirmPasswordInput, 'DifferentPassword123!');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).not.toHaveBeenCalled();
    });
  });

  it('should validate new password is different from current password', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    const samePassword = 'SamePassword123!';
    fireEvent.changeText(currentPasswordInput, samePassword);
    fireEvent.changeText(newPasswordInput, samePassword);
    fireEvent.changeText(confirmPasswordInput, samePassword);

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).not.toHaveBeenCalled();
    });
  });

  it('should change password successfully', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(newPasswordInput, 'NewPassword456!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword456!');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword456!',
      });
    });
  });

  it('should handle API error gracefully', async () => {
    mockApi.changePassword.mockResolvedValue({
      success: false,
      message: 'Current password is incorrect',
    });

    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'WrongPassword123!');
    fireEvent.changeText(newPasswordInput, 'NewPassword456!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword456!');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).toHaveBeenCalled();
    });
  });

  it('should show loading state during password change', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockApi.changePassword.mockReturnValue(promise);

    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(newPasswordInput, 'NewPassword456!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword456!');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(screen.getByText('更新中...')).toBeTruthy();
    });

    resolvePromise!({
      success: true,
      data: { message: 'Updated' },
    });

    await waitFor(() => {
      expect(screen.getByText('更新密碼')).toBeTruthy();
    });
  });

  it('should toggle password visibility', () => {
    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordToggle = screen.getAllByText('顯示')[0];
    const newPasswordToggle = screen.getAllByText('顯示')[1];
    const confirmPasswordToggle = screen.getAllByText('顯示')[2];

    fireEvent.press(currentPasswordToggle);
    expect(screen.getAllByText('隱藏')[0]).toBeTruthy();

    fireEvent.press(newPasswordToggle);
    expect(screen.getAllByText('隱藏')[1]).toBeTruthy();

    fireEvent.press(confirmPasswordToggle);
    expect(screen.getAllByText('隱藏')[2]).toBeTruthy();
  });

  it('should display password requirements', () => {
    renderWithProviders(<ChangePasswordScreen />);

    expect(screen.getByText('密碼要求：')).toBeTruthy();
    expect(screen.getByText('• 至少8個字符')).toBeTruthy();
    expect(screen.getByText('• 包含大寫字母')).toBeTruthy();
    expect(screen.getByText('• 包含小寫字母')).toBeTruthy();
    expect(screen.getByText('• 包含數字或特殊字符')).toBeTruthy();
  });

  it('should display security notice', () => {
    renderWithProviders(<ChangePasswordScreen />);

    expect(screen.getByText('安全提醒')).toBeTruthy();
    expect(screen.getByText('為了保護您的帳戶安全，建議您定期更換密碼，不要與其他網站使用相同密碼。')).toBeTruthy();
  });

  it('should clear form after successful password change', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(newPasswordInput, 'NewPassword456!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword456!');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).toHaveBeenCalled();
    });

    // 表單應該被清空
    expect(currentPasswordInput.props.value).toBe('');
    expect(newPasswordInput.props.value).toBe('');
    expect(confirmPasswordInput.props.value).toBe('');
  });

  it('should disable buttons while loading', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockApi.changePassword.mockReturnValue(promise);

    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(newPasswordInput, 'NewPassword456!');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword456!');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(screen.getByText('更新中...')).toBeTruthy();
    });

    // 載入期間按鈕應該被禁用
    const loadingButton = screen.getByText('更新中...');
    const cancelButton = screen.getByText('取消');
    
    expect(loadingButton.props.accessibilityState?.disabled).toBeTruthy();
    expect(cancelButton.props.accessibilityState?.disabled).toBeTruthy();

    resolvePromise!({
      success: true,
      data: { message: 'Updated' },
    });
  });

  it('should accept valid password with numbers', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(newPasswordInput, 'ValidPassword123'); // 有大小寫字母和數字
    fireEvent.changeText(confirmPasswordInput, 'ValidPassword123');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'ValidPassword123',
      });
    });
  });

  it('should accept valid password with special characters', async () => {
    renderWithProviders(<ChangePasswordScreen />);

    const currentPasswordInput = screen.getByPlaceholderText('輸入目前密碼');
    const newPasswordInput = screen.getByPlaceholderText('輸入新密碼');
    const confirmPasswordInput = screen.getByPlaceholderText('再次輸入新密碼');

    fireEvent.changeText(currentPasswordInput, 'CurrentPassword123!');
    fireEvent.changeText(newPasswordInput, 'ValidPassword!@#'); // 有大小寫字母和特殊字符
    fireEvent.changeText(confirmPasswordInput, 'ValidPassword!@#');

    const updateButton = screen.getByText('更新密碼');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'ValidPassword!@#',
      });
    });
  });
});