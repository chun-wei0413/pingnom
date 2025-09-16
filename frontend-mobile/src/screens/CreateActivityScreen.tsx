import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../services/api';

type CreateActivityNavigationProp = StackNavigationProp<any>;

export default function CreateActivityScreen() {
  const navigation = useNavigation<CreateActivityNavigationProp>();
  const [formData, setFormData] = useState({
    groupDiningId: '',
    restaurantId: '',
    restaurantName: '',
    attendedAt: new Date(),
    participants: '1',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.attendedAt;
    setShowDatePicker(Platform.OS === 'ios');
    setFormData(prev => ({
      ...prev,
      attendedAt: currentDate,
    }));
  };

  const validateForm = () => {
    if (!formData.restaurantName.trim()) {
      Alert.alert('錯誤', '請輸入餐廳名稱');
      return false;
    }

    const participants = parseInt(formData.participants);
    if (isNaN(participants) || participants < 1) {
      Alert.alert('錯誤', '參與人數必須為正整數');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const participants = parseInt(formData.participants);
      const attendedAt = formData.attendedAt.toISOString();

      const createData = {
        groupDiningId: formData.groupDiningId || `manual-${Date.now()}`,
        restaurantId: formData.restaurantId || `restaurant-${Date.now()}`,
        restaurantName: formData.restaurantName.trim(),
        attendedAt,
        participants,
      };

      console.log('Creating activity with data:', createData);

      const response = await api.createActivityHistory(createData);
      console.log('Create activity response:', response);

      Alert.alert('成功', '活動歷史已建立', [
        {
          text: '確定',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating activity:', error);
      Alert.alert('錯誤', '建立活動歷史失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>新增活動歷史</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
          <Text style={[styles.saveButton, isLoading && styles.disabledButton]}>
            {isLoading ? '儲存中...' : '儲存'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本資訊</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>餐廳名稱 *</Text>
            <TextInput
              style={styles.input}
              value={formData.restaurantName}
              onChangeText={(value) => handleInputChange('restaurantName', value)}
              placeholder="請輸入餐廳名稱"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>用餐時間 *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(formData.attendedAt)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>參與人數 *</Text>
            <TextInput
              style={styles.input}
              value={formData.participants}
              onChangeText={(value) => handleInputChange('participants', value)}
              placeholder="1"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>進階選項 (選填)</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>聚餐計畫 ID</Text>
            <TextInput
              style={styles.input}
              value={formData.groupDiningId}
              onChangeText={(value) => handleInputChange('groupDiningId', value)}
              placeholder="如果這是透過聚餐計畫產生的活動，請輸入計畫 ID"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>餐廳 ID</Text>
            <TextInput
              style={styles.input}
              value={formData.restaurantId}
              onChangeText={(value) => handleInputChange('restaurantId', value)}
              placeholder="餐廳的唯一識別碼"
            />
          </View>
        </View>

        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            * 為必填欄位{'\n'}
            建立後可在活動歷史中查看和編輯狀態、備註等資訊
          </Text>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={formData.attendedAt}
          mode="datetime"
          is24Hour={true}
          onChange={handleDateChange}
        />
      )}
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
  cancelButton: {
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  hintContainer: {
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});