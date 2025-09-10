import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootState } from '../store';
import type { Bill } from '../types/api';
import { api } from '../services/api';

type BillsNavigationProp = StackNavigationProp<any>;

export default function BillsScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<BillsNavigationProp>();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'created' | 'participant'>('all');

  // 當畫面聚焦時載入資料
  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [selectedFilter])
  );

  const loadBills = async () => {
    try {
      setIsLoading(true);
      console.log('Loading bills with filter:', selectedFilter);
      
      const response = await api.getUserBills(selectedFilter);
      console.log('Bills API response:', response);
      
      if (response && response.bills) {
        setBills(response.bills);
      } else {
        setBills([]);
      }
    } catch (error) {
      console.error('Error loading bills:', error);
      Alert.alert('錯誤', '無法載入帳單資料');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBills();
    setRefreshing(false);
  };

  const navigateToCreateBill = () => {
    navigation.navigate('CreateBill');
  };

  const navigateToBillDetail = (billId: string) => {
    navigation.navigate('BillDetail', { billId });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'active': return '進行中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'draft': return styles.statusDraft;
      case 'active': return styles.statusActive;
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      default: return styles.statusDraft;
    }
  };

  const renderBill = (bill: Bill) => (
    <TouchableOpacity
      key={bill.id}
      style={styles.billCard}
      onPress={() => navigateToBillDetail(bill.id)}
    >
      <View style={styles.billHeader}>
        <Text style={styles.billTitle}>{bill.title}</Text>
        <View style={[styles.statusBadge, getStatusStyle(bill.status)]}>
          <Text style={styles.statusText}>{getStatusText(bill.status)}</Text>
        </View>
      </View>
      
      {bill.description && (
        <Text style={styles.billDescription} numberOfLines={2}>
          {bill.description}
        </Text>
      )}
      
      <View style={styles.billStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>總金額</Text>
          <Text style={styles.statValue}>${bill.totalAmount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>參與者</Text>
          <Text style={styles.statValue}>{Object.keys(bill.participants).length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>項目</Text>
          <Text style={styles.statValue}>{bill.items.length}</Text>
        </View>
      </View>
      
      <Text style={styles.billDate}>
        {new Date(bill.createdAt).toLocaleDateString('zh-TW')}
      </Text>
    </TouchableOpacity>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('all')}
      >
        <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
          全部
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'created' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('created')}
      >
        <Text style={[styles.filterText, selectedFilter === 'created' && styles.filterTextActive]}>
          我建立的
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'participant' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('participant')}
      >
        <Text style={[styles.filterText, selectedFilter === 'participant' && styles.filterTextActive]}>
          參與的
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>帳單分攤</Text>
        <TouchableOpacity style={styles.addButton} onPress={navigateToCreateBill}>
          <Text style={styles.addButtonText}>+ 新增帳單</Text>
        </TouchableOpacity>
      </View>

      {renderFilterButtons()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        ) : bills.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>目前沒有帳單</Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={navigateToCreateBill}>
              <Text style={styles.createFirstButtonText}>建立第一個帳單</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.billsList}>
            {bills.map(renderBill)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterText: {
    color: '#6c757d',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#6c757d',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6c757d',
    fontSize: 16,
    marginBottom: 16,
  },
  createFirstButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  billsList: {
    padding: 16,
  },
  billCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusDraft: {
    backgroundColor: '#ffeaa7',
  },
  statusActive: {
    backgroundColor: '#74b9ff',
  },
  statusCompleted: {
    backgroundColor: '#00b894',
  },
  statusCancelled: {
    backgroundColor: '#e17055',
  },
  billDescription: {
    color: '#6c757d',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  billStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  billDate: {
    fontSize: 12,
    color: '#adb5bd',
    textAlign: 'right',
  },
});