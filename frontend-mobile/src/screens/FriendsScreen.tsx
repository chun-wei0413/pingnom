import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent'>('friends');
  const [searchEmail, setSearchEmail] = useState('');

  const handleAddFriend = () => {
    if (!searchEmail.trim()) {
      Alert.alert('錯誤', '請輸入朋友的電子郵件');
      return;
    }

    Alert.alert('功能開發中', `將會發送好友邀請到 ${searchEmail}`);
    setSearchEmail('');
  };

  const renderTabButton = (tab: 'friends' | 'pending' | 'sent', title: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = (title: string, subtitle: string, icon: string) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>朋友</Text>
      </View>

      {/* Add Friend Section */}
      <View style={styles.addFriendSection}>
        <Text style={styles.sectionTitle}>新增朋友</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchEmail}
            onChangeText={setSearchEmail}
            placeholder="輸入朋友的電子郵件"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
            <Text style={styles.addButtonText}>發送邀請</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton('friends', '朋友清單')}
        {renderTabButton('pending', '待處理')}
        {renderTabButton('sent', '已發送')}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.tabContent}>
        {activeTab === 'friends' && renderEmptyState(
          '還沒有任何朋友',
          '開始搜尋並新增朋友來開始您的社交之旅！',
          '👥'
        )}

        {activeTab === 'pending' && renderEmptyState(
          '沒有待處理的邀請',
          '當有朋友發送好友邀請給您時，會在這裡顯示',
          '📬'
        )}

        {activeTab === 'sent' && renderEmptyState(
          '沒有已發送的邀請',
          '您發送的好友邀請會在這裡顯示',
          '📤'
        )}
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
  addFriendSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9fafb',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});