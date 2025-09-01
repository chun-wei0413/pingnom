import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Loading from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sendFriendRequest } from '@/store/slices/friendshipSlice';
import { userApi, UserProfile } from '@/services/api/userApi';

interface SearchUsersScreenProps {
  navigation: any;
}

const SearchUsersScreen: React.FC<SearchUsersScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isSending } = useAppSelector((state) => state.friendship);
  const { user } = useAppSelector((state) => state.auth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search for users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await userApi.searchUsers(searchQuery.trim());
      // Filter out current user from results
      const filteredResults = response.filter(
        (searchUser: UserProfile) => searchUser.id !== user?.profile?.id
      );
      setSearchResults(filteredResults);
      setHasSearched(true);
    } catch (error) {
      console.error('搜尋用戶失敗:', error);
      Alert.alert('錯誤', '搜尋用戶失敗，請稍後再試');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string, displayName: string) => {
    try {
      await dispatch(sendFriendRequest({
        addresseeId: targetUserId,
        message: `你好！我是 ${user?.profile?.displayName}，希望能成為朋友一起聚餐！`
      })).unwrap();
      
      Alert.alert(
        '成功',
        `已向 ${displayName} 發送好友邀請！`,
        [
          {
            text: '確定',
            onPress: () => {
              // Remove the user from search results after sending request
              setSearchResults(prev => prev.filter(u => u.id !== targetUserId));
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('錯誤', '發送好友邀請失敗，請再試一次');
    }
  };

  const UserResultCard: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{userProfile.displayName}</Text>
          <Text style={styles.userEmail}>{userProfile.email}</Text>
          {userProfile.bio && <Text style={styles.userBio}>{userProfile.bio}</Text>}
        </View>
      </View>
      <Button
        title="加好友"
        onPress={() => handleSendFriendRequest(userProfile.id, userProfile.displayName)}
        size="small"
        style={styles.addFriendButton}
        disabled={isSending}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>搜尋朋友</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchTitle}>尋找新朋友</Text>
          <Text style={styles.searchSubtitle}>輸入姓名或 Email 來搜尋用戶</Text>
          
          <View style={styles.searchContainer}>
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="輸入姓名或 Email..."
              style={styles.searchInput}
              onSubmitEditing={handleSearch}
            />
            <Button
              title="搜尋"
              onPress={handleSearch}
              loading={isSearching}
              disabled={isSearching || !searchQuery.trim()}
              style={styles.searchButton}
            />
          </View>
        </View>

        {/* Results Section */}
        <ScrollView style={styles.resultsContainer}>
          {isSearching && (
            <Loading text="搜尋中..." />
          )}
          
          {!isSearching && hasSearched && searchResults.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyStateTitle}>沒有找到用戶</Text>
              <Text style={styles.emptyStateText}>
                嘗試使用不同的關鍵字搜尋
              </Text>
            </View>
          )}
          
          {!isSearching && searchResults.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>搜尋結果 ({searchResults.length})</Text>
              {searchResults.map((userProfile) => (
                <UserResultCard key={userProfile.id} userProfile={userProfile} />
              ))}
            </View>
          )}

          {!hasSearched && (
            <View style={styles.instructions}>
              <Text style={styles.instructionsIcon}>👋</Text>
              <Text style={styles.instructionsTitle}>開始搜尋朋友</Text>
              <Text style={styles.instructionsText}>
                輸入朋友的姓名或 Email 地址來尋找他們
              </Text>
              <View style={styles.tipContainer}>
                <Text style={styles.tipTitle}>💡 提示：</Text>
                <Text style={styles.tipText}>• 可以搜尋完整的 Email 地址</Text>
                <Text style={styles.tipText}>• 也可以搜尋部分姓名</Text>
                <Text style={styles.tipText}>• 搜尋不區分大小寫</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {isSending && <Loading overlay text="發送好友邀請中..." />}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    paddingHorizontal: 24,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsSection: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userBio: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  addFriendButton: {
    minWidth: 80,
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
  },
  instructions: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  instructionsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  tipContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    width: '100%',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#0369A1',
    marginBottom: 4,
  },
});

export default SearchUsersScreen;