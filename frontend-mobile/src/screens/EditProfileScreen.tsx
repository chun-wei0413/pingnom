import React, { useState, useEffect } from 'react';
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
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootState } from '../store';
import type { MainTabParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';
import { updateUser } from '../store/authSlice';

type EditProfileNavigationProp = StackNavigationProp<MainTabParamList>;

export default function EditProfileScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<EditProfileNavigationProp>();
  const dispatch = useDispatch();
  
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const validateInput = () => {
    if (!displayName.trim()) {
      Alert.alert('錯誤', '顯示名稱不能為空');
      return false;
    }

    if (displayName.trim().length < 2) {
      Alert.alert('錯誤', '顯示名稱至少需要2個字符');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('錯誤', '電子信箱不能為空');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('錯誤', '請輸入有效的電子信箱格式');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateInput()) {
      return;
    }

    try {
      setLoading(true);
      
      const updateData = {
        display_name: displayName.trim(),
        email: email.trim(),
      };

      console.log('Updating profile:', updateData);
      
      const response = await api.updateProfile(updateData);
      console.log('Update profile response:', response);

      if (response.success) {
        // 更新 Redux store 中的用戶資料
        dispatch(updateUser({
          id: user?.id || '',
          display_name: displayName.trim(),
          email: email.trim(),
          created_at: user?.created_at || new Date().toISOString(),
        }));

        Alert.alert(
          '成功',
          '個人資料已更新',
          [
            {
              text: '確定',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('錯誤', response.message || '更新失敗');
      }
    } catch (error) {
      console.error('更新個人資料失敗:', error);
      Alert.alert('錯誤', '更新失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 恢復原始值
    setDisplayName(user?.display_name || '');
    setEmail(user?.email || '');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>編輯個人資料</Text>
          </View>

          {/* Profile Form */}
          <View style={styles.formContainer}>
            {/* Display Name */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>顯示名稱 *</Text>
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="請輸入顯示名稱"
                maxLength={50}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>電子信箱 *</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="請輸入電子信箱"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? '更新中...' : '儲存變更'}
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
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
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});