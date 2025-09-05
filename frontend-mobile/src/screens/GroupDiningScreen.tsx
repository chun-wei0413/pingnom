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
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { RootState, AppDispatch } from '../store';
import type { GroupDiningPlan } from '../types/api';
import { 
  fetchGroupDiningPlans, 
  clearError 
} from '../store/groupDiningSlice';

const GroupDiningScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { plans, loading, error } = useSelector((state: RootState) => state.groupDining);

  useEffect(() => {
    loadPlans();
  }, [activeTab]);

  useEffect(() => {
    if (error) {
      Alert.alert('錯誤', error);
      dispatch(clearError());
    }
  }, [error]);

  const loadPlans = async () => {
    if (!user) return;
    
    try {
      const params = activeTab === 'created' 
        ? { created_by: user.id }
        : { user_id: user.id };
      await dispatch(fetchGroupDiningPlans(params)).unwrap();
    } catch (error) {
      console.error('載入聚餐計畫失敗:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlans();
    setRefreshing(false);
  };

  const navigateToCreatePlan = () => {
    navigation.navigate('CreateGroupDiningPlan' as never);
  };

  const navigateToPlanDetail = (plan: GroupDiningPlan) => {
    navigation.navigate('GroupDiningPlanDetail' as never, { planId: plan.id } as never);
  };

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

  const renderPlanCard = (plan: GroupDiningPlan) => (
    <TouchableOpacity
      key={plan.id}
      style={styles.planCard}
      onPress={() => navigateToPlanDetail(plan)}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{plan.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(plan.status) }]}>
          <Text style={styles.statusText}>{getStatusText(plan.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.planDescription} numberOfLines={2}>
        {plan.description || '沒有描述'}
      </Text>
      
      <View style={styles.planInfo}>
        <Text style={styles.infoText}>
          👥 {plan.participants.length} 人參與
        </Text>
        <Text style={styles.infoText}>
          🍽️ {plan.restaurant_options.length} 餐廳選項
        </Text>
        <Text style={styles.infoText}>
          ⏰ {plan.time_slots.length} 時間選項
        </Text>
      </View>
      
      <Text style={styles.planDate}>
        建立於 {new Date(plan.created_at).toLocaleDateString('zh-TW')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>聚餐規劃</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={navigateToCreatePlan}
        >
          <Text style={styles.createButtonText}>+ 新建聚餐</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'created' && styles.activeTab]}
          onPress={() => setActiveTab('created')}
        >
          <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
            我創建的
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            我參與的
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && plans.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'created' ? '您還沒有創建任何聚餐計畫' : '您還沒有參與任何聚餐計畫'}
            </Text>
            <Text style={styles.emptySubtext}>
              點擊「新建聚餐」開始您的第一個聚餐計畫！
            </Text>
          </View>
        ) : (
          <View style={styles.plansList}>
            {plans.map(renderPlanCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  createButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    color: '#6c757d',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
  plansList: {
    padding: 15,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 20,
  },
  planInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#495057',
    marginRight: 15,
    marginBottom: 4,
  },
  planDate: {
    fontSize: 12,
    color: '#adb5bd',
  },
});

export default GroupDiningScreen;