import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import userApi from '@/services/api/userApi';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import { HomeTabsScreenProps } from '@/types/navigation';
import { logout } from '@/store/slices/authSlice';

type ProfileScreenProps = HomeTabsScreenProps<'Profile'>;

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'privacy'>('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    displayName: user?.profile?.displayName || '',
    bio: user?.profile?.bio || '',
    avatar: user?.profile?.avatar || '',
  });

  // Preferences state
  const [preferencesData, setPreferencesData] = useState({
    cuisineTypes: user?.preferences?.cuisineTypes || [],
    restrictions: user?.preferences?.restrictions || [],
    minPrice: user?.preferences?.priceRange?.min || 0,
    maxPrice: user?.preferences?.priceRange?.max || 1000,
  });

  // Privacy state
  const [privacyData, setPrivacyData] = useState({
    isDiscoverable: user?.privacySettings?.isDiscoverable || true,
    showLocation: user?.privacySettings?.showLocation || true,
    allowFriendRequest: user?.privacySettings?.allowFriendRequest || true,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await userApi.updateProfile(profileData);
      Alert.alert('成功', '個人檔案已更新');
    } catch (error) {
      Alert.alert('錯誤', '更新個人檔案失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      await userApi.updatePreferences(preferencesData);
      Alert.alert('成功', '偏好設定已更新');
    } catch (error) {
      Alert.alert('錯誤', '更新偏好設定失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setLoading(true);
      await userApi.updatePrivacy(privacyData);
      Alert.alert('成功', '隱私設定已更新');
    } catch (error) {
      Alert.alert('錯誤', '更新隱私設定失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('錯誤', '新密碼與確認密碼不一致');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      Alert.alert('錯誤', '新密碼至少需要8個字元');
      return;
    }

    try {
      setLoading(true);
      await userApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      
      Alert.alert(
        '密碼已更新',
        '您的密碼已成功更新，請重新登入',
        [
          {
            text: '確定',
            onPress: () => {
              setShowPasswordModal(false);
              setPasswordData({
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              dispatch(logout());
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('錯誤', '密碼更新失敗，請檢查舊密碼是否正確');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '確認登出',
      '您確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '登出',
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
        onPress={() => setActiveTab('profile')}
      >
        <Ionicons
          name="person-outline"
          size={20}
          color={activeTab === 'profile' ? '#FF6B35' : '#666'}
        />
        <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
          個人檔案
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'preferences' && styles.activeTab]}
        onPress={() => setActiveTab('preferences')}
      >
        <Ionicons
          name="restaurant-outline"
          size={20}
          color={activeTab === 'preferences' ? '#FF6B35' : '#666'}
        />
        <Text style={[styles.tabText, activeTab === 'preferences' && styles.activeTabText]}>
          偏好設定
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
        onPress={() => setActiveTab('privacy')}
      >
        <Ionicons
          name="shield-outline"
          size={20}
          color={activeTab === 'privacy' ? '#FF6B35' : '#666'}
        />
        <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
          隱私設定
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本資料</Text>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            {profileData.avatar ? (
              <Image
                source={{ uri: profileData.avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={60} color="#999" />
            )}
          </View>
          <TouchableOpacity style={styles.changeAvatarButton}>
            <Ionicons name="camera-outline" size={20} color="#FF6B35" />
            <Text style={styles.changeAvatarText}>更改頭像</Text>
          </TouchableOpacity>
        </View>

        <Input
          label="顯示名稱"
          value={profileData.displayName}
          onChangeText={(text) =>
            setProfileData((prev) => ({ ...prev, displayName: text }))
          }
          placeholder="輸入您的顯示名稱"
        />

        <Input
          label="個人簡介"
          value={profileData.bio}
          onChangeText={(text) =>
            setProfileData((prev) => ({ ...prev, bio: text }))
          }
          placeholder="簡短介紹您自己..."
          multiline
          numberOfLines={3}
          style={styles.bioInput}
        />

        <Button
          title="儲存個人檔案"
          onPress={handleSaveProfile}
          disabled={loading}
          style={styles.saveButton}
        />

        <View style={styles.actionSection}>
          <Button
            title="修改密碼"
            onPress={() => setShowPasswordModal(true)}
            variant="outline"
            style={styles.actionButton}
          />

          <Button
            title="登出"
            onPress={handleLogout}
            variant="outline"
            style={[styles.actionButton, styles.logoutButton]}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderPreferencesTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>飲食偏好</Text>
        <Text style={styles.sectionDescription}>
          設定您的飲食偏好，讓我們為您推薦更合適的餐廳
        </Text>

        <View style={styles.preferenceGroup}>
          <Text style={styles.preferenceLabel}>價位範圍 (NT$)</Text>
          <View style={styles.priceRangeContainer}>
            <Input
              value={preferencesData.minPrice.toString()}
              onChangeText={(text) =>
                setPreferencesData((prev) => ({
                  ...prev,
                  minPrice: parseInt(text) || 0,
                }))
              }
              placeholder="最低"
              keyboardType="numeric"
              style={styles.priceInput}
            />
            <Text style={styles.priceSeparator}>-</Text>
            <Input
              value={preferencesData.maxPrice.toString()}
              onChangeText={(text) =>
                setPreferencesData((prev) => ({
                  ...prev,
                  maxPrice: parseInt(text) || 1000,
                }))
              }
              placeholder="最高"
              keyboardType="numeric"
              style={styles.priceInput}
            />
          </View>
        </View>

        <Button
          title="儲存偏好設定"
          onPress={handleSavePreferences}
          disabled={loading}
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );

  const renderPrivacyTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>隱私設定</Text>
        <Text style={styles.sectionDescription}>
          管理您的隱私偏好和資料可見性
        </Text>

        <View style={styles.privacyOption}>
          <View style={styles.privacyOptionInfo}>
            <Text style={styles.privacyOptionTitle}>允許被發現</Text>
            <Text style={styles.privacyOptionDescription}>
              其他用戶可以在搜尋中找到您
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              privacyData.isDiscoverable && styles.toggleActive,
            ]}
            onPress={() =>
              setPrivacyData((prev) => ({
                ...prev,
                isDiscoverable: !prev.isDiscoverable,
              }))
            }
          >
            <View
              style={[
                styles.toggleThumb,
                privacyData.isDiscoverable && styles.toggleThumbActive,
              ]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.privacyOption}>
          <View style={styles.privacyOptionInfo}>
            <Text style={styles.privacyOptionTitle}>分享位置</Text>
            <Text style={styles.privacyOptionDescription}>
              允許朋友看到您的位置資訊
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              privacyData.showLocation && styles.toggleActive,
            ]}
            onPress={() =>
              setPrivacyData((prev) => ({
                ...prev,
                showLocation: !prev.showLocation,
              }))
            }
          >
            <View
              style={[
                styles.toggleThumb,
                privacyData.showLocation && styles.toggleThumbActive,
              ]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.privacyOption}>
          <View style={styles.privacyOptionInfo}>
            <Text style={styles.privacyOptionTitle}>接受好友邀請</Text>
            <Text style={styles.privacyOptionDescription}>
              允許其他用戶向您發送好友邀請
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              privacyData.allowFriendRequest && styles.toggleActive,
            ]}
            onPress={() =>
              setPrivacyData((prev) => ({
                ...prev,
                allowFriendRequest: !prev.allowFriendRequest,
              }))
            }
          >
            <View
              style={[
                styles.toggleThumb,
                privacyData.allowFriendRequest && styles.toggleThumbActive,
              ]}
            />
          </TouchableOpacity>
        </View>

        <Button
          title="儲存隱私設定"
          onPress={handleSavePrivacy}
          disabled={loading}
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'privacy':
        return renderPrivacyTab();
      default:
        return renderProfileTab();
    }
  };

  if (loading) {
    return <Loading />;
  }

  const renderPasswordModal = () => (
    <Modal
      visible={showPasswordModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPasswordModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>修改密碼</Text>
            <TouchableOpacity
              onPress={() => setShowPasswordModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Input
              label="目前密碼"
              value={passwordData.oldPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, oldPassword: text }))
              }
              placeholder="輸入目前密碼"
              secureTextEntry
              style={styles.passwordInput}
            />

            <Input
              label="新密碼"
              value={passwordData.newPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, newPassword: text }))
              }
              placeholder="輸入新密碼 (至少8個字元)"
              secureTextEntry
              style={styles.passwordInput}
            />

            <Input
              label="確認新密碼"
              value={passwordData.confirmPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, confirmPassword: text }))
              }
              placeholder="再次輸入新密碼"
              secureTextEntry
              style={styles.passwordInput}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="取消"
              onPress={() => setShowPasswordModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="更新密碼"
              onPress={handleChangePassword}
              disabled={
                loading ||
                !passwordData.oldPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
              }
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>個人設定</Text>
      </View>
      {renderTabBar()}
      {renderContent()}
      {renderPasswordModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B35',
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 20,
  },
  changeAvatarText: {
    marginLeft: 6,
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  preferenceGroup: {
    marginBottom: 20,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#666',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  privacyOptionInfo: {
    flex: 1,
    marginRight: 16,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#FF6B35',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  saveButton: {
    marginTop: 24,
  },
  actionSection: {
    marginTop: 32,
    gap: 12,
  },
  actionButton: {
    borderColor: '#FF6B35',
  },
  logoutButton: {
    borderColor: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 300,
  },
  passwordInput: {
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  modalButton: {
    flex: 1,
  },
});

export default ProfileScreen;