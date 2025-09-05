import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RootState, AppDispatch } from '../store';
import type { TimeSlot, RestaurantOption } from '../types/api';
import { 
  fetchVotingResults,
  finalizeGroupDiningPlan,
  clearError
} from '../store/groupDiningSlice';

interface RouteParams {
  planId: string;
}

const VotingResultsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute();
  const { planId } = route.params as RouteParams;
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentPlan, votingResults, loading, error } = useSelector((state: RootState) => state.groupDining);

  useEffect(() => {
    loadResults();
  }, [planId]);

  useEffect(() => {
    if (error) {
      Alert.alert('錯誤', error);
      dispatch(clearError());
    }
  }, [error]);

  const loadResults = async () => {
    try {
      await dispatch(fetchVotingResults(planId)).unwrap();
    } catch (error) {
      console.error('載入投票結果失敗:', error);
      Alert.alert('錯誤', '載入投票結果失敗', [
        { text: '確定', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  };

  const handleFinalizePlan = async () => {
    if (!selectedTimeSlot || !selectedRestaurant) {
      Alert.alert('提醒', '請選擇最終的時間和餐廳');
      return;
    }

    const selectedTime = votingResults?.time_slots.find(ts => ts.id === selectedTimeSlot);
    const selectedRestaurantData = votingResults?.restaurants.find(r => r.id === selectedRestaurant);

    Alert.alert(
      '確認最終安排',
      `時間：${selectedTime?.description}\n餐廳：${selectedRestaurantData?.name}\n\n確定要確認這個安排嗎？確認後將無法修改。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: async () => {
            try {
              await dispatch(finalizeGroupDiningPlan({
                planId,
                finalizeData: {
                  time_slot_id: selectedTimeSlot,
                  restaurant_id: selectedRestaurant,
                }
              })).unwrap();
              
              Alert.alert('成功', '聚餐安排已確認！', [
                {
                  text: '確定',
                  onPress: () => navigation.goBack()
                }
              ]);
            } catch (error) {
              console.error('確認聚餐安排失敗:', error);
              Alert.alert('錯誤', '確認聚餐安排失敗，請稍後再試');
            }
          }
        }
      ]
    );
  };

  const getProgressPercentage = () => {
    if (!votingResults) return 0;
    return Math.round(votingResults.voting_progress * 100);
  };

  const renderProgressBar = () => {
    const percentage = getProgressPercentage();
    
    return (
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>🗳️ 投票進度</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {votingResults?.voted_participants || 0} / {votingResults?.total_participants || 0} 人已投票 ({percentage}%)
        </Text>
      </View>
    );
  };

  const renderTimeSlotResults = () => {
    if (!votingResults?.time_slots.length) return null;

    const sortedTimeSlots = [...votingResults.time_slots].sort((a, b) => b.vote_count - a.vote_count);
    const maxVotes = sortedTimeSlots[0]?.vote_count || 0;
    const isCreator = user?.id === currentPlan?.created_by;
    const canFinalize = currentPlan?.status === 'voting' && isCreator;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ 時間選項投票結果</Text>
        
        {sortedTimeSlots.map((timeSlot: TimeSlot, index: number) => {
          const votePercentage = maxVotes > 0 ? (timeSlot.vote_count / maxVotes) * 100 : 0;
          const isSelected = selectedTimeSlot === timeSlot.id;
          const isTopChoice = index === 0 && timeSlot.vote_count > 0;
          
          return (
            <TouchableOpacity
              key={timeSlot.id}
              style={[
                styles.resultCard,
                isTopChoice && styles.topChoiceCard,
                canFinalize && isSelected && styles.selectedCard
              ]}
              onPress={() => canFinalize && setSelectedTimeSlot(timeSlot.id)}
              disabled={!canFinalize}
            >
              <View style={styles.resultHeader}>
                <View style={styles.resultInfo}>
                  <Text style={[
                    styles.resultTitle,
                    isTopChoice && styles.topChoiceTitle
                  ]}>
                    {timeSlot.description}
                  </Text>
                  <Text style={styles.resultTime}>
                    {new Date(timeSlot.start_time).toLocaleString('zh-TW', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {new Date(timeSlot.end_time).toLocaleString('zh-TW', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={styles.voteInfo}>
                  {isTopChoice && <Text style={styles.topChoiceBadge}>👑 最高票</Text>}
                  <Text style={styles.voteCount}>{timeSlot.vote_count} 票</Text>
                  {canFinalize && isSelected && (
                    <Text style={styles.selectedBadge}>✓ 已選擇</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.voteBarContainer}>
                <View 
                  style={[
                    styles.voteBar, 
                    { width: `${votePercentage}%` },
                    isTopChoice && styles.topChoiceBar
                  ]} 
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderRestaurantResults = () => {
    if (!votingResults?.restaurants.length) return null;

    const sortedRestaurants = [...votingResults.restaurants].sort((a, b) => b.vote_count - a.vote_count);
    const maxVotes = sortedRestaurants[0]?.vote_count || 0;
    const isCreator = user?.id === currentPlan?.created_by;
    const canFinalize = currentPlan?.status === 'voting' && isCreator;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍽️ 餐廳選項投票結果</Text>
        
        {sortedRestaurants.map((restaurant: RestaurantOption, index: number) => {
          const votePercentage = maxVotes > 0 ? (restaurant.vote_count / maxVotes) * 100 : 0;
          const isSelected = selectedRestaurant === restaurant.id;
          const isTopChoice = index === 0 && restaurant.vote_count > 0;
          
          return (
            <TouchableOpacity
              key={restaurant.id}
              style={[
                styles.resultCard,
                isTopChoice && styles.topChoiceCard,
                canFinalize && isSelected && styles.selectedCard
              ]}
              onPress={() => canFinalize && setSelectedRestaurant(restaurant.id)}
              disabled={!canFinalize}
            >
              <View style={styles.resultHeader}>
                <View style={styles.resultInfo}>
                  <Text style={[
                    styles.resultTitle,
                    isTopChoice && styles.topChoiceTitle
                  ]}>
                    {restaurant.name}
                  </Text>
                  <Text style={styles.resultCuisine}>{restaurant.cuisine_type}</Text>
                  <Text style={styles.resultAddress}>📍 {restaurant.address}</Text>
                </View>
                <View style={styles.voteInfo}>
                  {isTopChoice && <Text style={styles.topChoiceBadge}>👑 最高票</Text>}
                  <Text style={styles.voteCount}>{restaurant.vote_count} 票</Text>
                  {canFinalize && isSelected && (
                    <Text style={styles.selectedBadge}>✓ 已選擇</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.voteBarContainer}>
                <View 
                  style={[
                    styles.voteBar, 
                    { width: `${votePercentage}%` },
                    isTopChoice && styles.topChoiceBar
                  ]} 
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderFinalizedResult = () => {
    if (!currentPlan || currentPlan.status !== 'finalized') return null;

    return (
      <View style={styles.finalizedSection}>
        <Text style={styles.finalizedTitle}>🎉 最終確認結果</Text>
        
        {currentPlan.confirmed_time_slot && (
          <View style={styles.confirmedCard}>
            <Text style={styles.confirmedLabel}>確認時間：</Text>
            <Text style={styles.confirmedTitle}>
              {currentPlan.confirmed_time_slot.description}
            </Text>
            <Text style={styles.confirmedDetail}>
              {new Date(currentPlan.confirmed_time_slot.start_time).toLocaleString('zh-TW')} - {' '}
              {new Date(currentPlan.confirmed_time_slot.end_time).toLocaleString('zh-TW')}
            </Text>
          </View>
        )}

        {currentPlan.confirmed_restaurant && (
          <View style={styles.confirmedCard}>
            <Text style={styles.confirmedLabel}>確認餐廳：</Text>
            <Text style={styles.confirmedTitle}>
              {currentPlan.confirmed_restaurant.name}
            </Text>
            <Text style={styles.confirmedDetail}>
              {currentPlan.confirmed_restaurant.cuisine_type} • {currentPlan.confirmed_restaurant.address}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!votingResults && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>無法載入投票結果</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadResults}>
          <Text style={styles.retryButtonText}>重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCreator = user?.id === currentPlan?.created_by;
  const canFinalize = currentPlan?.status === 'voting' && isCreator && selectedTimeSlot && selectedRestaurant;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>投票結果</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderProgressBar()}
        {renderFinalizedResult()}
        {renderTimeSlotResults()}
        {renderRestaurantResults()}

        {/* Finalize Section */}
        {isCreator && currentPlan?.status === 'voting' && (
          <View style={styles.finalizeSection}>
            <Text style={styles.finalizeSectionTitle}>
              👨‍💼 創建者專用：確認最終安排
            </Text>
            <Text style={styles.finalizeSectionText}>
              請點選上方的時間和餐廳選項，然後確認最終的聚餐安排
            </Text>
            
            <TouchableOpacity
              style={[
                styles.finalizeButton,
                !canFinalize && styles.finalizeButtonDisabled
              ]}
              onPress={handleFinalizePlan}
              disabled={!canFinalize || loading}
            >
              <Text style={styles.finalizeButtonText}>
                {loading ? '處理中...' : '確認最終安排'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  progressSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 10,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3498db',
  },
  progressText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  topChoiceCard: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
  },
  selectedCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  topChoiceTitle: {
    color: '#b8860b',
  },
  resultTime: {
    fontSize: 14,
    color: '#6c757d',
  },
  resultCuisine: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 12,
    color: '#6c757d',
  },
  voteInfo: {
    alignItems: 'flex-end',
  },
  topChoiceBadge: {
    fontSize: 11,
    color: '#b8860b',
    fontWeight: '600',
    marginBottom: 2,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  selectedBadge: {
    fontSize: 11,
    color: '#27ae60',
    fontWeight: '600',
    marginTop: 2,
  },
  voteBarContainer: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  voteBar: {
    height: '100%',
    backgroundColor: '#3498db',
  },
  topChoiceBar: {
    backgroundColor: '#ffc107',
  },
  finalizedSection: {
    backgroundColor: '#d4edda',
    margin: 10,
    padding: 20,
    borderRadius: 8,
  },
  finalizedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 15,
    textAlign: 'center',
  },
  confirmedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  confirmedLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  confirmedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  confirmedDetail: {
    fontSize: 14,
    color: '#495057',
  },
  finalizeSection: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  finalizeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 10,
  },
  finalizeSectionText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 20,
  },
  finalizeButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  finalizeButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  finalizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default VotingResultsScreen;