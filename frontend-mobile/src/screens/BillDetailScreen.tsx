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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootState } from '../store';
import type { Bill, BillParticipant } from '../types/api';
import { api } from '../services/api';

type BillDetailNavigationProp = StackNavigationProp<any>;
type BillDetailRouteProp = RouteProp<{ BillDetail: { billId: string } }, 'BillDetail'>;

export default function BillDetailScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<BillDetailNavigationProp>();
  const route = useRoute<BillDetailRouteProp>();
  const { billId } = route.params;

  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBill();
    }, [billId])
  );

  const loadBill = async () => {
    try {
      setIsLoading(true);
      console.log('Loading bill:', billId);
      
      const response = await api.getBill(billId);
      console.log('Bill detail response:', response);
      
      if (response) {
        setBill(response);
      } else {
        throw new Error('Bill not found');
      }
    } catch (error) {
      console.error('Error loading bill:', error);
      Alert.alert('錯誤', '無法載入帳單資料', [
        { text: '返回', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBill();
    setRefreshing(false);
  };

  const handleAddItem = () => {
    if (!bill) return;
    navigation.navigate('AddBillItem', { billId: bill.id });
  };

  const handleAddParticipant = () => {
    if (!bill) return;
    navigation.navigate('AddBillParticipant', { billId: bill.id });
  };

  const handleMarkPaid = (participant: BillParticipant) => {
    if (!bill || !user) return;

    const isCurrentUser = participant.userId === user.id;
    const actionText = isCurrentUser ? '標記自己已付款' : `標記 ${participant.displayName} 已付款`;
    
    Alert.alert(
      '確認付款',
      `${actionText}？\n應付金額：$${participant.balance.toFixed(2)}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確認',
          onPress: async () => {
            try {
              await api.markBillPaid(bill.id, {
                userId: participant.userId,
                amount: participant.totalAmount,
              });
              Alert.alert('成功', '付款狀態已更新');
              loadBill(); // 重新載入資料
            } catch (error) {
              console.error('Error marking as paid:', error);
              Alert.alert('錯誤', '更新付款狀態失敗');
            }
          },
        },
      ]
    );
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

  const renderBillItems = () => {
    if (!bill || bill.items.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>尚未新增任何項目</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Text style={styles.addButtonText}>+ 新增項目</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        {bill.items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemAmount}>${item.amount}</Text>
            </View>
            {item.description && (
              <Text style={styles.itemDescription}>{item.description}</Text>
            )}
            <Text style={styles.itemPayers}>
              分攤者 ({item.payerIds.length}人): {
                item.payerIds.map(payerId => {
                  const participant = bill.participants[payerId];
                  return participant ? participant.displayName : '未知用戶';
                }).join(', ')
              }
            </Text>
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>+ 新增項目</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderParticipants = () => {
    if (!bill) return null;

    const participants = Object.values(bill.participants);
    
    if (participants.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>尚未新增任何參與者</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddParticipant}>
            <Text style={styles.addButtonText}>+ 新增參與者</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        {participants.map((participant) => (
          <View key={participant.userId} style={styles.participantCard}>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{participant.displayName}</Text>
              <View style={styles.participantAmounts}>
                <Text style={styles.participantTotal}>應付：${participant.totalAmount.toFixed(2)}</Text>
                <Text style={styles.participantPaid}>已付：${participant.paidAmount.toFixed(2)}</Text>
                <Text style={[
                  styles.participantBalance,
                  participant.balance > 0 ? styles.balanceOwed : styles.balancePaid
                ]}>
                  {participant.balance > 0 ? `欠款：$${participant.balance.toFixed(2)}` : '已結清'}
                </Text>
              </View>
            </View>
            {participant.balance > 0 && (
              <TouchableOpacity
                style={styles.markPaidButton}
                onPress={() => handleMarkPaid(participant)}
              >
                <Text style={styles.markPaidButtonText}>標記已付</Text>
              </TouchableOpacity>
            )}
            {participant.isPaid && (
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>✓ 已付清</Text>
              </View>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={handleAddParticipant}>
          <Text style={styles.addButtonText}>+ 新增參與者</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading && !bill) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bill) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>找不到帳單資料</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <View style={[styles.statusBadge, getStatusStyle(bill.status)]}>
          <Text style={styles.statusText}>{getStatusText(bill.status)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 帳單基本資訊 */}
        <View style={styles.billInfo}>
          <Text style={styles.billTitle}>{bill.title}</Text>
          {bill.description && (
            <Text style={styles.billDescription}>{bill.description}</Text>
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
            建立時間：{new Date(bill.createdAt).toLocaleString('zh-TW')}
          </Text>
        </View>

        {/* 項目列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>消費項目</Text>
          {renderBillItems()}
        </View>

        {/* 參與者列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>參與者</Text>
          {renderParticipants()}
        </View>
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
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6c757d',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    marginBottom: 16,
  },
  billInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
  },
  billTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  billDescription: {
    color: '#6c757d',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  billStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  billDate: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  emptySection: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6c757d',
    fontSize: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  itemDescription: {
    color: '#6c757d',
    fontSize: 14,
    marginBottom: 4,
  },
  itemPayers: {
    color: '#495057',
    fontSize: 12,
  },
  participantCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  participantAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  participantTotal: {
    fontSize: 12,
    color: '#495057',
    marginRight: 12,
  },
  participantPaid: {
    fontSize: 12,
    color: '#28a745',
    marginRight: 12,
  },
  participantBalance: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceOwed: {
    color: '#dc3545',
  },
  balancePaid: {
    color: '#28a745',
  },
  markPaidButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  markPaidButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  paidBadge: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadgeText: {
    color: '#155724',
    fontSize: 12,
    fontWeight: '600',
  },
});