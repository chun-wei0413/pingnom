import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecommendationResult, Location } from '@/services/api/restaurantApi';

// 由於 react-native-maps 在 web 上支援有限，我們先實作一個簡化版本
// 未來可以根據平台選擇不同的地圖實作

interface RestaurantMapViewProps {
  recommendations: RecommendationResult[];
  userLocation?: Location | null;
  centerLocation?: Location;
  selectedRestaurant?: RecommendationResult | null;
  onRestaurantPress: (recommendation: RecommendationResult) => void;
  onUserLocationPress?: () => void;
}

const RestaurantMapView: React.FC<RestaurantMapViewProps> = ({
  recommendations,
  userLocation,
  centerLocation,
  selectedRestaurant,
  onRestaurantPress,
  onUserLocationPress,
}) => {
  const screenWidth = Dimensions.get('window').width;
  
  // 計算地圖邊界
  const calculateMapBounds = () => {
    if (recommendations.length === 0) return null;
    
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    
    recommendations.forEach(rec => {
      minLat = Math.min(minLat, rec.restaurant.location.latitude);
      maxLat = Math.max(maxLat, rec.restaurant.location.latitude);
      minLng = Math.min(minLng, rec.restaurant.location.longitude);
      maxLng = Math.max(maxLng, rec.restaurant.location.longitude);
    });
    
    if (userLocation) {
      minLat = Math.min(minLat, userLocation.latitude);
      maxLat = Math.max(maxLat, userLocation.latitude);
      minLng = Math.min(minLng, userLocation.longitude);
      maxLng = Math.max(maxLng, userLocation.longitude);
    }
    
    return { minLat, maxLat, minLng, maxLng };
  };
  
  // 將經緯度轉換為畫面座標（簡化版）
  const coordsToPosition = (lat: number, lng: number) => {
    const bounds = calculateMapBounds();
    if (!bounds) return { x: 0, y: 0 };
    
    const mapWidth = screenWidth - 40;
    const mapHeight = 200;
    
    const latRange = bounds.maxLat - bounds.minLat || 0.01;
    const lngRange = bounds.maxLng - bounds.minLng || 0.01;
    
    const x = ((lng - bounds.minLng) / lngRange) * mapWidth;
    const y = mapHeight - ((lat - bounds.minLat) / latRange) * mapHeight;
    
    return { x: Math.max(0, Math.min(mapWidth, x)), y: Math.max(0, Math.min(mapHeight, y)) };
  };
  
  const getCuisineEmoji = (cuisineTypes: string[]) => {
    if (cuisineTypes.includes('chinese')) return '🥟';
    if (cuisineTypes.includes('japanese')) return '🍱';
    if (cuisineTypes.includes('hotpot')) return '🍲';
    if (cuisineTypes.includes('taiwanese')) return '🍜';
    if (cuisineTypes.includes('korean')) return '🍗';
    if (cuisineTypes.includes('western')) return '🍝';
    if (cuisineTypes.includes('seafood')) return '🦐';
    if (cuisineTypes.includes('vegetarian')) return '🥗';
    return '🍽️';
  };

  return (
    <View style={styles.container}>
      {/* Map Header */}
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>餐廳位置分布</Text>
        {userLocation && onUserLocationPress && (
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={onUserLocationPress}
          >
            <Ionicons name="location" size={16} color="#FF6B35" />
            <Text style={styles.locationButtonText}>我的位置</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Simplified Map View */}
      <View style={styles.mapContainer}>
        <View style={styles.mapCanvas}>
          {/* Background grid */}
          <View style={styles.mapGrid} />
          
          {/* Center point marker */}
          {centerLocation && (
            <View 
              style={[
                styles.centerMarker,
                {
                  left: coordsToPosition(centerLocation.latitude, centerLocation.longitude).x - 8,
                  top: coordsToPosition(centerLocation.latitude, centerLocation.longitude).y - 8,
                }
              ]}
            >
              <Ionicons name="location-sharp" size={16} color="#4A90E2" />
            </View>
          )}
          
          {/* User location marker */}
          {userLocation && (
            <View 
              style={[
                styles.userMarker,
                {
                  left: coordsToPosition(userLocation.latitude, userLocation.longitude).x - 8,
                  top: coordsToPosition(userLocation.latitude, userLocation.longitude).y - 8,
                }
              ]}
            >
              <Ionicons name="person" size={12} color="white" />
            </View>
          )}
          
          {/* Restaurant markers */}
          {recommendations.map((recommendation, index) => {
            const position = coordsToPosition(
              recommendation.restaurant.location.latitude,
              recommendation.restaurant.location.longitude
            );
            const isSelected = selectedRestaurant?.restaurant.id === recommendation.restaurant.id;
            
            return (
              <TouchableOpacity
                key={recommendation.restaurant.id}
                style={[
                  styles.restaurantMarker,
                  isSelected && styles.selectedMarker,
                  {
                    left: position.x - 12,
                    top: position.y - 12,
                  }
                ]}
                onPress={() => onRestaurantPress(recommendation)}
              >
                <Text style={styles.markerEmoji}>
                  {getCuisineEmoji(recommendation.restaurant.cuisineTypes)}
                </Text>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={12} color="#FF6B35" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Map legend */}
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <Ionicons name="location-sharp" size={14} color="#4A90E2" />
            <Text style={styles.legendText}>中心點</Text>
          </View>
          {userLocation && (
            <View style={styles.legendItem}>
              <View style={styles.userLegendMarker} />
              <Text style={styles.legendText}>我的位置</Text>
            </View>
          )}
          <View style={styles.legendItem}>
            <Text style={styles.legendEmoji}>🍽️</Text>
            <Text style={styles.legendText}>餐廳</Text>
          </View>
        </View>
      </View>
      
      {/* Restaurant list below map */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.restaurantList}
        contentContainerStyle={styles.restaurantListContent}
      >
        {recommendations.map((recommendation, index) => {
          const isSelected = selectedRestaurant?.restaurant.id === recommendation.restaurant.id;
          return (
            <TouchableOpacity
              key={recommendation.restaurant.id}
              style={[styles.restaurantCard, isSelected && styles.selectedCard]}
              onPress={() => onRestaurantPress(recommendation)}
            >
              <Text style={styles.restaurantEmoji}>
                {getCuisineEmoji(recommendation.restaurant.cuisineTypes)}
              </Text>
              <Text style={styles.restaurantName} numberOfLines={1}>
                {recommendation.restaurant.name}
              </Text>
              <Text style={styles.restaurantDistance}>
                {recommendation.averageDistance.toFixed(1)}km
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {recommendation.restaurant.rating.toFixed(1)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF5F3',
    borderRadius: 12,
    gap: 4,
  },
  locationButtonText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
  mapContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  mapCanvas: {
    height: 200,
    position: 'relative',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F0F8FF',
    opacity: 0.3,
  },
  centerMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  userMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  restaurantMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  selectedMarker: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F3',
  },
  markerEmoji: {
    fontSize: 12,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 6,
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  legendEmoji: {
    fontSize: 12,
  },
  userLegendMarker: {
    width: 12,
    height: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'white',
  },
  restaurantList: {
    maxHeight: 120,
  },
  restaurantListContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  restaurantCard: {
    width: 100,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F3',
  },
  restaurantEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  restaurantDistance: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
});

export default RestaurantMapView;