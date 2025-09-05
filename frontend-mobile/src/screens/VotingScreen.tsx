import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootState, AppDispatch } from '../store';
import type { GroupDiningStackParamList } from '../navigation/AppNavigator';
import type { TimeSlot, RestaurantOption } from '../types/api';
import { 
  fetchGroupDiningPlan,
  submitVote,
  clearError
} from '../store/groupDiningSlice';

interface RouteParams {
  planId: string;
}

type VotingScreenNavigationProp = StackNavigationProp<GroupDiningStackParamList, 'Voting'>;

const VotingScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<VotingScreenNavigationProp>();
  const route = useRoute();
  const { planId } = route.params as RouteParams;
  
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentPlan, loading, error } = useSelector((state: RootState) => state.groupDining);

  useEffect(() => {
    loadPlan();
  }, [planId]);

  useEffect(() => {
    if (error) {
      Alert.alert('錯誤', error);
      dispatch(clearError());
    }
  }, [error]);

  const loadPlan = async () => {
    try {
      await dispatch(fetchGroupDiningPlan(planId)).unwrap();
    } catch (error) {
      console.error('載入聚餐計畫失敗:', error);
      Alert.alert('錯誤', '載入聚餐計畫失敗', [
        { text: '確定', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const toggleTimeSlotSelection = (timeSlotId: string) => {
    setSelectedTimeSlots(prev => {
      if (prev.includes(timeSlotId)) {
        return prev.filter(id => id !== timeSlotId);
      } else {
        return [...prev, timeSlotId];
      }
    });
  };

  const toggleRestaurantSelection = (restaurantId: string) => {
    setSelectedRestaurants(prev => {
      if (prev.includes(restaurantId)) {
        return prev.filter(id => id !== restaurantId);
      } else {
        return [...prev, restaurantId];
      }
    });
  };

  const handleSubmitVote = async () => {
    if (!user || !currentPlan) return;

    if (selectedTimeSlots.length === 0) {
      Alert.alert('提醒', '請至少選擇一個時間選項');
      return;
    }

    if (selectedRestaurants.length === 0) {
      Alert.alert('提醒', '請至少選擇一個餐廳選項');
      return;
    }

    Alert.alert(
      '確認投票',
      `您選擇了 ${selectedTimeSlots.length} 個時間選項和 ${selectedRestaurants.length} 個餐廳選項，確定要提交嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await dispatch(submitVote({
                planId,
                voteData: {
                  user_id: user.id,
                  time_slot_ids: selectedTimeSlots,
                  restaurant_ids: selectedRestaurants,
                  comment: comment.trim(),
                }
              })).unwrap();
              
              Alert.alert('成功', '投票已提交！', [
                {
                  text: '確定',
                  onPress: () => navigation.goBack()
                }
              ]);
            } catch (error) {
              console.error('提交投票失敗:', error);
              Alert.alert('錯誤', '提交投票失敗，請稍後再試');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (!currentPlan || currentPlan.status !== 'voting') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {!currentPlan ? '載入中...' : '此聚餐計畫目前不開放投票'}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userParticipant = currentPlan.participants.find(p => p.user_id === user?.id);
  if (userParticipant?.has_voted) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>您已經投過票了！</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTimeSlots = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⏰ 選擇時間 (可多選)</Text>
      <Text style={styles.sectionSubtitle}>請選擇您可以參與的時間</Text>
      
      {currentPlan.time_slots.map((timeSlot: TimeSlot) => {
        const isSelected = selectedTimeSlots.includes(timeSlot.id);
        return (
          <TouchableOpacity
            key={timeSlot.id}
            style={[styles.optionCard, isSelected && styles.selectedOptionCard]}
            onPress={() => toggleTimeSlotSelection(timeSlot.id)}
          >
            <View style={styles.optionHeader}>
              <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
                {timeSlot.description}
              </Text>
              <View style={[styles.checkbox, isSelected && styles.selectedCheckbox]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
            <Text style={[styles.optionTime, isSelected && styles.selectedOptionTime]}>
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
          </TouchableOpacity>
        );
      })}
      
      <Text style={styles.selectionCount}>
        已選擇 {selectedTimeSlots.length} / {currentPlan.time_slots.length} 個時間
      </Text>
    </View>
  );

  const renderRestaurantOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🍽️ 選擇餐廳 (可多選)</Text>
      <Text style={styles.sectionSubtitle}>請選擇您想去的餐廳</Text>
      
      {currentPlan.restaurant_options.map((restaurant: RestaurantOption) => {
        const isSelected = selectedRestaurants.includes(restaurant.id);
        return (
          <TouchableOpacity
            key={restaurant.id}
            style={[styles.optionCard, isSelected && styles.selectedOptionCard]}
            onPress={() => toggleRestaurantSelection(restaurant.id)}
          >
            <View style={styles.optionHeader}>
              <View style={styles.restaurantInfo}>
                <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
                  {restaurant.name}
                </Text>
                <Text style={[styles.cuisineType, isSelected && styles.selectedCuisineType]}>
                  {restaurant.cuisine_type}
                </Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.selectedCheckbox]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
            <Text style={[styles.optionAddress, isSelected && styles.selectedOptionAddress]}>
              📍 {restaurant.address}
            </Text>
          </TouchableOpacity>
        );
      })}
      
      <Text style={styles.selectionCount}>
        已選擇 {selectedRestaurants.length} / {currentPlan.restaurant_options.length} 個餐廳
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>投票選擇</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressBar}>
        <Text style={styles.progressText}>
          {currentPlan.title} • 投票中
        </Text>
        {currentPlan.voting_deadline && (
          <Text style={styles.deadlineText}>
            截止：{new Date(currentPlan.voting_deadline).toLocaleString('zh-TW')}
          </Text>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTimeSlots()}
        {renderRestaurantOptions()}

        {/* Comment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 留言 (選填)</Text>
          <Text style={styles.sectionSubtitle}>對這次聚餐有什麼想說的嗎？</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="例如：期待這次聚餐！或是有什麼特別的需求..."
            multiline={true}
            numberOfLines={3}
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/200</Text>
        </View>

        {/* Submit Section */}
        <View style={styles.submitSection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📊 投票總結</Text>
            <Text style={styles.summaryItem}>
              時間選項：{selectedTimeSlots.length} 個
            </Text>
            <Text style={styles.summaryItem}>
              餐廳選項：{selectedRestaurants.length} 個
            </Text>
            {comment.trim() && (
              <Text style={styles.summaryItem}>
                留言：已填寫
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (selectedTimeSlots.length === 0 || selectedRestaurants.length === 0 || isSubmitting) 
                && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitVote}
            disabled={selectedTimeSlots.length === 0 || selectedRestaurants.length === 0 || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? '提交中...' : '提交投票'}
            </Text>
          </TouchableOpacity>
        </View>
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
  backButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
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
  headerBackButton: {
    paddingVertical: 5,
  },
  headerBackButtonText: {
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
  progressBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  deadlineText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 2,
  },
  content: {
    flex: 1,
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
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 15,
  },
  optionCard: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  selectedOptionCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  restaurantInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  selectedOptionTitle: {
    color: '#1976d2',
  },
  cuisineType: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  selectedCuisineType: {
    color: '#1565c0',
  },
  optionTime: {
    fontSize: 14,
    color: '#6c757d',
  },
  selectedOptionTime: {
    color: '#1565c0',
  },
  optionAddress: {
    fontSize: 14,
    color: '#6c757d',
  },
  selectedOptionAddress: {
    color: '#1565c0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionCount: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  commentInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#495057',
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'right',
    marginTop: 5,
  },
  submitSection: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  summaryItem: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
  },
  submitButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default VotingScreen;