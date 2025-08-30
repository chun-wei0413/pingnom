import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Loading from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { register, clearError } from '@/store/slices/authSlice';
import { AuthStackScreenProps } from '@/types/navigation';

type RegisterScreenProps = AuthStackScreenProps<'Register'>;

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email 是必填欄位';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email 格式不正確';
    }

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = '顯示名稱是必填欄位';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = '顯示名稱至少需要2個字元';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = '密碼是必填欄位';
    } else if (formData.password.length < 8) {
      newErrors.password = '密碼至少需要8個字元';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = '密碼需包含大小寫字母、數字和特殊字元';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '請確認密碼';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '密碼確認不一致';
    }

    // Phone number validation (optional)
    if (formData.phoneNumber && !/^\+?[1-9]\d{8,14}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = '手機號碼格式不正確';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    dispatch(clearError());

    try {
      await dispatch(register({
        email: formData.email.toLowerCase().trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        password: formData.password,
        displayName: formData.displayName.trim(),
      })).unwrap();

      Alert.alert(
        '註冊成功！',
        '您的帳號已成功建立，請使用您的 Email 和密碼登入。',
        [
          {
            text: '前往登入',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      // Error is handled by Redux slice
      console.log('Registration error:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>加入 Pingnom</Text>
            <Text style={styles.subtitle}>建立帳號，開始與朋友們一起用餐！</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="顯示名稱"
              value={formData.displayName}
              onChangeText={(value) => handleInputChange('displayName', value)}
              placeholder="輸入您的名字"
              leftIcon="person-outline"
              error={errors.displayName}
              autoCapitalize="words"
            />

            <Input
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="輸入您的 Email"
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="手機號碼 (選填)"
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              placeholder="+886912345678"
              leftIcon="call-outline"
              keyboardType="phone-pad"
              error={errors.phoneNumber}
            />

            <Input
              label="密碼"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="輸入密碼"
              leftIcon="lock-closed-outline"
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="確認密碼"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="再次輸入密碼"
              leftIcon="lock-closed-outline"
              secureTextEntry
              error={errors.confirmPassword}
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title="註冊"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
            />

            <Button
              title="已有帳號？立即登入"
              onPress={() => navigation.navigate('Login')}
              variant="text"
              style={styles.loginButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {isLoading && <Loading overlay text="建立帳號中..." />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  registerButton: {
    marginTop: 8,
  },
  loginButton: {
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default RegisterScreen;