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
import { restaurantApi, RecommendationResult, Location } from '@/services/api/restaurantApi';
import { useLocation } from '@/hooks/useLocation';
import PlatformMapView from '@/components/maps/PlatformMapView';
import RestaurantDetailModal from '@/components/modals/RestaurantDetailModal';

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
  
  // Restaurant recommendations state
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RecommendationResult | null>(null);
  const [participantLocations, setParticipantLocations] = useState<Location[]>([]);
  const [centerLocation, setCenterLocation] = useState<Location | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailModalRestaurant, setDetailModalRestaurant] = useState<RecommendationResult | null>(null);
  
  // Location hook
  const { 
    location: userLocation, 
    loading: locationLoading, 
    error: locationError,
    getCurrentLocation 
  } = useLocation();

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

  // Get restaurant recommendations based on current location
  const getRestaurantRecommendations = async (useCurrentLocation: boolean = false) => {
    setLoadingRecommendations(true);
    try {
      let locations: Location[] = [];
      
      if (useCurrentLocation && userLocation) {
        // 使用用戶當前位置
        locations = [userLocation];
      } else {
        // 使用預設示例位置 (台北101 and 台北車站)
        locations = [
          {
            latitude: 25.0330,
            longitude: 121.5654,
            address: '台北101'
          },
          {
            latitude: 25.0478,
            longitude: 121.5318,
            address: '台北車站'
          }
        ];
      }
      
      setParticipantLocations(locations);
      
      // 計算中心點
      const centerLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
      const centerLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;
      const center: Location = {
        latitude: centerLat,
        longitude: centerLng,
        address: '會面中心點'
      };
      setCenterLocation(center);
      
      const response = await restaurantApi.getRecommendations({
        participantLocations: locations,
        maxDistance: 5.0,
        maxResults: 8
      });
      
      // 後端直接回傳 {recommendations: [...]}，而不是包裝在 data 中
      const recommendations = (response as any).recommendations || response.data?.recommendations || [];
      setRecommendations(recommendations);
      setShowMap(true);
    } catch (error) {
      console.error('獲取餐廳推薦失敗:', error);
      Alert.alert('錯誤', '無法獲取餐廳推薦，請稍後再試');
    } finally {
      setLoadingRecommendations(false);
    }
  };
  
  // 獲取用戶位置並推薦餐廳
  const getRecommendationsWithLocation = async () => {
    if (locationLoading) return;
    
    if (!userLocation) {
      await getCurrentLocation();
    }
    
    // 等一下讓 location 狀態更新
    setTimeout(() => {
      getRestaurantRecommendations(true);
    }, 100);
  };

  const selectRestaurant = (recommendation: RecommendationResult) => {
    setSelectedRestaurant(recommendation);
    // Auto-fill title with restaurant name if title is empty
    if (!formData.title.trim()) {
      setFormData(prev => ({ 
        ...prev, 
        title: `${recommendation.restaurant.name} 聚餐` 
      }));
    }
  };
  
  // 顯示餐廳詳情
  const showRestaurantDetail = (recommendation: RecommendationResult) => {
    setDetailModalRestaurant(recommendation);
    setDetailModalVisible(true);
  };
  
  // 從詳情模態選擇餐廳
  const selectRestaurantFromModal = (recommendation: RecommendationResult) => {
    selectRestaurant(recommendation);
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
    const demoAliceUserId = '0515b690-772b-45ca-846d-6d3a6c244bf2'; // Alice's current ID in InMemory DB

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

        {/* Restaurant Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>餐廳推薦</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.recommendButton, styles.secondaryButton]}
                onPress={() => getRestaurantRecommendations(false)}
                disabled={loadingRecommendations}
              >
                <Ionicons name="restaurant-outline" size={14} color="#666" />
                <Text style={styles.secondaryButtonText}>
                  {loadingRecommendations ? '推薦中...' : '示例推薦'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.recommendButton}
                onPress={getRecommendationsWithLocation}
                disabled={loadingRecommendations || locationLoading}
              >
                <Ionicons name="location-outline" size={14} color="white" />
                <Text style={styles.recommendButtonText}>
                  {locationLoading ? '定位中...' : loadingRecommendations ? '推薦中...' : '我的位置'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {locationError && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{locationError.message}</Text>
            </View>
          )}
          
          {recommendations.length > 0 && (
            <View style={styles.recommendationsContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationsScroll}
              >
                {recommendations.map((recommendation, index) => (
                  <TouchableOpacity
                    key={recommendation.restaurant.id}
                    style={[
                      styles.restaurantCard,
                      selectedRestaurant?.restaurant.id === recommendation.restaurant.id && 
                      styles.restaurantCardSelected
                    ]}
                    onPress={() => selectRestaurant(recommendation)}
                  >
                    <View style={styles.restaurantHeader}>
                      <Text style={styles.restaurantName} numberOfLines={1}>
                        {recommendation.restaurant.name}
                      </Text>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.ratingText}>
                          {recommendation.restaurant.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.restaurantCuisine} numberOfLines={1}>
                      {recommendation.restaurant.cuisineTypes.join(' • ')}
                    </Text>
                    
                    <Text style={styles.restaurantDistance}>
                      平均距離 {recommendation.averageDistance.toFixed(1)}km
                    </Text>
                    
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreText}>
                        推薦分數: {Math.round(recommendation.score)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.detailButton}
                      onPress={() => showRestaurantDetail(recommendation)}
                    >
                      <Ionicons name="information-circle-outline" size={12} color="#666" />
                      <Text style={styles.detailButtonText}>詳情</Text>
                    </TouchableOpacity>
                    
                    {selectedRestaurant?.restaurant.id === recommendation.restaurant.id && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={16} color="#FF6B35" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Map View */}
          {showMap && recommendations.length > 0 && (
            <PlatformMapView
              recommendations={recommendations}
              userLocation={userLocation}
              centerLocation={centerLocation}
              selectedRestaurant={selectedRestaurant}
              onRestaurantPress={selectRestaurant}
              onUserLocationPress={() => getCurrentLocation()}
            />
          )}
          
          {selectedRestaurant && (
            <View style={styles.selectedRestaurantInfo}>
              <Text style={styles.selectedRestaurantTitle}>
                已選擇: {selectedRestaurant.restaurant.name}
              </Text>
              <Text style={styles.selectedRestaurantAddress}>
                📍 {selectedRestaurant.restaurant.location.address}
              </Text>
              <Text style={styles.selectedRestaurantDescription}>
                {selectedRestaurant.restaurant.description}
              </Text>
            </View>
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
      
      {/* Restaurant Detail Modal */}
      <RestaurantDetailModal
        visible={detailModalVisible}
        recommendation={detailModalRestaurant}
        onClose={() => setDetailModalVisible(false)}
        onSelect={selectRestaurantFromModal}
      />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    gap: 4,
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  recommendButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationsScroll: {
    paddingHorizontal: 4,
    gap: 12,
  },
  restaurantCard: {
    width: 200,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginHorizontal: 4,
    position: 'relative',
  },
  restaurantCardSelected: {
    backgroundColor: '#FFF5F3',
    borderColor: '#FF6B35',
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  restaurantCuisine: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  restaurantDistance: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  scoreContainer: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  scoreText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#E8F4FD',
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 2,
  },
  detailButtonText: {
    fontSize: 10,
    color: '#0369A1',
    fontWeight: '500',
  },
  selectedRestaurantInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  selectedRestaurantTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  selectedRestaurantAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectedRestaurantDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default CreatePingScreen;