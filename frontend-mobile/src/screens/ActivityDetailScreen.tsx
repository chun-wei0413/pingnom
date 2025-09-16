import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ActivityHistory } from '../types/api';
import { api } from '../services/api';

type ActivityDetailNavigationProp = StackNavigationProp<any>;
type RouteParams = {
  activityId: string;
};

const STATUS_OPTIONS = [
  { key: 'pending', label: '進行中', color: '#f59e0b' },
  { key: 'completed', label: '已完成', color: '#10b981' },
  { key: 'cancelled', label: '已取消', color: '#ef4444' },
];

export default function ActivityDetailScreen() {
  const navigation = useNavigation<ActivityDetailNavigationProp>();
  const route = useRoute();
  const { activityId } = route.params as RouteParams;

  const [activity, setActivity] = useState<ActivityHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
    participants: '',
    notes: '',
  });

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    try {
      setIsLoading(true);
      // Since we don't have a single activity API, we'll fetch all and find the one we need
      const response = await api.getUserActivityHistory();

      if (response && response.data && response.data.activities) {
        const foundActivity = response.data.activities.find((act: ActivityHistory) => act.id === activityId);
        if (foundActivity) {
          setActivity(foundActivity);
          setEditData({
            status: foundActivity.status,
            participants: foundActivity.participants.toString(),
            notes: foundActivity.notes || '',
          });
        } else {
          Alert.alert('錯誤', '找不到指定的活動歷史');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error loading activity:', error);
      Alert.alert('錯誤', '載入活動歷史失敗');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activity) return;

    try {
      setIsSaving(true);

      const participants = parseInt(editData.participants);
      if (isNaN(participants) || participants < 1) {
        Alert.alert('錯誤', '參與人數必須為正整數');
        return;
      }

      const updateData = {
        status: editData.status,
        participants,
        notes: editData.notes.trim(),
      };

      console.log('Updating activity with data:', updateData);

      await api.updateActivityHistory(activity.id, updateData);

      // Update local state
      setActivity(prev => prev ? {
        ...prev,
        status: editData.status,
        participants,
        notes: editData.notes.trim(),
        updatedAt: new Date().toISOString(),
      } : null);

      setIsEditing(false);
      Alert.alert('成功', '活動歷史已更新');
    } catch (error) {
      console.error('Error updating activity:', error);
      Alert.alert('錯誤', '更新活動歷史失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!activity) return;

    setEditData({
      status: activity.status,
      participants: activity.participants.toString(),
      notes: activity.notes || '',
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(option => option.key === status);
    return statusOption?.color || '#6b7280';
  };

  const getStatusText = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(option => option.key === status);
    return statusOption?.label || status;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>找不到活動歷史</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>活動詳情</Text>
        {isEditing ? (
          <View style={styles.editActions}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text style={[styles.saveButton, isSaving && styles.disabledButton]}>
                {isSaving ? '儲存中...' : '儲存'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.editButton}>編輯</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本資訊</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>餐廳名稱</Text>
            <Text style={styles.infoValue}>{activity.restaurantName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>用餐時間</Text>
            <Text style={styles.infoValue}>{formatDate(activity.attendedAt)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>建立時間</Text>
            <Text style={styles.infoValue}>{formatDate(activity.createdAt)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>最後更新</Text>
            <Text style={styles.infoValue}>{formatDate(activity.updatedAt)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>可編輯資訊</Text>

          <View style={styles.editableRow}>
            <Text style={styles.infoLabel}>狀態</Text>
            {isEditing ? (
              <View style={styles.statusOptions}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.statusOption,
                      editData.status === option.key && styles.statusOptionActive,
                    ]}
                    onPress={() => setEditData(prev => ({ ...prev, status: option.key as any }))}
                  >
                    <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                    <Text style={[
                      styles.statusOptionText,
                      editData.status === option.key && styles.statusOptionTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(activity.status) }]} />
                <Text style={styles.statusText}>{getStatusText(activity.status)}</Text>
              </View>
            )}
          </View>

          <View style={styles.editableRow}>
            <Text style={styles.infoLabel}>參與人數</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editData.participants}
                onChangeText={(value) => setEditData(prev => ({ ...prev, participants: value }))}
                keyboardType="numeric"
                maxLength={3}
              />
            ) : (
              <Text style={styles.infoValue}>{activity.participants} 人</Text>
            )}
          </View>

          <View style={styles.editableRow}>
            <Text style={styles.infoLabel}>備註</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editData.notes}
                onChangeText={(value) => setEditData(prev => ({ ...prev, notes: value }))}
                placeholder="請輸入備註..."
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            ) : (
              <Text style={[styles.infoValue, !activity.notes && styles.emptyValue]}>
                {activity.notes || '無備註'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系統資訊</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>活動 ID</Text>
            <Text style={styles.infoValueMono}>{activity.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>聚餐計畫 ID</Text>
            <Text style={styles.infoValueMono}>{activity.groupDiningId}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>餐廳 ID</Text>
            <Text style={styles.infoValueMono}>{activity.restaurantId}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  backButton: {
    fontSize: 16,
    color: '#3b82f6',
  },
  editButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  editableRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  infoValueMono: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 2,
    textAlign: 'right',
  },
  emptyValue: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#111827',
  },
  statusOptions: {
    marginTop: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  statusOptionActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  statusOptionTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
    marginTop: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
  },
});