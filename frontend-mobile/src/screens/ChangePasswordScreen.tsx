import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';

type ChangePasswordNavigationProp = StackNavigationProp<ProfileStackParamList>;

export default function ChangePasswordScreen() {
  const navigation = useNavigation<ChangePasswordNavigationProp>();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePasswordInput = () => {
    if (!currentPassword.trim()) {
      Alert.alert('錯誤', '請輸入目前密碼');
      return false;
    }

    if (!newPassword.trim()) {
      Alert.alert('錯誤', '請輸入新密碼');
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert('錯誤', '新密碼至少需要8個字符');
      return false;
    }

    // 密碼複雜度檢查
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChars))) {
      Alert.alert(
        '密碼強度不足',
        '密碼必須包含大寫字母、小寫字母，以及數字或特殊字符'
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('錯誤', '新密碼與確認密碼不一致');
      return false;
    }

    if (currentPassword === newPassword) {
      Alert.alert('錯誤', '新密碼不能與目前密碼相同');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordInput()) {
      return;
    }

    try {
      setLoading(true);
      
      const passwordData = {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      };

      console.log('Changing password...');
      
      const response = await api.changePassword(passwordData);
      console.log('Change password response:', response);

      if (response.success) {
        Alert.alert(
          '成功',
          '密碼已更新，請重新登入',
          [
            {
              text: '確定',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        
        // 清空表單
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('錯誤', response.message || '密碼更新失敗');
      }
    } catch (error) {
      console.error('更新密碼失敗:', error);
      Alert.alert('錯誤', '更新失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    showPassword: boolean,
    toggleShowPassword: () => void,
    placeholder: string
  ) => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.showPasswordButton}
          onPress={toggleShowPassword}
        >
          <Text style={styles.showPasswordText}>
            {showPassword ? '隱藏' : '顯示'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>變更密碼</Text>
            <Text style={styles.headerSubtitle}>
              設定新密碼以保護您的帳戶安全
            </Text>
          </View>

          {/* Password Form */}
          <View style={styles.formContainer}>
            {renderPasswordInput(
              '目前密碼 *',
              currentPassword,
              setCurrentPassword,
              showCurrentPassword,
              () => setShowCurrentPassword(!showCurrentPassword),
              '輸入目前密碼'
            )}

            {renderPasswordInput(
              '新密碼 *',
              newPassword,
              setNewPassword,
              showNewPassword,
              () => setShowNewPassword(!showNewPassword),
              '輸入新密碼'
            )}

            {renderPasswordInput(
              '確認新密碼 *',
              confirmPassword,
              setConfirmPassword,
              showConfirmPassword,
              () => setShowConfirmPassword(!showConfirmPassword),
              '再次輸入新密碼'
            )}

            {/* 密碼要求說明 */}
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>密碼要求：</Text>
              <View style={styles.requirementsList}>
                <Text style={styles.requirementItem}>• 至少8個字符</Text>
                <Text style={styles.requirementItem}>• 包含大寫字母</Text>
                <Text style={styles.requirementItem}>• 包含小寫字母</Text>
                <Text style={styles.requirementItem}>• 包含數字或特殊字符</Text>
              </View>
            </View>

            {/* 更新按鈕 */}
            <TouchableOpacity
              style={[styles.changeButton, loading && styles.changeButtonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={styles.changeButtonText}>
                {loading ? '更新中...' : '更新密碼'}
              </Text>
            </TouchableOpacity>

            {/* 取消按鈕 */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>

          {/* 安全提醒 */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityNoticeIcon}>🔒</Text>
            <View style={styles.securityNoticeContent}>
              <Text style={styles.securityNoticeTitle}>安全提醒</Text>
              <Text style={styles.securityNoticeText}>
                為了保護您的帳戶安全，建議您定期更換密碼，不要與其他網站使用相同密碼。
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  showPasswordButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  showPasswordText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  passwordRequirements: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  requirementsList: {
    marginLeft: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 2,
  },
  changeButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  changeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  securityNotice: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
  },
  securityNoticeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  securityNoticeContent: {
    flex: 1,
  },
  securityNoticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  securityNoticeText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
});