import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecommendationResult, Location } from '@/services/api/restaurantApi';

interface SimpleMapViewProps {
  recommendations: RecommendationResult[];
  userLocation?: Location | null;
  centerLocation?: Location;
  selectedRestaurant?: RecommendationResult | null;
  onRestaurantPress: (recommendation: RecommendationResult) => void;
  onUserLocationPress?: () => void;
}

// 計算地圖中心點和縮放級別
const calculateMapCenter = (recommendations: RecommendationResult[], userLocation?: Location | null) => {
  if (recommendations.length === 0 && !userLocation) {
    return { center: [25.0330, 121.5654], zoom: 12 }; // 台北101
  }
  
  const allPoints = [
    ...recommendations.map(rec => [rec.restaurant.location.latitude, rec.restaurant.location.longitude]),
    ...(userLocation ? [[userLocation.latitude, userLocation.longitude]] : [])
  ];
  
  if (allPoints.length === 1) {
    return { center: allPoints[0], zoom: 15 };
  }
  
  // 計算邊界
  const lats = allPoints.map(point => point[0]);
  const lngs = allPoints.map(point => point[1]);
  
  const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
  const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
  
  return { center: [centerLat, centerLng], zoom: 13 };
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

const SimpleMapView: React.FC<SimpleMapViewProps> = ({
  recommendations,
  userLocation,
  centerLocation,
  selectedRestaurant,
  onRestaurantPress,
  onUserLocationPress,
}) => {
  const [currentMapUrl, setCurrentMapUrl] = useState('');
  const { center, zoom } = calculateMapCenter(recommendations, userLocation);

  // 生成 OpenStreetMap 嵌入 URL
  useEffect(() => {
    const baseUrl = 'https://www.openstreetmap.org/export/embed.html';
    const bbox = calculateBoundingBox(recommendations, userLocation);
    
    // 創建標記參數
    const markers = recommendations.map(rec => 
      `${rec.restaurant.location.latitude},${rec.restaurant.location.longitude}`
    ).join(';');
    
    const url = `${baseUrl}?bbox=${bbox}&layer=mapnik&marker=${center[0]},${center[1]}`;
    setCurrentMapUrl(url);
  }, [recommendations, userLocation, center]);

  const calculateBoundingBox = (recommendations: RecommendationResult[], userLocation?: Location | null) => {
    const allPoints = [
      ...recommendations.map(rec => [rec.restaurant.location.latitude, rec.restaurant.location.longitude]),
      ...(userLocation ? [[userLocation.latitude, userLocation.longitude]] : [])
    ];
    
    if (allPoints.length === 0) {
      // 預設台北區域
      return '121.4,25.0,121.7,25.1';
    }
    
    const lats = allPoints.map(point => point[0]);
    const lngs = allPoints.map(point => point[1]);
    
    const minLng = Math.min(...lngs) - 0.005;
    const minLat = Math.min(...lats) - 0.005;
    const maxLng = Math.max(...lngs) + 0.005;
    const maxLat = Math.max(...lats) + 0.005;
    
    return `${minLng},${minLat},${maxLng},${maxLat}`;
  };

  const handleRestaurantClick = (recommendation: RecommendationResult) => {
    onRestaurantPress(recommendation);
    
    // 更新地圖中心到選中的餐廳
    const { latitude, longitude } = recommendation.restaurant.location;
    const newUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    setCurrentMapUrl(newUrl);
  };

  return (
    <View style={styles.container}>
      {/* Map Header */}
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>🗺️ 互動地圖 (OpenStreetMap)</Text>
        <View style={styles.buttonGroup}>
          {userLocation && onUserLocationPress && (
            <TouchableOpacity 
              style={styles.locationButton} 
              onPress={onUserLocationPress}
            >
              <Ionicons name="location" size={14} color="#FF6B35" />
              <Text style={styles.locationButtonText}>重新定位</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.fullMapButton}
            onPress={() => {
              const url = `https://www.openstreetmap.org/#map=${zoom}/${center[0]}/${center[1]}`;
              window.open(url, '_blank');
            }}
          >
            <Ionicons name="open-outline" size={14} color="#4CAF50" />
            <Text style={styles.fullMapButtonText}>完整地圖</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Embedded Map */}
      <div style={{ height: '250px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E5E5' }}>
        {currentMapUrl ? (
          <iframe
            src={currentMapUrl}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              borderRadius: '8px'
            }}
            title="OpenStreetMap"
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#F8F9FA',
            color: '#666'
          }}>
            <Text>載入地圖中...</Text>
          </div>
        )}
      </div>
      
      {/* Restaurant Quick Access */}
      <View style={styles.restaurantQuickAccess}>
        <Text style={styles.quickAccessTitle}>快速定位餐廳:</Text>
        <View style={styles.restaurantButtons}>
          {recommendations.slice(0, 4).map((recommendation) => {
            const isSelected = selectedRestaurant?.restaurant.id === recommendation.restaurant.id;
            const emoji = getCuisineEmoji(recommendation.restaurant.cuisineTypes);
            
            return (
              <TouchableOpacity
                key={recommendation.restaurant.id}
                style={[
                  styles.restaurantQuickButton,
                  isSelected && styles.restaurantQuickButtonSelected
                ]}
                onPress={() => handleRestaurantClick(recommendation)}
              >
                <Text style={styles.restaurantEmoji}>{emoji}</Text>
                <Text style={[
                  styles.restaurantQuickButtonText,
                  isSelected && styles.restaurantQuickButtonTextSelected
                ]} numberOfLines={1}>
                  {recommendation.restaurant.name}
                </Text>
                <Text style={styles.restaurantDistance}>
                  {recommendation.averageDistance.toFixed(1)}km
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {recommendations.length > 4 && (
          <Text style={styles.moreRestaurantsText}>
            還有 {recommendations.length - 4} 家餐廳...
          </Text>
        )}
      </View>
      
      {/* Map legend */}
      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>📍</Text>
          <Text style={styles.legendText}>中心點</Text>
        </View>
        {userLocation && (
          <View style={styles.legendItem}>
            <Text style={styles.legendEmoji}>👤</Text>
            <Text style={styles.legendText}>我的位置</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🍽️</Text>
          <Text style={styles.legendText}>餐廳位置</Text>
        </View>
      </View>
      
      {/* Selected Restaurant Info */}
      {selectedRestaurant && (
        <View style={styles.selectedInfo}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedEmoji}>
              {getCuisineEmoji(selectedRestaurant.restaurant.cuisineTypes)}
            </Text>
            <View style={styles.selectedDetails}>
              <Text style={styles.selectedName}>
                {selectedRestaurant.restaurant.name}
              </Text>
              <Text style={styles.selectedAddress}>
                📍 {selectedRestaurant.restaurant.location.address}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => {
                const { latitude, longitude } = selectedRestaurant.restaurant.location;
                const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                window.open(url, '_blank');
              }}
            >
              <Ionicons name="navigate-outline" size={16} color="#4CAF50" />
              <Text style={styles.directionsButtonText}>導航</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: '500',
  },
  fullMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    gap: 4,
  },
  fullMapButtonText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  restaurantQuickAccess: {
    marginTop: 12,
    marginBottom: 8,
  },
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  restaurantButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  restaurantQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 6,
    minWidth: '45%',
  },
  restaurantQuickButtonSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F3',
  },
  restaurantEmoji: {
    fontSize: 14,
  },
  restaurantQuickButtonText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  restaurantQuickButtonTextSelected: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  restaurantDistance: {
    fontSize: 10,
    color: '#999',
  },
  moreRestaurantsText: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
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
  selectedInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedEmoji: {
    fontSize: 20,
  },
  selectedDetails: {
    flex: 1,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  selectedAddress: {
    fontSize: 11,
    color: '#666',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    gap: 4,
  },
  directionsButtonText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default SimpleMapView;