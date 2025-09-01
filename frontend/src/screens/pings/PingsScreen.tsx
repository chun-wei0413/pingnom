import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserPings, respondToPing, clearError } from '@/store/slices/pingSlice';
import { Ping } from '@/services/api/pingApi';
import { HomeTabsScreenProps } from '@/types/navigation';

type PingsScreenProps = HomeTabsScreenProps<'Pings'>;

const PingsScreen: React.FC<PingsScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { pings, isLoading, error, isResponding } = useAppSelector((state) => state.ping);
  const { user } = useAppSelector((state) => state.auth);
  
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      loadPings();
    }
  }, []);

  const loadPings = () => {
    dispatch(fetchUserPings());
  };

  const handleRefresh = () => {
    loadPings();
  };

  const handleCreatePing = () => {
    // Navigate to CreatePing screen
    navigation.navigate('CreatePing');
  };

  const handleRespondToPing = (pingId: string, status: 'accepted' | 'declined') => {
    const message = status === 'accepted' ? 'I will be there!' : 'Sorry, cannot make it.';
    
    Alert.alert(
      status === 'accepted' ? '接受邀請' : '拒絕邀請',
      `確定要${status === 'accepted' ? '接受' : '拒絕'}這個聚餐邀請嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: () => {
            dispatch(respondToPing({ 
              pingId, 
              data: { status, message } 
            })).then(() => {
              // Refresh the list after responding
              loadPings();
            });
          },
        },
      ]
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW') + ' ' + date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPingTypeEmoji = (type: string) => {
    switch (type) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🍽️';
      case 'dinner': return '🌆';
      case 'snack': return '🍿';
      default: return '🍴';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      case 'expired': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getCurrentUserResponse = (ping: Ping) => {
    if (!user?.profile) return null;
    // Note: We'll need to get the actual user ID from the auth state
    // For now, we'll use a placeholder approach
    return ping.responses.find(r => r.userId === user.profile.displayName);
  };

  const PingCard: React.FC<{ ping: Ping }> = ({ ping }) => {
    const userResponse = getCurrentUserResponse(ping);
    const isCreatedByUser = ping.createdBy === user?.profile?.displayName;
    
    return (
      <View style={styles.pingCard}>
        {/* Header */}
        <View style={styles.pingHeader}>
          <View style={styles.pingTitle}>
            <Text style={styles.pingTitleText}>
              {getPingTypeEmoji(ping.pingType)} {ping.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ping.status) }]}>
              <Text style={styles.statusText}>{ping.status}</Text>
            </View>
          </View>
          <Text style={styles.pingTime}>{formatDateTime(ping.scheduledAt)}</Text>
        </View>

        {/* Description */}
        {ping.description && (
          <Text style={styles.pingDescription}>{ping.description}</Text>
        )}

        {/* Stats */}
        <View style={styles.pingStats}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.statText}>
              {ping.acceptedCount}/{ping.inviteeCount} 已接受
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.statText}>
              {ping.pendingCount} 待回應
            </Text>
          </View>
        </View>

        {/* Actions */}
        {!isCreatedByUser && ping.status === 'active' && (
          <View style={styles.pingActions}>
            {userResponse?.status === 'pending' ? (
              <>
                <Button
                  title="接受"
                  onPress={() => handleRespondToPing(ping.id, 'accepted')}
                  variant="primary"
                  size="small"
                  style={[styles.actionButton, styles.acceptButton]}
                  disabled={isResponding}
                />
                <Button
                  title="拒絕"
                  onPress={() => handleRespondToPing(ping.id, 'declined')}
                  variant="outline"
                  size="small"
                  style={styles.actionButton}
                  disabled={isResponding}
                />
              </>
            ) : (
              <View style={styles.responseStatus}>
                <Ionicons 
                  name={userResponse?.status === 'accepted' ? 'checkmark-circle' : 'close-circle'} 
                  size={20} 
                  color={userResponse?.status === 'accepted' ? '#10B981' : '#EF4444'} 
                />
                <Text style={[
                  styles.responseText,
                  { color: userResponse?.status === 'accepted' ? '#10B981' : '#EF4444' }
                ]}>
                  已{userResponse?.status === 'accepted' ? '接受' : '拒絕'}
                </Text>
              </View>
            )}
          </View>
        )}

        {isCreatedByUser && (
          <View style={styles.creatorBadge}>
            <Ionicons name="person" size={16} color="#FF6B35" />
            <Text style={styles.creatorText}>我的邀請</Text>
          </View>
        )}
      </View>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>載入失敗：{error}</Text>
          <Button title="重試" onPress={loadPings} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pings</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreatePing}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {pings.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎯</Text>
            <Text style={styles.emptyStateTitle}>還沒有 Pings</Text>
            <Text style={styles.emptyStateText}>
              創建您的第一個聚餐邀請，開始與朋友們的美食之旅！
            </Text>
            <Button
              title="創建 Ping"
              onPress={handleCreatePing}
              style={styles.emptyStateButton}
            />
          </View>
        ) : (
          pings.map((ping) => <PingCard key={ping.id} ping={ping} />)
        )}
      </ScrollView>

      {isLoading && <Loading overlay text="載入中..." />}
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
  createButton: {
    backgroundColor: '#FF6B35',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  pingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pingHeader: {
    marginBottom: 12,
  },
  pingTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pingTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  pingTime: {
    fontSize: 14,
    color: '#666',
  },
  pingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  pingStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  pingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  responseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  responseText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  creatorText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FF6B35',
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

export default PingsScreen;