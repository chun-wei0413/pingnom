import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';

type PrivacyNavigationProp = StackNavigationProp<ProfileStackParamList>;

export default function PrivacyScreen() {
  const navigation = useNavigation<PrivacyNavigationProp>();
  
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [allowFriendRequest, setAllowFriendRequest] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    loadCurrentPrivacySettings();
  }, []);

  const loadCurrentPrivacySettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await api.getUserProfile();
      
      if (response.success && response.data?.privacy_settings) {
        const privacy = response.data.privacy_settings;
        setIsDiscoverable(privacy.is_discoverable ?? true);
        setShowLocation(privacy.show_location ?? true);
        setAllowFriendRequest(privacy.allow_friend_request ?? true);
      }
    } catch (error) {
      console.error('載入隱私設定失敗:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const privacyData = {
        isDiscoverable,
        showLocation,
        allowFriendRequest,
      };

      console.log('Updating privacy settings:', privacyData);
      
      const response = await api.updatePrivacy(privacyData);
      console.log('Update privacy response:', response);

      if (response.success) {
        Alert.alert(
          '成功',
          '隱私設定已更新',
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
      console.error('更新隱私設定失敗:', error);
      Alert.alert('錯誤', '更新失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
        thumbColor={value ? '#3b82f6' : '#f3f4f6'}
      />
    </View>
  );

  if (loadingSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>載入隱私設定中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>隱私設定</Text>
          <Text style={styles.headerSubtitle}>管理您的隱私和安全設定</Text>
        </View>

        {/* 隱私設定選項 */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>個人隱私</Text>
          
          {renderSettingItem(
            '允許被搜尋',
            '其他用戶可以透過搜尋找到您',
            isDiscoverable,
            setIsDiscoverable,
            '🔍'
          )}

          {renderSettingItem(
            '顯示位置資訊',
            '在聚餐活動中顯示您的位置',
            showLocation,
            setShowLocation,
            '📍'
          )}

          {renderSettingItem(
            '接受好友邀請',
            '其他用戶可以向您發送好友邀請',
            allowFriendRequest,
            setAllowFriendRequest,
            '👥'
          )}
        </View>

        {/* 隱私說明 */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyNoticeIcon}>🔒</Text>
          <View style={styles.privacyNoticeContent}>
            <Text style={styles.privacyNoticeTitle}>您的隱私很重要</Text>
            <Text style={styles.privacyNoticeText}>
              我們會保護您的個人資訊。您可以隨時調整這些設定，控制其他用戶能看到的資訊範圍。
            </Text>
          </View>
        </View>

        {/* 儲存按鈕 */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '儲存中...' : '儲存隱私設定'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  privacyNotice: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 24,
  },
  privacyNoticeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  privacyNoticeContent: {
    flex: 1,
  },
  privacyNoticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  privacyNoticeText: {
    fontSize: 13,
    color: '#a16207',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});