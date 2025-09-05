import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { login } from '../store/authSlice';
import type { LoginRequest } from '../types/api';

export default function LoginScreen() {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleInputChange = (field: keyof LoginRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('錯誤', '請填入所有必要資料');
      return;
    }

    try {
      const result = await dispatch(login(formData));
      if (login.fulfilled.match(result)) {
        // Navigation will be handled automatically by AppNavigator
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    try {
      const result = await dispatch(login({ email, password }));
      if (login.fulfilled.match(result)) {
        // Navigation handled automatically
      }
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🍽️ Pingnom</Text>
            <Text style={styles.title}>歡迎回來</Text>
            <Text style={styles.subtitle}>登入開始您的美食社交之旅</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>電子郵件</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="請輸入電子郵件"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>密碼</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="請輸入密碼"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? '登入中...' : '登入'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Login Options */}
          <View style={styles.quickLogin}>
            <Text style={styles.quickLoginTitle}>開發模式快速登入：</Text>
            
            <TouchableOpacity
              style={[styles.button, styles.quickLoginButton, styles.frankButton]}
              onPress={() => handleQuickLogin('testuser@pingnom.app', 'TestPassword2024!')}
              disabled={isLoading}
            >
              <Text style={styles.quickLoginButtonText}>👨‍💼 Frank Li (創建者)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.quickLoginButton, styles.aliceButton]}
              onPress={() => handleQuickLogin('alice@pingnom.app', 'AlicePassword2024!')}
              disabled={isLoading}
            >
              <Text style={styles.quickLoginButtonText}>👩‍💼 Alice Wang (邀請對象)</Text>
            </TouchableOpacity>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickLogin: {
    marginTop: 16,
  },
  quickLoginTitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  quickLoginButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
  },
  quickLoginButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  frankButton: {
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
  },
  aliceButton: {
    backgroundColor: '#ede9fe',
    borderColor: '#c4b5fd',
  },
});