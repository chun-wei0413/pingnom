import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { api } from '../services/api';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  cuisineTypes: string[];
  priceLevel: number;
  rating: number;
  totalReviews: number;
  phoneNumber?: string;
  averageWaitTime?: number;
  acceptsReservations: boolean;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function RestaurantSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState(2); // 默認 2km
  const [selectedCuisine, setSelectedCuisine] = useState('');

  const cuisineTypes = [
    { label: '全部', value: '' },
    { label: '中式料理', value: 'chinese' },
    { label: '日式料理', value: 'japanese' },
    { label: '韓式料理', value: 'korean' },
    { label: '義式料理', value: 'italian' },
    { label: '美式料理', value: 'american' },
    { label: '泰式料理', value: 'thai' },
  ];

  const radiusOptions = [1, 2, 5, 10];

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      searchNearbyRestaurants();
    }
  }, [userLocation, selectedRadius, selectedCuisine]);

  const getUserLocation = async () => {
    try {
      setLocationLoading(true);
      
      // 請求位置權限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('權限需求', '需要位置權限來搜尋附近餐廳');
        setLocationLoading(false);
        return;
      }

      // 獲取當前位置
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('獲取位置失敗:', error);
      Alert.alert('錯誤', '無法獲取您的位置資訊');
    } finally {
      setLocationLoading(false);
    }
  };

  const searchNearbyRestaurants = async () => {
    if (!userLocation) return;

    try {
      setLoading(true);
      console.log('搜尋附近餐廳:', {
        lat: userLocation.latitude,
        lon: userLocation.longitude,
        radius: selectedRadius,
        cuisine: selectedCuisine,
      });

      const response = await api.searchRestaurants({
        lat: userLocation.latitude,
        lon: userLocation.longitude,
        radius: selectedRadius,
        limit: 20,
        cuisineTypes: selectedCuisine,
        sortBy: 'distance',
        sortOrder: 'asc',
      });

      console.log('餐廳搜尋結果:', response);
      
      if (response.restaurants) {
        setRestaurants(response.restaurants);
      } else {
        setRestaurants([]);
      }
    } catch (error) {
      console.error('搜尋餐廳失敗:', error);
      Alert.alert('錯誤', '搜尋餐廳失敗，請稍後再試');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (userLocation) {
      searchNearbyRestaurants();
    }
  };

  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity style={styles.restaurantCard} onPress={() => handleSelectRestaurant(item)}>
      <View style={styles.restaurantHeader}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {item.rating || 'N/A'}</Text>
        </View>
      </View>
      
      <Text style={styles.restaurantAddress}>{item.location.address}</Text>
      
      <View style={styles.restaurantDetails}>
        <Text style={styles.cuisineType}>
          {item.cuisineTypes && item.cuisineTypes.length > 0 
            ? item.cuisineTypes[0] 
            : '料理類型未知'
          }
        </Text>
        <Text style={styles.reviews}>
          {item.totalReviews ? `${item.totalReviews} 則評論` : ''}
        </Text>
      </View>
      
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      )}
      
      <View style={styles.bottomInfo}>
        <Text style={styles.priceRange}>
          {'$'.repeat(item.priceLevel || 1)} ({item.priceLevel || 1}/4)
        </Text>
        {item.averageWaitTime && (
          <Text style={styles.waitTime}>
            平均等待: {item.averageWaitTime} 分鐘
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    const cuisineType = restaurant.cuisineTypes && restaurant.cuisineTypes.length > 0 
      ? restaurant.cuisineTypes.join(', ') 
      : '料理類型未知';
      
    Alert.alert(
      restaurant.name,
      `地址: ${restaurant.location.address}\n料理類型: ${cuisineType}\n評分: ${restaurant.rating || 'N/A'}\n評論數: ${restaurant.totalReviews || 0}`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '在地圖中查看', 
          onPress: () => openInMaps(restaurant) 
        },
        { 
          text: '選擇此餐廳', 
          onPress: () => console.log('已選擇餐廳:', restaurant.name) 
        },
      ]
    );
  };

  const openInMaps = (restaurant: Restaurant) => {
    const { latitude, longitude } = restaurant.location;
    const label = encodeURIComponent(restaurant.name);
    
    if (Platform.OS === 'ios') {
      const url = `maps:0,0?q=${label}@${latitude},${longitude}`;
      Linking.openURL(url);
    } else {
      const url = `geo:0,0?q=${latitude},${longitude}(${label})`;
      Linking.openURL(url);
    }
  };

  if (locationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>正在獲取您的位置...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>餐廳搜尋</Text>
        {userLocation && (
          <TouchableOpacity style={styles.refreshButton} onPress={getUserLocation}>
            <Text style={styles.refreshButtonText}>📍 重新定位</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 搜尋篩選器 */}
      <View style={styles.filterContainer}>
        {/* 搜尋半徑選擇 */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>搜尋半徑</Text>
          <View style={styles.radiusButtons}>
            {radiusOptions.map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusButton,
                  selectedRadius === radius && styles.radiusButtonActive,
                ]}
                onPress={() => setSelectedRadius(radius)}
              >
                <Text
                  style={[
                    styles.radiusButtonText,
                    selectedRadius === radius && styles.radiusButtonTextActive,
                  ]}
                >
                  {radius}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 料理類型選擇 */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>料理類型</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cuisineButtons}>
              {cuisineTypes.map((cuisine) => (
                <TouchableOpacity
                  key={cuisine.value}
                  style={[
                    styles.cuisineButton,
                    selectedCuisine === cuisine.value && styles.cuisineButtonActive,
                  ]}
                  onPress={() => setSelectedCuisine(cuisine.value)}
                >
                  <Text
                    style={[
                      styles.cuisineButtonText,
                      selectedCuisine === cuisine.value && styles.cuisineButtonTextActive,
                    ]}
                  >
                    {cuisine.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* 餐廳列表 */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>搜尋餐廳中...</Text>
          </View>
        ) : restaurants.length > 0 ? (
          <FlatList
            data={restaurants}
            renderItem={renderRestaurantItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>找不到附近的餐廳</Text>
            <Text style={styles.emptySubtitle}>請嘗試擴大搜尋範圍或更換料理類型\n點擊餐廳可在地圖中查看位置</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
              <Text style={styles.retryButtonText}>重新搜尋</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  radiusButtonActive: {
    backgroundColor: '#3b82f6',
  },
  radiusButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  radiusButtonTextActive: {
    color: '#fff',
  },
  cuisineButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cuisineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  cuisineButtonActive: {
    backgroundColor: '#3b82f6',
  },
  cuisineButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  cuisineButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  ratingContainer: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    color: '#92400e',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  restaurantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cuisineType: {
    fontSize: 14,
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviews: {
    fontSize: 14,
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRange: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  waitTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});