import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import type { RootState } from '../store';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Group {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  status: 'active' | 'inactive' | 'archived';
  privacy: 'public' | 'private';
  members: Array<{
    userId: string;
    role: 'admin' | 'member';
    joinedAt: string;
    isActive: boolean;
  }>;
  maxMembers: number;
  activityCount: number;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupStats {
  groupId: string;
  totalMembers: number;
  activeMembers: number;
  totalActivities: number;
  activitiesThisMonth: number;
  lastActivityDaysAgo: number;
}

type GroupDetailNavigationProp = StackNavigationProp<any>;
type GroupDetailRouteProp = RouteProp<{ params: { groupId: string } }, 'params'>;

export default function GroupDetailScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<GroupDetailNavigationProp>();
  const route = useRoute<GroupDetailRouteProp>();
  const { groupId } = route.params;

  // 狀態管理
  const [group, setGroup] = useState<Group | null>(null);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal 狀態
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  // 編輯表單
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  
  // 邀請表單
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // 載入資料
  useFocusEffect(
    useCallback(() => {
      loadGroupData();
    }, [groupId])
  );

  const loadGroupData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadGroupDetail(), loadGroupStats()]);
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupDetail = async () => {
    try {
      const response = await api.getGroupById(groupId);
      if (response && response.group) {
        setGroup(response.group);
        setEditForm({
          name: response.group.name,
          description: response.group.description || '',
        });
      }
    } catch (error) {
      console.error('Error loading group detail:', error);
      Alert.alert('載入失敗', '無法載入群組詳情。');
    }
  };

  const loadGroupStats = async () => {
    try {
      const response = await api.getGroupStats(groupId);
      if (response && response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading group stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  // 檢查權限
  const isUserAdmin = () => {
    if (!group || !user) return false;
    const userMember = group.members.find(member => member.userId === user.id);
    return userMember?.role === 'admin';
  };

  const isUserMember = () => {
    if (!group || !user) return false;
    return group.members.some(member => member.userId === user.id && member.isActive);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 更新群組資訊
  const handleUpdateGroup = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('錯誤', '請輸入群組名稱');
      return;
    }

    try {
      await api.updateGroup(groupId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      
      Alert.alert('更新成功', '群組資訊已更新');
      setShowEditModal(false);
      loadGroupDetail();
    } catch (error) {
      console.error('Error updating group:', error);
      Alert.alert('更新失敗', '無法更新群組資訊，請稍後再試。');
    }
  };

  // 搜尋用戶
  const searchUsersForInvite = async (query: string) => {
    if (!query.trim()) {
      setSearchUsers([]);
      return;
    }

    try {
      setIsSearchingUsers(true);
      const response = await api.searchUsers(query);
      if (response && response.users) {
        // 過濾掉已經是群組成員的用戶
        const existingMemberIds = group?.members.map(m => m.userId) || [];
        const filteredUsers = response.users.filter(
          (user: any) => !existingMemberIds.includes(user.id)
        );
        setSearchUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // 邀請用戶
  const handleInviteUser = async (userId: string) => {
    try {
      await api.inviteToGroup(groupId, userId);
      Alert.alert('邀請成功', '已發送邀請給該用戶');
      setShowInviteModal(false);
      setInviteEmail('');
      setSearchUsers([]);
      loadGroupDetail();
    } catch (error) {
      console.error('Error inviting user:', error);
      Alert.alert('邀請失敗', '無法邀請該用戶，請稍後再試。');
    }
  };

  // 移除成員
  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      '移除成員',
      `確定要移除 ${memberName} 嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeMemberFromGroup(groupId, memberId);
              Alert.alert('移除成功', '已移除該成員');
              loadGroupDetail();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('移除失敗', '無法移除該成員，請稍後再試。');
            }
          },
        },
      ]
    );
  };

  // 離開群組
  const handleLeaveGroup = () => {
    Alert.alert(
      '離開群組',
      '確定要離開這個群組嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '離開',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.leaveGroup(groupId);
              Alert.alert(
                '已離開群組',
                '您已成功離開此群組',
                [{ text: '確定', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('操作失敗', '無法離開群組，請稍後再試。');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 標題列 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>群組詳情</Text>
        {isUserAdmin() && (
          <TouchableOpacity onPress={() => setShowEditModal(true)}>
            <Icon name="edit" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 群組基本資訊 */}
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.groupBadges}>
              {group.privacy === 'private' && (
                <View style={styles.privateBadge}>
                  <Icon name="lock" size={16} color="#666" />
                  <Text style={styles.badgeText}>私人</Text>
                </View>
              )}
              <View style={[
                styles.statusBadge,
                { backgroundColor: group.status === 'active' ? '#4CAF50' : '#FFC107' }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {group.status === 'active' ? '活躍' : '非活躍'}
                </Text>
              </View>
            </View>
          </View>
          
          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}
          
          <Text style={styles.createdDate}>建立於 {formatDate(group.createdAt)}</Text>
        </View>

        {/* 統計資訊 */}
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>群組統計</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.activeMembers}</Text>
                <Text style={styles.statLabel}>活躍成員</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalActivities}</Text>
                <Text style={styles.statLabel}>總活動數</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.activitiesThisMonth}</Text>
                <Text style={styles.statLabel}>本月活動</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.lastActivityDaysAgo}</Text>
                <Text style={styles.statLabel}>天前活動</Text>
              </View>
            </View>
          </View>
        )}

        {/* 成員列表 */}
        <View style={styles.membersContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              成員 ({group.members.filter(m => m.isActive).length}/{group.maxMembers})
            </Text>
            {isUserAdmin() && (
              <TouchableOpacity onPress={() => setShowInviteModal(true)}>
                <Icon name="person-add" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
          
          {group.members
            .filter(member => member.isActive)
            .map((member, index) => (
              <View key={member.userId} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>成員 {index + 1}</Text>
                  <View style={styles.memberMeta}>
                    {member.role === 'admin' && (
                      <Text style={styles.adminLabel}>管理員</Text>
                    )}
                    <Text style={styles.joinedDate}>
                      {formatDate(member.joinedAt)} 加入
                    </Text>
                  </View>
                </View>
                {isUserAdmin() && member.userId !== user?.id && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member.userId, `成員 ${index + 1}`)}
                  >
                    <Icon name="remove-circle-outline" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
        </View>

        {/* 操作按鈕 */}
        {isUserMember() && (
          <View style={styles.actionsContainer}>
            {!isUserAdmin() && (
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={handleLeaveGroup}
              >
                <Icon name="exit-to-app" size={20} color="#FF3B30" />
                <Text style={styles.leaveButtonText}>離開群組</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* 編輯群組 Modal */}
      <Modal visible={showEditModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>編輯群組</Text>
            <TouchableOpacity onPress={handleUpdateGroup}>
              <Text style={styles.modalSaveText}>保存</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>群組名稱</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="輸入群組名稱"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>群組描述</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                value={editForm.description}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                placeholder="輸入群組描述"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 邀請成員 Modal */}
      <Modal visible={showInviteModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>邀請成員</Text>
            <View />
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                value={inviteEmail}
                onChangeText={(text) => {
                  setInviteEmail(text);
                  searchUsersForInvite(text);
                }}
                placeholder="輸入用戶 Email 搜尋..."
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <FlatList
              data={searchUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userSearchItem}
                  onPress={() => handleInviteUser(item.id)}
                >
                  <View>
                    <Text style={styles.userSearchName}>{item.displayName}</Text>
                    <Text style={styles.userSearchEmail}>{item.email}</Text>
                  </View>
                  <Icon name="add" size={24} color="#007AFF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                inviteEmail.trim() ? (
                  <Text style={styles.emptySearchText}>
                    {isSearchingUsers ? '搜尋中...' : '找不到符合的用戶'}
                  </Text>
                ) : (
                  <Text style={styles.emptySearchText}>輸入 Email 搜尋用戶</Text>
                )
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  groupInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupName: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  groupBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  groupDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  createdDate: {
    fontSize: 14,
    color: '#999',
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  membersContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  adminLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginRight: 8,
  },
  joinedDate: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
  },
  leaveButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  userSearchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  userSearchName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  userSearchEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptySearchText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
  },
});