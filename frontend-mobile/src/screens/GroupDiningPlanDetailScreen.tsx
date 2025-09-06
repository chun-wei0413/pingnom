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
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootState, AppDispatch } from '../store';
import type { GroupDiningStackParamList } from '../navigation/AppNavigator';
import type { TimeSlot, RestaurantOption } from '../types/api';
import { 
  fetchGroupDiningPlan,
  joinGroupDiningPlan,
  startVoting,
  addTimeSlot,
  addRestaurantOption,
  clearError,
  clearCurrentPlan
} from '../store/groupDiningSlice';

interface RouteParams {
  planId: string;
}

type GroupDiningPlanDetailScreenNavigationProp = StackNavigationProp<GroupDiningStackParamList, 'GroupDiningPlanDetail'>;

const GroupDiningPlanDetailScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<GroupDiningPlanDetailScreenNavigationProp>();
  const route = useRoute();
  const { planId } = route.params as RouteParams;
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'participants' | 'voting'>('details');
  
  // Modal states
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  
  // Time slot form states
  const [timeSlotDescription, setTimeSlotDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Restaurant form states
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentPlan, loading, error } = useSelector((state: RootState) => state.groupDining);

  useEffect(() => {
    loadPlan();
    return () => {
      dispatch(clearCurrentPlan());
    };
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlan();
    setRefreshing(false);
  };

  const handleJoinPlan = async () => {
    if (!user || !currentPlan) return;

    try {
      await dispatch(joinGroupDiningPlan({
        planId,
        userData: {
          user_id: user.id,
          display_name: user.display_name,
        }
      })).unwrap();
      
      Alert.alert('成功', '已成功加入聚餐計畫！');
    } catch (error) {
      console.error('加入聚餐計畫失敗:', error);
      Alert.alert('錯誤', '加入聚餐計畫失敗，請稍後再試');
    }
  };

  const handleStartVoting = async () => {
    if (!currentPlan) return;

    Alert.alert(
      '開始投票',
      '確定要開始投票嗎？開始後參與者就可以對時間和餐廳進行投票。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: async () => {
            try {
              await dispatch(startVoting({
                planId,
                votingData: {}
              })).unwrap();
              
              Alert.alert('成功', '投票已開始！');
            } catch (error) {
              console.error('開始投票失敗:', error);
              Alert.alert('錯誤', '開始投票失敗，請稍後再試');
            }
          }
        }
      ]
    );
  };

  const openTimeSlotModal = () => {
    setShowTimeSlotModal(true);
  };

  const openRestaurantModal = () => {
    setShowRestaurantModal(true);
  };

  const handleAddTimeSlot = async () => {
    if (!timeSlotDescription.trim() || !startTime || !endTime) {
      Alert.alert('錯誤', '請填寫完整的時間選項資訊');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      Alert.alert('錯誤', '結束時間必須晚於開始時間');
      return;
    }

    try {
      await dispatch(addTimeSlot({
        planId,
        timeSlotData: {
          description: timeSlotDescription.trim(),
          start_time: startTime,
          end_time: endTime,
        }
      })).unwrap();

      // Reset form
      setTimeSlotDescription('');
      setStartTime('');
      setEndTime('');
      setShowTimeSlotModal(false);
      
      Alert.alert('成功', '時間選項已新增');
    } catch (error) {
      console.error('新增時間選項失敗:', error);
      Alert.alert('錯誤', '新增時間選項失敗，請稍後再試');
    }
  };

  const handleAddRestaurant = async () => {
    if (!restaurantName.trim() || !restaurantAddress.trim() || !cuisineType.trim()) {
      Alert.alert('錯誤', '請填寫完整的餐廳資訊');
      return;
    }

    // Validate coordinates (optional for now, can use default values)
    const lat = parseFloat(latitude) || 25.0330; // 默認台北市經緯度
    const lng = parseFloat(longitude) || 121.5654;

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('錯誤', '請輸入有效的經緯度座標');
      return;
    }

    try {
      await dispatch(addRestaurantOption({
        planId,
        restaurantData: {
          name: restaurantName.trim(),
          address: restaurantAddress.trim(),
          latitude: lat,
          longitude: lng,
          cuisine_type: cuisineType.trim(),
        }
      })).unwrap();

      // Reset form
      setRestaurantName('');
      setRestaurantAddress('');
      setCuisineType('');
      setLatitude('');
      setLongitude('');
      setShowRestaurantModal(false);
      
      Alert.alert('成功', '餐廳選項已新增');
    } catch (error) {
      console.error('新增餐廳選項失敗:', error);
      Alert.alert('錯誤', '新增餐廳選項失敗，請稍後再試');
    }
  };

  const navigateToVoting = () => {
    navigation.navigate('Voting', { planId });
  };

  const navigateToResults = () => {
    navigation.navigate('VotingResults', { planId });
  };

  if (!currentPlan) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  const isCreator = user?.id === currentPlan.created_by;
  const isParticipant = currentPlan.participants.some(p => p.user_id === user?.id);
  const canJoin = user && !isParticipant && currentPlan.status === 'planning';
  const canStartVoting = isCreator && currentPlan.status === 'planning' && 
                        currentPlan.time_slots.length > 0 && 
                        currentPlan.restaurant_options.length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return '#3498db';
      case 'voting': return '#f39c12';
      case 'finalized': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return '規劃中';
      case 'voting': return '投票中';
      case 'finalized': return '已確認';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  const renderTimeSlots = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⏰ 時間選項</Text>
        {isCreator && currentPlan.status === 'planning' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={openTimeSlotModal}
          >
            <Text style={styles.addButtonText}>+ 新增</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {currentPlan.time_slots.length === 0 ? (
        <Text style={styles.emptyText}>尚未新增時間選項</Text>
      ) : (
        currentPlan.time_slots.map((timeSlot: TimeSlot) => (
          <View key={timeSlot.id} style={styles.optionCard}>
            <Text style={styles.optionTitle}>{timeSlot.description}</Text>
            <Text style={styles.optionTime}>
              {new Date(timeSlot.start_time).toLocaleString('zh-TW')} - {' '}
              {new Date(timeSlot.end_time).toLocaleString('zh-TW')}
            </Text>
            {currentPlan.status !== 'planning' && (
              <Text style={styles.voteCount}>🗳️ {timeSlot.vote_count} 票</Text>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderRestaurantOptions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🍽️ 餐廳選項</Text>
        {isCreator && currentPlan.status === 'planning' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={openRestaurantModal}
          >
            <Text style={styles.addButtonText}>+ 新增</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {currentPlan.restaurant_options.length === 0 ? (
        <Text style={styles.emptyText}>尚未新增餐廳選項</Text>
      ) : (
        currentPlan.restaurant_options.map((restaurant: RestaurantOption) => (
          <View key={restaurant.id} style={styles.optionCard}>
            <Text style={styles.optionTitle}>{restaurant.name}</Text>
            <Text style={styles.optionAddress}>{restaurant.address}</Text>
            <Text style={styles.optionCuisine}>菜系：{restaurant.cuisine_type}</Text>
            {currentPlan.status !== 'planning' && (
              <Text style={styles.voteCount}>🗳️ {restaurant.vote_count} 票</Text>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderParticipants = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👥 參與者 ({currentPlan.participants.length})</Text>
      {currentPlan.participants.map((participant, index) => (
        <View key={participant.user_id} style={styles.participantCard}>
          <Text style={styles.participantName}>{participant.display_name}</Text>
          <View style={styles.participantInfo}>
            {participant.user_id === currentPlan.created_by && (
              <Text style={styles.creatorBadge}>創建者</Text>
            )}
            {currentPlan.status === 'voting' && (
              <Text style={[styles.voteBadge, participant.has_voted && styles.votedBadge]}>
                {participant.has_voted ? '已投票' : '未投票'}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Time Slot Modal */}
      <Modal
        visible={showTimeSlotModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeSlotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新增時間選項</Text>
              <TouchableOpacity onPress={() => setShowTimeSlotModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>描述 *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={timeSlotDescription}
                  onChangeText={setTimeSlotDescription}
                  placeholder="例如：週五晚餐時間"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>開始時間 *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="2024-12-01T18:00:00Z"
                />
                <Text style={styles.inputHint}>格式：YYYY-MM-DDTHH:MM:SSZ</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>結束時間 *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="2024-12-01T20:00:00Z"
                />
                <Text style={styles.inputHint}>格式：YYYY-MM-DDTHH:MM:SSZ</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowTimeSlotModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleAddTimeSlot}
                disabled={loading}
              >
                <Text style={styles.modalConfirmButtonText}>
                  {loading ? '新增中...' : '新增'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Restaurant Modal */}
      <Modal
        visible={showRestaurantModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRestaurantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新增餐廳選項</Text>
              <TouchableOpacity onPress={() => setShowRestaurantModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>餐廳名稱 *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                  placeholder="例如：鼎泰豐"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>餐廳地址 *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={restaurantAddress}
                  onChangeText={setRestaurantAddress}
                  placeholder="例如：台北市大安區信義路二段"
                  maxLength={200}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>菜系類型 *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={cuisineType}
                  onChangeText={setCuisineType}
                  placeholder="例如：中式、日式、西式"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>緯度 (可選)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="例如：25.0330 (默認台北市)"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>經度 (可選)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="例如：121.5654 (默認台北市)"
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowRestaurantModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleAddRestaurant}
                disabled={loading}
              >
                <Text style={styles.modalConfirmButtonText}>
                  {loading ? '新增中...' : '新增'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentPlan.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentPlan.status) }]}>
          <Text style={styles.statusText}>{getStatusText(currentPlan.status)}</Text>
        </View>
        <Text style={styles.participantCount}>
          {currentPlan.participants.length} 人參與
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 聚餐描述</Text>
          <Text style={styles.description}>
            {currentPlan.description || '無描述'}
          </Text>
        </View>

        {renderTimeSlots()}
        {renderRestaurantOptions()}
        {renderParticipants()}

        {/* Actions */}
        <View style={styles.actionsSection}>
          {canJoin && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleJoinPlan}
              disabled={loading}
            >
              <Text style={styles.actionButtonText}>加入聚餐</Text>
            </TouchableOpacity>
          )}

          {canStartVoting && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleStartVoting}
              disabled={loading}
            >
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                開始投票
              </Text>
            </TouchableOpacity>
          )}

          {currentPlan.status === 'voting' && isParticipant && (
            <TouchableOpacity
              style={[styles.actionButton, styles.voteButton]}
              onPress={navigateToVoting}
            >
              <Text style={[styles.actionButtonText, styles.voteButtonText]}>
                參與投票
              </Text>
            </TouchableOpacity>
          )}

          {(currentPlan.status === 'voting' || currentPlan.status === 'finalized') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={navigateToResults}
            >
              <Text style={styles.actionButtonText}>查看結果</Text>
            </TouchableOpacity>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  placeholder: {
    width: 40,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  participantCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  optionCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  optionTime: {
    fontSize: 14,
    color: '#6c757d',
  },
  optionAddress: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  optionCuisine: {
    fontSize: 12,
    color: '#495057',
  },
  voteCount: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
    marginTop: 5,
  },
  participantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  participantName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  participantInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  creatorBadge: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
  },
  voteBadge: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: '600',
  },
  votedBadge: {
    color: '#27ae60',
  },
  actionsSection: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    padding: 20,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  voteButton: {
    backgroundColor: '#f39c12',
    borderColor: '#f39c12',
  },
  voteButtonText: {
    color: '#ffffff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#495057',
  },
  inputHint: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  modalConfirmButton: {
    backgroundColor: '#3498db',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default GroupDiningPlanDetailScreen;