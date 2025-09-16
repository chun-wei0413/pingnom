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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { groupApi } from '../services/groupApi';
import Icon from 'react-native-vector-icons/MaterialIcons';

type CreateGroupNavigationProp = StackNavigationProp<any>;

interface FormData {
  name: string;
  description: string;
  privacy: 'public' | 'private';
  maxMembers: number;
}

export default function CreateGroupScreen() {
  const navigation = useNavigation<CreateGroupNavigationProp>();
  
  // 表單狀態
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    privacy: 'public',
    maxMembers: 10,
  });
  
  // UI 狀態
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // 群組名稱驗證
    if (!formData.name.trim()) {
      newErrors.name = '請輸入群組名稱';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '群組名稱至少需要 2 個字符';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = '群組名稱不得超過 50 個字符';
    }

    // 描述驗證
    if (formData.description.length > 200) {
      newErrors.description = '描述不得超過 200 個字符';
    }

    // 最大成員數驗證
    if (formData.maxMembers < 2) {
      newErrors.maxMembers = '群組至少需要 2 名成員';
    } else if (formData.maxMembers > 50) {
      newErrors.maxMembers = '群組最多不得超過 50 名成員';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        privacy: formData.privacy,
        maxMembers: formData.maxMembers,
      };

      console.log('Creating group with data:', groupData);
      const response = await groupApi.createGroup(groupData);
      console.log('Group created:', response);

      Alert.alert(
        '群組建立成功',
        `「${formData.name}」群組已成功建立！`,
        [
          {
            text: '確定',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating group:', error);
      
      let errorMessage = '建立群組失敗，請稍後再試。';
      
      if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('建立失敗', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新表單數據
  const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // 清除該欄位的錯誤
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  // 渲染隱私選項
  const renderPrivacyOption = (option: 'public' | 'private', title: string, description: string, icon: string) => (
    <TouchableOpacity
      key={option}
      style={[
        styles.privacyOption,
        formData.privacy === option && styles.privacyOptionSelected
      ]}
      onPress={() => updateFormData('privacy', option)}
    >
      <View style={styles.privacyOptionHeader}>
        <Icon 
          name={icon} 
          size={24} 
          color={formData.privacy === option ? '#007AFF' : '#666'} 
        />
        <View style={styles.privacyOptionContent}>
          <Text style={[
            styles.privacyOptionTitle,
            formData.privacy === option && styles.privacyOptionTitleSelected
          ]}>
            {title}
          </Text>
          <Text style={styles.privacyOptionDescription}>{description}</Text>
        </View>
        {formData.privacy === option && (
          <Icon name="check-circle" size={24} color="#007AFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  // 渲染成員數量選擇器
  const renderMemberCountSelector = () => (
    <View style={styles.memberCountContainer}>
      <Text style={styles.sectionTitle}>最大成員數</Text>
      <View style={styles.memberCountSelector}>
        <TouchableOpacity
          style={[
            styles.countButton,
            formData.maxMembers <= 2 && styles.countButtonDisabled
          ]}
          onPress={() => {
            if (formData.maxMembers > 2) {
              updateFormData('maxMembers', formData.maxMembers - 1);
            }
          }}
          disabled={formData.maxMembers <= 2}
        >
          <Icon name="remove" size={24} color={formData.maxMembers <= 2 ? '#ccc' : '#007AFF'} />
        </TouchableOpacity>
        
        <View style={styles.countDisplay}>
          <Text style={styles.countNumber}>{formData.maxMembers}</Text>
          <Text style={styles.countLabel}>人</Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.countButton,
            formData.maxMembers >= 50 && styles.countButtonDisabled
          ]}
          onPress={() => {
            if (formData.maxMembers < 50) {
              updateFormData('maxMembers', formData.maxMembers + 1);
            }
          }}
          disabled={formData.maxMembers >= 50}
        >
          <Icon name="add" size={24} color={formData.maxMembers >= 50 ? '#ccc' : '#007AFF'} />
        </TouchableOpacity>
      </View>
      <Text style={styles.memberCountHint}>建議設定為經常一起聚餐的朋友數量</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 標題列 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>建立群組</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 群組名稱 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>群組名稱 *</Text>
            <TextInput
              style={[styles.textInput, errors.name && styles.textInputError]}
              placeholder="例如：週末聚餐團、辦公室午餐群"
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              maxLength={50}
              placeholderTextColor="#999"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            <Text style={styles.characterCount}>
              {formData.name.length}/50
            </Text>
          </View>

          {/* 群組描述 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>群組描述</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textInputMultiline,
                errors.description && styles.textInputError
              ]}
              placeholder="描述這個群組的目的或特色..."
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              maxLength={200}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            <Text style={styles.characterCount}>
              {formData.description.length}/200
            </Text>
          </View>

          {/* 隱私設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>隱私設定</Text>
            {renderPrivacyOption(
              'public',
              '公開群組',
              '任何人都可以搜尋並申請加入',
              'public'
            )}
            {renderPrivacyOption(
              'private',
              '私人群組',
              '僅限受邀請的朋友可以加入',
              'lock'
            )}
          </View>

          {/* 最大成員數 */}
          <View style={styles.section}>
            {renderMemberCountSelector()}
          </View>

          {/* 建立提示 */}
          <View style={styles.tipContainer}>
            <Icon name="info" size={20} color="#007AFF" />
            <Text style={styles.tipText}>
              建立後您將自動成為群組管理員，可以邀請朋友、管理成員和編輯群組資訊。
            </Text>
          </View>
        </ScrollView>

        {/* 底部按鈕 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.createButton,
              isLoading && styles.createButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.createButtonText}>
              {isLoading ? '建立中...' : '建立群組'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  privacyOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  privacyOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  privacyOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  privacyOptionTitleSelected: {
    color: '#007AFF',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  memberCountContainer: {
    alignItems: 'center',
  },
  memberCountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countButtonDisabled: {
    backgroundColor: '#f8f8f8',
  },
  countDisplay: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  countNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  countLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberCountHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});