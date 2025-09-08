import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  requesterEmail: string;
  requesterDisplayName: string;
  addresseeEmail: string;
  addresseeDisplayName: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent'>('friends');
  const [searchEmail, setSearchEmail] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 載入數據
  const loadData = async () => {
    try {
      setLoading(true);
      const promises = [];
      
      if (activeTab === 'friends') {
        promises.push(api.getFriends());
      } else if (activeTab === 'pending') {
        promises.push(api.getPendingRequests());
      } else if (activeTab === 'sent') {
        promises.push(api.getSentRequests());
      }

      const results = await Promise.all(promises);
      
      if (activeTab === 'friends') {
        setFriends(results[0]?.friends || []);
      } else if (activeTab === 'pending') {
        setPendingRequests(results[0]?.pendingRequests || []);
      } else if (activeTab === 'sent') {
        setSentRequests(results[0]?.sentRequests || []);
      }
    } catch (error) {
      console.error('載入數據失敗:', error);
      Alert.alert('錯誤', '載入數據失敗');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 搜尋用戶
  const searchUsers = async () => {
    if (!searchEmail.trim()) {
      Alert.alert('錯誤', '請輸入朋友的電子郵件');
      return;
    }

    try {
      setLoading(true);
      const response = await api.searchUsers(searchEmail);
      setSearchResults(response.users || []);
      
      if (!response.users || response.users.length === 0) {
        Alert.alert('提示', '找不到相符的用戶');
      }
    } catch (error) {
      console.error('搜尋用戶失敗:', error);
      Alert.alert('錯誤', '搜尋用戶失敗');
    } finally {
      setLoading(false);
    }
  };

  // 發送好友邀請
  const sendFriendRequest = async (userId: string, userEmail: string) => {
    try {
      await api.sendFriendRequest(userId);
      Alert.alert('成功', `好友邀請已發送給 ${userEmail}`);
      setSearchEmail('');
      setSearchResults([]);
    } catch (error) {
      console.error('發送好友邀請失敗:', error);
      Alert.alert('錯誤', '發送好友邀請失敗');
    }
  };

  // 接受好友邀請
  const acceptRequest = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      Alert.alert('成功', '好友邀請已接受');
      loadData(); // 重新載入數據
    } catch (error) {
      console.error('接受好友邀請失敗:', error);
      Alert.alert('錯誤', '接受好友邀請失敗');
    }
  };

  // 拒絕好友邀請
  const declineRequest = async (requestId: string) => {
    try {
      await api.declineFriendRequest(requestId);
      Alert.alert('成功', '好友邀請已拒絕');
      loadData(); // 重新載入數據
    } catch (error) {
      console.error('拒絕好友邀請失敗:', error);
      Alert.alert('錯誤', '拒絕好友邀請失敗');
    }
  };

  // 重新整理
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // 載入數據當 tab 改變時
  useEffect(() => {
    loadData();
  }, [activeTab]);

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
          <TouchableOpacity style={styles.addButton} onPress={searchUsers}>
            <Text style={styles.addButtonText}>搜尋用戶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton('friends', '朋友清單')}
        {renderTabButton('pending', '待處理')}
        {renderTabButton('sent', '已發送')}
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.searchResults}>
          <Text style={styles.sectionTitle}>搜尋結果</Text>
          {searchResults.map((user) => (
            <View key={user.id} style={styles.userItem}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.displayName}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.sendRequestButton}
                onPress={() => sendFriendRequest(user.id, user.email)}
              >
                <Text style={styles.sendRequestButtonText}>發送邀請</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Tab Content */}
      <ScrollView 
        style={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}

        {!loading && activeTab === 'friends' && (
          friends.length > 0 ? (
            friends.map((friend) => (
              <View key={friend.id} style={styles.friendItem}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{friend.displayName}</Text>
                  <Text style={styles.userEmail}>{friend.email}</Text>
                </View>
              </View>
            ))
          ) : renderEmptyState(
            '還沒有任何朋友',
            '開始搜尋並新增朋友來開始您的社交之旅！',
            '👥'
          )
        )}

        {!loading && activeTab === 'pending' && (
          pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{request.requesterDisplayName}</Text>
                  <Text style={styles.userEmail}>{request.requesterEmail}</Text>
                  {request.message && (
                    <Text style={styles.requestMessage}>{request.message}</Text>
                  )}
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => acceptRequest(request.id)}
                  >
                    <Text style={styles.acceptButtonText}>接受</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => declineRequest(request.id)}
                  >
                    <Text style={styles.declineButtonText}>拒絕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : renderEmptyState(
            '沒有待處理的邀請',
            '當有朋友發送好友邀請給您時，會在這裡顯示',
            '📬'
          )
        )}

        {!loading && activeTab === 'sent' && (
          sentRequests.length > 0 ? (
            sentRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{request.addresseeDisplayName}</Text>
                  <Text style={styles.userEmail}>{request.addresseeEmail}</Text>
                  {request.message && (
                    <Text style={styles.requestMessage}>{request.message}</Text>
                  )}
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>待回應</Text>
                </View>
              </View>
            ))
          ) : renderEmptyState(
            '沒有已發送的邀請',
            '您發送的好友邀請會在這裡顯示',
            '📤'
          )
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
  searchResults: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  friendItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  requestMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  sendRequestButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  sendRequestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#f59e0b',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
});