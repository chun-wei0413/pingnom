import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchFriends, 
  fetchPendingRequests, 
  fetchSentRequests,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  clearError 
} from '@/store/slices/friendshipSlice';
import { Friend, FriendRequestWithUser } from '@/services/api/friendshipApi';
import { HomeTabsScreenProps } from '@/types/navigation';

type FriendsScreenProps = HomeTabsScreenProps<'Friends'>;

const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { 
    friends, 
    pendingRequests, 
    sentRequests,
    isLoading, 
    isAccepting,
    isDeclining,
    isRemoving,
    error,
    friendsError,
    pendingError,
    sentError
  } = useAppSelector((state) => state.friendship);
  
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent'>('friends');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    console.log('🔵 [DEBUG] FriendsScreen: Starting to load all data');
    dispatch(fetchFriends());
    dispatch(fetchPendingRequests());
    dispatch(fetchSentRequests());
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleAddFriend = () => {
    navigation.navigate('SearchUsers');
  };

  const handleAcceptRequest = (friendshipId: string) => {
    Alert.alert(
      '接受好友邀請',
      '確定要接受這個好友邀請嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '接受',
          onPress: () => {
            dispatch(acceptFriendRequest(friendshipId)).then(() => {
              loadData(); // Refresh all data
            });
          },
        },
      ]
    );
  };

  const handleDeclineRequest = (friendshipId: string) => {
    Alert.alert(
      '拒絕好友邀請',
      '確定要拒絕這個好友邀請嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '拒絕',
          onPress: () => {
            dispatch(declineFriendRequest(friendshipId)).then(() => {
              loadData(); // Refresh all data
            });
          },
        },
      ]
    );
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      '移除朋友',
      `確定要將 ${friend.displayName} 從好友列表中移除嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: () => {
            dispatch(removeFriend(friend.id)).then(() => {
              loadData(); // Refresh all data
            });
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW') + ' ' + date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const FriendCard: React.FC<{ friend: Friend }> = ({ friend }) => (
    <View style={styles.friendCard}>
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatar}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{friend.displayName}</Text>
          <Text style={styles.friendEmail}>{friend.email}</Text>
          {friend.bio && <Text style={styles.friendBio}>{friend.bio}</Text>}
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveFriend(friend)}
        disabled={isRemoving}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  const PendingRequestCard: React.FC<{ request: FriendRequestWithUser }> = ({ request }) => (
    <View style={styles.requestCard}>
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatar}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>
            {request.requester?.displayName || '未知用戶'}
          </Text>
          <Text style={styles.friendEmail}>
            {request.requester?.email || ''}
          </Text>
          {request.message && (
            <Text style={styles.requestMessage}>"{request.message}"</Text>
          )}
          <Text style={styles.requestDate}>{formatDate(request.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <Button
          title="接受"
          onPress={() => handleAcceptRequest(request.id)}
          variant="primary"
          size="small"
          style={[styles.actionButton, styles.acceptButton]}
          disabled={isAccepting || isDeclining}
        />
        <Button
          title="拒絕"
          onPress={() => handleDeclineRequest(request.id)}
          variant="outline"
          size="small"
          style={styles.actionButton}
          disabled={isAccepting || isDeclining}
        />
      </View>
    </View>
  );

  const SentRequestCard: React.FC<{ request: FriendRequestWithUser }> = ({ request }) => (
    <View style={styles.requestCard}>
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatar}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>
            {request.addressee?.displayName || '未知用戶'}
          </Text>
          <Text style={styles.friendEmail}>
            {request.addressee?.email || ''}
          </Text>
          {request.message && (
            <Text style={styles.requestMessage}>"{request.message}"</Text>
          )}
          <Text style={styles.requestDate}>{formatDate(request.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>等待回應</Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return friends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateTitle}>還沒有朋友</Text>
            <Text style={styles.emptyStateText}>
              開始搜尋並邀請朋友，一起享受聚餐樂趣！
            </Text>
            <Button
              title="搜尋朋友"
              onPress={handleAddFriend}
              style={styles.emptyStateButton}
            />
          </View>
        ) : (
          friends.map((friend) => <FriendCard key={friend.id} friend={friend} />)
        );

      case 'pending':
        return pendingRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📨</Text>
            <Text style={styles.emptyStateTitle}>沒有待處理邀請</Text>
            <Text style={styles.emptyStateText}>
              目前沒有收到好友邀請
            </Text>
          </View>
        ) : (
          pendingRequests.map((request) => (
            <PendingRequestCard key={request.id} request={request} />
          ))
        );

      case 'sent':
        return sentRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📤</Text>
            <Text style={styles.emptyStateTitle}>沒有發送邀請</Text>
            <Text style={styles.emptyStateText}>
              目前沒有發送中的好友邀請
            </Text>
          </View>
        ) : (
          sentRequests.map((request) => (
            <SentRequestCard key={request.id} request={request} />
          ))
        );

      default:
        return null;
    }
  };

  // Debug logging
  console.log('🔍 [DEBUG] FriendsScreen State:', {
    friends: friends.length,
    pendingRequests: pendingRequests.length,
    sentRequests: sentRequests.length,
    isLoading,
    error,
    friendsError,
    pendingError,
    sentError
  });

  // Only show error if all main data loading failed
  const hasAllErrorsOrNoData = (friendsError && friends.length === 0) && 
                               (pendingError && pendingRequests.length === 0) && 
                               (sentError && sentRequests.length === 0);
  
  console.log('🔍 [DEBUG] Error check:', { hasAllErrorsOrNoData, generalError: !!error });
  
  if (hasAllErrorsOrNoData || error) {
    console.log('🔴 [DEBUG] Showing error screen');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            載入失敗：{error || friendsError || pendingError || sentError || '未知錯誤'}
          </Text>
          <Button title="重試" onPress={loadData} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>朋友</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddFriend}
          testID="add-friend-button"
        >
          <Ionicons name="person-add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            朋友 ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            邀請 ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            已發送 ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>

      {(isLoading || isAccepting || isDeclining || isRemoving) && (
        <Loading overlay text="處理中..." />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  friendBio: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  requestMessage: {
    fontSize: 12,
    color: '#FF6B35',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 11,
    color: '#999',
  },
  removeButton: {
    padding: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 60,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  statusBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    minWidth: 120,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default FriendsScreen;