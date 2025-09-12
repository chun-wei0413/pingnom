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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootState } from '../store';
import { groupApi } from '../services/groupApi';
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

type GroupsNavigationProp = StackNavigationProp<any>;

export default function GroupsScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<GroupsNavigationProp>();
  
  // 狀態管理
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'created'>('all');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 當畫面聚焦時載入資料
  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [selectedFilter])
  );

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      console.log('Loading groups with filter:', selectedFilter);
      
      const response = await groupApi.getUserGroups();
      console.log('Groups API response:', response);
      
      if (response && response.groups) {
        let filteredGroups = response.groups;
        
        // 根據篩選條件過濾群組
        if (selectedFilter === 'active') {
          filteredGroups = response.groups.filter((group: Group) => group.status === 'active');
        } else if (selectedFilter === 'created') {
          filteredGroups = response.groups.filter((group: Group) => group.creatorId === user?.id);
        }
        
        setGroups(filteredGroups);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert(
        '載入失敗',
        '無法載入群組列表，請檢查網路連線後重試。',
        [{ text: '確定' }]
      );
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  // 搜尋群組
  const searchGroups = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await groupApi.searchGroups({
        name: query,
        limit: 20
      });
      
      if (response && response.groups) {
        setSearchResults(response.groups);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching groups:', error);
      Alert.alert('搜尋失敗', '無法搜尋群組，請重試。');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 處理搜尋輸入變化
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (text.trim()) {
      searchGroups(text);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // 格式化最後活動時間
  const formatLastActivity = (lastActivityAt?: string) => {
    if (!lastActivityAt) return '尚無活動';
    
    const now = new Date();
    const activityTime = new Date(lastActivityAt);
    const diffInHours = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '剛剛';
    if (diffInHours < 24) return `${diffInHours} 小時前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} 天前`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} 週前`;
    
    return '很久以前';
  };

  // 取得活躍成員數量
  const getActiveMemberCount = (members: Group['members']) => {
    return members.filter(member => member.isActive).length;
  };

  // 檢查用戶是否為管理員
  const isUserAdmin = (group: Group) => {
    const userMember = group.members.find(member => member.userId === user?.id);
    return userMember?.role === 'admin';
  };

  // 渲染群組卡片
  const renderGroupCard = (group: Group) => (
    <TouchableOpacity
      key={group.id}
      style={styles.groupCard}
      onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupTitleRow}>
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.groupBadges}>
            {group.privacy === 'private' && (
              <View style={styles.privateBadge}>
                <Icon name="lock" size={12} color="#666" />
              </View>
            )}
            {isUserAdmin(group) && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>管理員</Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.groupDescription} numberOfLines={2}>
          {group.description || '尚無描述'}
        </Text>
      </View>

      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <Icon name="people" size={16} color="#666" />
          <Text style={styles.statText}>
            {getActiveMemberCount(group.members)}/{group.maxMembers}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="event" size={16} color="#666" />
          <Text style={styles.statText}>{group.activityCount} 次活動</Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.statText}>{formatLastActivity(group.lastActivityAt)}</Text>
        </View>
      </View>

      <View style={styles.groupStatus}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: group.status === 'active' ? '#4CAF50' : '#FFC107' }
        ]} />
        <Text style={styles.statusText}>
          {group.status === 'active' ? '活躍' : '非活躍'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 渲染篩選按鈕
  const renderFilterButton = (filter: typeof selectedFilter, label: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const displayGroups = searchText.trim() ? searchResults : groups;
  const isShowingSearchResults = searchText.trim();

  return (
    <SafeAreaView style={styles.container}>
      {/* 標題列 */}
      <View style={styles.header}>
        <Text style={styles.title}>我的群組</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Icon name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* 搜尋欄 */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜尋群組名稱..."
          value={searchText}
          onChangeText={handleSearchChange}
          placeholderTextColor="#999"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchText('');
              setSearchResults([]);
              setIsSearching(false);
            }}
          >
            <Icon name="clear" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* 篩選器 (只在非搜尋狀態顯示) */}
      {!isShowingSearchResults && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderFilterButton('all', '全部群組')}
            {renderFilterButton('active', '活躍群組')}
            {renderFilterButton('created', '我創建的')}
          </ScrollView>
        </View>
      )}

      {/* 群組列表 */}
      <ScrollView
        style={styles.groupsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        ) : displayGroups.length > 0 ? (
          <>
            {isShowingSearchResults && (
              <Text style={styles.searchResultsHeader}>
                搜尋結果 ({displayGroups.length})
              </Text>
            )}
            {displayGroups.map(renderGroupCard)}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="group" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {isShowingSearchResults 
                ? '找不到相關群組' 
                : selectedFilter === 'created' 
                  ? '您還沒有創建任何群組'
                  : '您還沒有加入任何群組'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {isShowingSearchResults 
                ? '試試其他關鍵字或瀏覽公開群組'
                : '立即創建或加入群組，開始您的聚餐之旅！'
              }
            </Text>
            {!isShowingSearchResults && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('CreateGroup')}
              >
                <Text style={styles.primaryButtonText}>創建群組</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  groupsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 4,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    marginBottom: 12,
  },
  groupTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  groupName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  groupBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateBadge: {
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  groupStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});