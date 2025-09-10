import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { api } from '../services/api';

type CreateBillNavigationProp = StackNavigationProp<any>;

export default function CreateBillScreen() {
  const navigation = useNavigation<CreateBillNavigationProp>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateBill = async () => {
    if (!title.trim()) {
      Alert.alert('錯誤', '請輸入帳單標題');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Creating bill:', { title: title.trim(), description: description.trim() });
      
      const response = await api.createBill({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      
      console.log('Create bill response:', response);
      
      if (response && response.billId) {
        Alert.alert(
          '成功',
          '帳單已建立',
          [
            {
              text: '確定',
              onPress: () => {
                // 導航到帳單詳情頁面
                navigation.replace('BillDetail', { billId: response.billId });
              },
            },
          ]
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      Alert.alert('錯誤', '建立帳單失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || description.trim()) {
      Alert.alert(
        '確認',
        '您有未儲存的變更，確定要離開嗎？',
        [
          { text: '取消', style: 'cancel' },
          { text: '離開', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>建立帳單</Text>
          <TouchableOpacity
            style={[styles.createButton, (!title.trim() || isLoading) && styles.createButtonDisabled]}
            onPress={handleCreateBill}
            disabled={!title.trim() || isLoading}
          >
            <Text style={[styles.createButtonText, (!title.trim() || isLoading) && styles.createButtonTextDisabled]}>
              {isLoading ? '建立中...' : '建立'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* 標題欄位 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>帳單標題 *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="例如：聚餐分攤、購物清單..."
                placeholderTextColor="#adb5bd"
                maxLength={100}
              />
              <Text style={styles.characterCount}>{title.length}/100</Text>
            </View>

            {/* 描述欄位 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>描述（選填）</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="描述這個帳單的用途..."
                placeholderTextColor="#adb5bd"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{description.length}/500</Text>
            </View>

            {/* 說明區塊 */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>接下來您可以：</Text>
              <View style={styles.infoList}>
                <Text style={styles.infoItem}>• 添加參與者</Text>
                <Text style={styles.infoItem}>• 新增消費項目</Text>
                <Text style={styles.infoItem}>• 設定每項支出的分攤者</Text>
                <Text style={styles.infoItem}>• 記錄付款狀況</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardContainer: {
    flex: 1,
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
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  createButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonTextDisabled: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
  },
  textInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 4,
    fontSize: 12,
    color: '#6c757d',
  },
  infoContainer: {
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0056b3',
    marginBottom: 8,
  },
  infoList: {
    marginLeft: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#0056b3',
    marginBottom: 4,
    lineHeight: 20,
  },
});