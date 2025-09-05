import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      '確認登出',
      '您確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '登出', 
          style: 'destructive',
          onPress: () => dispatch(logout())
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('功能開發中', '個人資料編輯功能正在開發中...');
  };

  const handleSettings = () => {
    Alert.alert('功能開發中', '設定功能正在開發中...');
  };

  const renderMenuOption = (title: string, subtitle: string, onPress: () => void, isDestructive = false) => (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={styles.menuOptionContent}>
        <Text style={[styles.menuOptionTitle, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
        <Text style={styles.menuOptionSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.menuOptionArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>個人資料</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImage}>
            <Text style={styles.profileEmoji}>👤</Text>
          </View>
          <Text style={styles.profileName}>{user?.display_name || '使用者'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>編輯個人資料</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>帳戶</Text>
          {renderMenuOption(
            '個人資料設定',
            '管理您的個人資訊',
            handleEditProfile
          )}
          {renderMenuOption(
            '隱私設定',
            '管理隱私和安全設定',
            handleSettings
          )}
          {renderMenuOption(
            '通知設定',
            '管理推播通知設定',
            handleSettings
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>應用程式</Text>
          {renderMenuOption(
            '關於 Pingnom',
            '版本資訊和使用條款',
            () => Alert.alert('關於', 'Pingnom v1.0.0\n美食社交應用程式')
          )}
          {renderMenuOption(
            '說明與支援',
            '取得使用說明和客服支援',
            () => Alert.alert('說明', '如需協助請聯繫客服')
          )}
        </View>

        <View style={styles.menuSection}>
          {renderMenuOption(
            '登出',
            '登出您的帳戶',
            handleLogout,
            true
          )}
        </View>

        {/* Version Info */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Pingnom v1.0.0</Text>
          <Text style={styles.versionSubtext}>美食社交，從這裡開始</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 32,
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileEmoji: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuOptionContent: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  menuOptionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  menuOptionArrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  destructiveText: {
    color: '#dc2626',
  },
  versionSection: {
    alignItems: 'center',
    padding: 32,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
});