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
import { login, clearError } from '@/store/slices/authSlice';
import { AuthStackScreenProps } from '@/types/navigation';

type LoginScreenProps = AuthStackScreenProps<'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    // Password validation
    if (!formData.password) {
      newErrors.password = '密碼是必填欄位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    dispatch(clearError());

    try {
      await dispatch(login({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      })).unwrap();

      // Navigation to main app will be handled by AuthNavigator
    } catch (error) {
      // Error is handled by Redux slice
      console.log('Login error:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      '忘記密碼',
      '忘記密碼功能將在未來版本中實作。',
      [{ text: '了解', style: 'default' }]
    );
  };

  const handleDemoLogin = (email: string, password: string, displayName: string) => {
    setFormData({ email, password });
    setErrors({});
    
    setTimeout(() => {
      dispatch(login({ email, password }));
    }, 100);
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
            <Text style={styles.title}>歡迎回來</Text>
            <Text style={styles.subtitle}>登入 Pingnom，開始您的美食聚會！</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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
              label="密碼"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="輸入密碼"
              leftIcon="lock-closed-outline"
              secureTextEntry
              error={errors.password}
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title="登入"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            />

            <Button
              title="忘記密碼？"
              onPress={handleForgotPassword}
              variant="text"
              size="small"
              style={styles.forgotButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>或</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="建立新帳號"
              onPress={() => navigation.navigate('Register')}
              variant="outline"
              style={styles.registerButton}
            />

            {/* Demo Login Buttons - Development Only */}
            {__DEV__ && (
              <>
                <View style={styles.demoSection}>
                  <Text style={styles.demoTitle}>快速測試登入</Text>
                  <Button
                    title="👨‍💼 Frank Li (創建者)"
                    onPress={() => handleDemoLogin('testuser@pingnom.app', 'TestPassword2024!', 'Frank Li')}
                    variant="secondary"
                    style={[styles.demoButton, styles.frankButton]}
                  />
                  <Button
                    title="👩‍💼 Alice Wang (邀請對象)"
                    onPress={() => handleDemoLogin('alice@pingnom.app', 'AlicePassword2024!', 'Alice Wang')}
                    variant="secondary"
                    style={[styles.demoButton, styles.aliceButton]}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {isLoading && <Loading overlay text="登入中..." />}
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
    marginBottom: 48,
    paddingTop: 40,
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
  loginButton: {
    marginTop: 8,
  },
  forgotButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  registerButton: {
    marginBottom: 24,
  },
  demoSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0EA5E9',
    textAlign: 'center',
    marginBottom: 12,
  },
  demoButton: {
    marginBottom: 8,
  },
  frankButton: {
    backgroundColor: '#10B981',
  },
  aliceButton: {
    backgroundColor: '#8B5CF6',
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

export default LoginScreen;