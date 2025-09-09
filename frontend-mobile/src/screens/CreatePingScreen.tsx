import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootState } from '../store';
import type { GroupDiningStackParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';

type CreatePingNavigationProp = StackNavigationProp<GroupDiningStackParamList>;

interface Friend {
  id: string;
  user_id: string;
  friend_user_id: string;
  display_name: string;
  email: string;
}

const pingTypes = [
  { value: 'breakfast', label: '早餐', icon: '🍳' },
  { value: 'lunch', label: '午餐', icon: '🍱' },
  { value: 'dinner', label: '晚餐', icon: '🍽️' },
  { value: 'snack', label: '點心', icon: '🍰' },
] as const;

export default function CreatePingScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<CreatePingNavigationProp>();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPingType, setSelectedPingType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      const response = await api.getFriends();
      console.log('Friends response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        setFriends(response.data);
      }
    } catch (error) {
      console.error('載入朋友列表失敗:', error);
      Alert.alert('錯誤', '無法載入朋友列表');
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(scheduledDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setScheduledDate(newDate);
    }
  };

  const toggleFriendSelection = (friendUserId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendUserId)
        ? prev.filter(id => id !== friendUserId)
        : [...prev, friendUserId]
    );
  };

  const handleCreatePing = async () => {
    if (!user) {
      Alert.alert('錯誤', '使用者未登入');
      return;
    }

    if (!title.trim()) {
      Alert.alert('錯誤', '請輸入聚餐標題');
      return;
    }

    if (selectedFriends.length === 0) {
      Alert.alert('錯誤', '請至少選擇一位朋友');
      return;
    }

    if (scheduledDate <= new Date()) {
      Alert.alert('錯誤', '預定時間必須在未來');
      return;
    }

    try {
      setLoading(true);
      
      const pingData = {
        title: title.trim(),
        description: description.trim(),
        pingType: selectedPingType,
        scheduledAt: scheduledDate.toISOString(),
        invitees: selectedFriends,
      };

      console.log('Creating ping:', pingData);
      
      const response = await api.createPing(pingData);
      console.log('Create ping response:', response);

      Alert.alert(
        '成功',
        'Ping 創建成功！',
        [
          {
            text: '確定',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('創建 Ping 失敗:', error);
      Alert.alert('錯誤', '創建 Ping 失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 標題輸入 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>聚餐標題 *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="例如：週末聚餐、慶生派對..."
              maxLength={100}
            />
          </View>

          {/* 描述輸入 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>詳細描述</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="詳細說明聚餐內容、注意事項等..."
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* 餐點類型選擇 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>餐點類型</Text>
            <View style={styles.pingTypeContainer}>
              {pingTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.pingTypeButton,
                    selectedPingType === type.value && styles.pingTypeButtonActive,
                  ]}
                  onPress={() => setSelectedPingType(type.value)}
                >
                  <Text style={styles.pingTypeIcon}>{type.icon}</Text>
                  <Text
                    style={[
                      styles.pingTypeText,
                      selectedPingType === type.value && styles.pingTypeTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 時間選擇 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>預定時間</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeLabel}>日期</Text>
                <Text style={styles.dateTimeValue}>{formatDate(scheduledDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeLabel}>時間</Text>
                <Text style={styles.dateTimeValue}>{formatTime(scheduledDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 朋友選擇 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>邀請朋友 *</Text>
            {loadingFriends ? (
              <Text style={styles.loadingText}>載入朋友列表中...</Text>
            ) : friends.length === 0 ? (
              <Text style={styles.emptyText}>沒有朋友可邀請，請先新增朋友</Text>
            ) : (
              <View style={styles.friendsContainer}>
                {friends.map((friend) => {
                  const friendUserId = friend.friend_user_id || friend.user_id;
                  const isSelected = selectedFriends.includes(friendUserId);
                  
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.friendButton,
                        isSelected && styles.friendButtonActive,
                      ]}
                      onPress={() => toggleFriendSelection(friendUserId)}
                    >
                      <Text
                        style={[
                          styles.friendText,
                          isSelected && styles.friendTextActive,
                        ]}
                      >
                        {friend.display_name || friend.email}
                      </Text>
                      {isSelected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {selectedFriends.length > 0 && (
              <Text style={styles.selectedCount}>
                已選擇 {selectedFriends.length} 位朋友
              </Text>
            )}
          </View>

          {/* 創建按鈕 */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreatePing}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? '創建中...' : '發送邀請'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 日期選擇器 */}
        {showDatePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* 時間選擇器 */}
        {showTimePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pingTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pingTypeButton: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingTypeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pingTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  pingTypeText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  pingTypeTextActive: {
    color: '#fff',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  friendsContainer: {
    gap: 8,
  },
  friendButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  friendText: {
    fontSize: 16,
    color: '#374151',
  },
  friendTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  selectedCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});