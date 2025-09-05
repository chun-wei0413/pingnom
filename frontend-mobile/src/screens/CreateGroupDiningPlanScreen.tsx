import React, { useState } from 'react';
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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { RootState, AppDispatch } from '../store';
import { createGroupDiningPlan } from '../store/groupDiningSlice';

const CreateGroupDiningPlanScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.groupDining);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreatePlan = async () => {
    if (!user) {
      Alert.alert('錯誤', '使用者未登入');
      return;
    }

    if (!title.trim()) {
      Alert.alert('錯誤', '請輸入聚餐計畫標題');
      return;
    }

    try {
      const planData = {
        created_by: user.id,
        title: title.trim(),
        description: description.trim(),
      };

      const result = await dispatch(createGroupDiningPlan(planData)).unwrap();
      
      Alert.alert('成功', '聚餐計畫已建立', [
        {
          text: '確定',
          onPress: () => {
            navigation.goBack();
            // Navigate to plan detail with the created plan ID
            navigation.navigate('GroupDiningPlanDetail' as never, { planId: result.id } as never);
          },
        },
      ]);
    } catch (error) {
      console.error('建立聚餐計畫失敗:', error);
      Alert.alert('錯誤', '建立聚餐計畫失敗，請稍後再試');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView 
        style={styles.innerContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>建立聚餐計畫</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.form}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>聚餐標題 *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="例如：週五晚餐聚會"
              maxLength={100}
              multiline={false}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>聚餐描述</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="簡單描述這次聚餐的目的或主題..."
              maxLength={500}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>📝 接下來您可以：</Text>
            <View style={styles.stepsList}>
              <Text style={styles.stepItem}>• 新增時間選項讓朋友投票</Text>
              <Text style={styles.stepItem}>• 新增餐廳選項讓大家選擇</Text>
              <Text style={styles.stepItem}>• 邀請朋友加入聚餐計畫</Text>
              <Text style={styles.stepItem}>• 開始投票並確認最終安排</Text>
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 小貼士：</Text>
            <Text style={styles.tipsText}>
              建議先建立基本計畫，再逐步新增時間和餐廳選項。
              這樣可以讓朋友們更容易參與規劃過程！
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreatePlan}
          disabled={loading || !title.trim()}
        >
          <Text style={styles.createButtonText}>
            {loading ? '建立中...' : '建立聚餐計畫'}
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#495057',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'right',
    marginTop: 5,
  },
  infoSection: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 10,
  },
  stepsList: {
    paddingLeft: 5,
  },
  stepItem: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f57c00',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  createButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default CreateGroupDiningPlanScreen;