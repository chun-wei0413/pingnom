import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Loading from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createPing, fetchUserPings } from '@/store/slices/pingSlice';
import { PingRequest } from '@/services/api/pingApi';

interface CreatePingScreenProps {
  navigation: any;
}

const CreatePingScreen: React.FC<CreatePingScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isCreating, error } = useAppSelector((state) => state.ping);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pingType: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    inviteeEmails: '',
  });
  
  // const [showDatePicker, setShowDatePicker] = useState(false);
  // const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pingTypeOptions = [
    { value: 'breakfast', label: '🌅 早餐', emoji: '🌅' },
    { value: 'lunch', label: '🍽️ 午餐', emoji: '🍽️' },
    { value: 'dinner', label: '🌆 晚餐', emoji: '🌆' },
    { value: 'snack', label: '🍿 點心', emoji: '🍿' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateTimeChange = () => {
    // For now, just add 1 hour to current time
    const newDateTime = new Date(Date.now() + 60 * 60 * 1000);
    setFormData(prev => ({ ...prev, scheduledAt: newDateTime }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '標題是必填欄位';
    }

    if (formData.scheduledAt <= new Date()) {
      newErrors.scheduledAt = '時間必須是未來時間';
    }

    if (!formData.inviteeEmails.trim()) {
      newErrors.inviteeEmails = '請至少邀請一個人';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // For demo purposes, we'll use Alice's user ID as a hardcoded invitee
    // In a real app, this would come from friend selection or user search
    const demoAliceUserId = 'de163489-88b8-40c6-8bc8-0f0522ffc0ec'; // This would be dynamic

    const pingRequest: PingRequest = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      pingType: formData.pingType,
      scheduledAt: formData.scheduledAt.toISOString(),
      invitees: [demoAliceUserId], // In real app, parse emails and get user IDs
    };

    try {
      await dispatch(createPing(pingRequest)).unwrap();
      Alert.alert(
        '成功',
        'Ping 已成功創建！',
        [
          {
            text: '確定',
            onPress: () => {
              // Refresh the pings list and navigate back
              dispatch(fetchUserPings());
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('錯誤', '創建 Ping 失敗，請再試一次');
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('zh-TW') + ' ' + date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>創建 Ping</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>聚餐標題</Text>
          <Input
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder="例如：週末午餐聚會"
            error={errors.title}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>說明 (選填)</Text>
          <Input
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="例如：一起去吃好吃的台菜！"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>

        {/* Ping Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>用餐類型</Text>
          <View style={styles.typeSelector}>
            {pingTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.typeOption,
                  formData.pingType === option.value && styles.typeOptionActive
                ]}
                onPress={() => handleInputChange('pingType', option.value)}
              >
                <Text style={styles.typeEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.typeLabel,
                  formData.pingType === option.value && styles.typeLabelActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>時間</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={handleDateTimeChange}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.dateTimeText}>{formatDateTime(formData.scheduledAt)}</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
          {errors.scheduledAt && (
            <Text style={styles.errorText}>{errors.scheduledAt}</Text>
          )}
        </View>

        {/* Invitees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>邀請對象</Text>
          <Input
            value={formData.inviteeEmails}
            onChangeText={(value) => handleInputChange('inviteeEmails', value)}
            placeholder="輸入朋友的 Email (目前會自動邀請 Alice 作為示例)"
            error={errors.inviteeEmails}
          />
          <Text style={styles.helperText}>
            💡 提示：目前系統會自動邀請 Alice Wang 作為測試
          </Text>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            title="創建 Ping"
            onPress={handleSubmit}
            loading={isCreating}
            disabled={isCreating}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {/* Note: Date/Time picker simplified for demo */}

      {isCreating && <Loading overlay text="創建中..." />}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    minWidth: '45%',
  },
  typeOptionActive: {
    backgroundColor: '#FFF5F3',
    borderColor: '#FF6B35',
  },
  typeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeLabelActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  submitSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});

export default CreatePingScreen;