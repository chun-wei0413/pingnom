import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';

type PreferencesNavigationProp = StackNavigationProp<ProfileStackParamList>;

// 料理類型選項
const cuisineOptions = [
  { value: 'chinese', label: '中式料理', icon: '🥢' },
  { value: 'japanese', label: '日式料理', icon: '🍣' },
  { value: 'western', label: '西式料理', icon: '🍽️' },
  { value: 'korean', label: '韓式料理', icon: '🥘' },
  { value: 'thai', label: '泰式料理', icon: '🌶️' },
  { value: 'vietnamese', label: '越式料理', icon: '🍜' },
  { value: 'italian', label: '義式料理', icon: '🍕' },
  { value: 'mexican', label: '墨西哥料理', icon: '🌮' },
  { value: 'indian', label: '印度料理', icon: '🍛' },
  { value: 'dessert', label: '甜點', icon: '🍰' },
];

// 飲食限制選項
const restrictionOptions = [
  { value: 'vegetarian', label: '素食', icon: '🥬' },
  { value: 'vegan', label: '純素', icon: '🌱' },
  { value: 'gluten-free', label: '無麩質', icon: '🚫' },
  { value: 'dairy-free', label: '無乳製品', icon: '🥛' },
  { value: 'nut-free', label: '無堅果', icon: '🥜' },
  { value: 'halal', label: '清真', icon: '☪️' },
  { value: 'kosher', label: '猶太潔食', icon: '✡️' },
  { value: 'low-sodium', label: '低鈉', icon: '🧂' },
];

export default function PreferencesScreen() {
  const navigation = useNavigation<PreferencesNavigationProp>();
  
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    loadCurrentPreferences();
  }, []);

  const loadCurrentPreferences = async () => {
    try {
      setLoadingPrefs(true);
      const response = await api.getUserProfile();
      
      if (response.success && response.data?.dietary_preferences) {
        const prefs = response.data.dietary_preferences;
        setCuisineTypes(prefs.cuisine_types || []);
        setRestrictions(prefs.restrictions || []);
        setMinPrice(prefs.min_price?.toString() || '0');
        setMaxPrice(prefs.max_price?.toString() || '1000');
      }
    } catch (error) {
      console.error('載入偏好設定失敗:', error);
    } finally {
      setLoadingPrefs(false);
    }
  };

  const toggleCuisineType = (type: string) => {
    setCuisineTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleRestriction = (restriction: string) => {
    setRestrictions(prev => 
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const validatePriceInput = () => {
    const min = parseInt(minPrice) || 0;
    const max = parseInt(maxPrice) || 0;
    
    if (min < 0 || max < 0) {
      Alert.alert('錯誤', '價格不能小於0');
      return false;
    }
    
    if (min > max) {
      Alert.alert('錯誤', '最低價格不能高於最高價格');
      return false;
    }
    
    if (cuisineTypes.length > 20) {
      Alert.alert('錯誤', '料理類型最多只能選擇20種');
      return false;
    }
    
    if (restrictions.length > 10) {
      Alert.alert('錯誤', '飲食限制最多只能選擇10種');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validatePriceInput()) {
      return;
    }

    try {
      setLoading(true);
      
      const preferencesData = {
        cuisineTypes,
        restrictions,
        minPrice: parseInt(minPrice) || 0,
        maxPrice: parseInt(maxPrice) || 1000,
      };

      console.log('Updating preferences:', preferencesData);
      
      const response = await api.updatePreferences(preferencesData);
      console.log('Update preferences response:', response);

      if (response.success) {
        Alert.alert(
          '成功',
          '偏好設定已更新',
          [
            {
              text: '確定',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('錯誤', response.message || '更新失敗');
      }
    } catch (error) {
      console.error('更新偏好設定失敗:', error);
      Alert.alert('錯誤', '更新失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const renderSelectionGrid = (
    options: typeof cuisineOptions,
    selectedValues: string[],
    onToggle: (value: string) => void,
    maxSelection?: number
  ) => (
    <View style={styles.selectionGrid}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        const canSelect = !maxSelection || selectedValues.length < maxSelection;
        const isDisabled = !isSelected && !canSelect;
        
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectionButton,
              isSelected && styles.selectionButtonActive,
              isDisabled && styles.selectionButtonDisabled,
            ]}
            onPress={() => !isDisabled && onToggle(option.value)}
            disabled={isDisabled}
          >
            <Text style={styles.selectionIcon}>{option.icon}</Text>
            <Text
              style={[
                styles.selectionText,
                isSelected && styles.selectionTextActive,
                isDisabled && styles.selectionTextDisabled,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loadingPrefs) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>載入偏好設定中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>偏好設定</Text>
          <Text style={styles.headerSubtitle}>設定您的飲食偏好，幫助我們為您推薦更合適的餐廳</Text>
        </View>

        {/* 料理類型 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            料理類型 ({cuisineTypes.length}/20)
          </Text>
          <Text style={styles.sectionDescription}>選擇您喜歡的料理類型</Text>
          {renderSelectionGrid(cuisineOptions, cuisineTypes, toggleCuisineType, 20)}
        </View>

        {/* 飲食限制 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            飲食限制 ({restrictions.length}/10)
          </Text>
          <Text style={styles.sectionDescription}>選擇您的飲食限制</Text>
          {renderSelectionGrid(restrictionOptions, restrictions, toggleRestriction, 10)}
        </View>

        {/* 價格範圍 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>價格範圍 (元)</Text>
          <Text style={styles.sectionDescription}>設定每餐預算範圍</Text>
          <View style={styles.priceContainer}>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceLabel}>最低價格</Text>
              <TextInput
                style={styles.priceInput}
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <Text style={styles.priceSeparator}>-</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceLabel}>最高價格</Text>
              <TextInput
                style={styles.priceInput}
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholder="1000"
              />
            </View>
          </View>
        </View>

        {/* 儲存按鈕 */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '儲存中...' : '儲存偏好設定'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '30%',
    flex: 1,
    maxWidth: '31%',
  },
  selectionButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  selectionButtonDisabled: {
    opacity: 0.5,
  },
  selectionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  selectionText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  selectionTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  selectionTextDisabled: {
    color: '#9ca3af',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  priceInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  priceSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});