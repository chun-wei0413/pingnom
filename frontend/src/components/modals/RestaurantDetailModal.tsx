import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecommendationResult } from '@/services/api/restaurantApi';

interface RestaurantDetailModalProps {
  visible: boolean;
  recommendation: RecommendationResult | null;
  onClose: () => void;
  onSelect: (recommendation: RecommendationResult) => void;
}

const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({
  visible,
  recommendation,
  onClose,
  onSelect,
}) => {
  if (!recommendation) return null;

  const { restaurant } = recommendation;

  const handleCall = () => {
    if (restaurant.phoneNumber) {
      Linking.openURL(`tel:${restaurant.phoneNumber}`);
    } else {
      Alert.alert('提示', '餐廳未提供電話號碼');
    }
  };

  const handleDirections = () => {
    const { latitude, longitude } = restaurant.location;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const getPriceLevelText = (level: number) => {
    switch (level) {
      case 1: return '$ 經濟實惠';
      case 2: return '$$ 中等價位';
      case 3: return '$$$ 高價位';
      case 4: return '$$$$ 奢華消費';
      default: return '價位未知';
    }
  };

  const getCuisineDisplayText = (cuisines: string[]) => {
    const cuisineMap: Record<string, string> = {
      'chinese': '中式料理',
      'taiwanese': '台式料理', 
      'japanese': '日式料理',
      'korean': '韓式料理',
      'western': '西式料理',
      'italian': '義式料理',
      'hotpot': '火鍋',
      'seafood': '海鮮',
      'vegetarian': '素食',
      'fastfood': '快餐',
    };
    
    return cuisines.map(cuisine => cuisineMap[cuisine] || cuisine).join(' • ');
  };

  const getRestrictionDisplayText = (restrictions: string[]) => {
    const restrictionMap: Record<string, string> = {
      'vegetarian': '素食',
      'vegan': '純素',
      'halal': '清真',
      'kosher': '猶太食品',
      'gluten-free': '無麩質',
      'dairy-free': '無乳製品',
    };
    
    return restrictions.map(restriction => restrictionMap[restriction] || restriction).join(', ');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>餐廳詳情</Text>
          <TouchableOpacity 
            style={styles.selectButton} 
            onPress={() => {
              onSelect(recommendation);
              onClose();
            }}
          >
            <Text style={styles.selectButtonText}>選擇</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Restaurant Name & Rating */}
          <View style={styles.titleSection}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.ratingDisplay}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {restaurant.rating.toFixed(1)}
                </Text>
                <Text style={styles.reviewsText}>
                  ({restaurant.totalReviews} 則評論)
                </Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  推薦分數: {Math.round(recommendation.score)}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>餐廳介紹</Text>
            <Text style={styles.description}>{restaurant.description}</Text>
          </View>

          {/* Location & Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>位置資訊</Text>
            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.locationText}>{restaurant.location.address}</Text>
            </View>
            <View style={styles.distanceInfo}>
              <Text style={styles.distanceLabel}>平均距離:</Text>
              <Text style={styles.distanceValue}>
                {recommendation.averageDistance.toFixed(1)} km
              </Text>
              <Text style={styles.distanceLabel}>最遠距離:</Text>
              <Text style={styles.distanceValue}>
                {recommendation.maxDistance.toFixed(1)} km
              </Text>
            </View>
          </View>

          {/* Cuisine & Price */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>料理與價位</Text>
            <View style={styles.infoRow}>
              <Ionicons name="restaurant-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                {getCuisineDisplayText(restaurant.cuisineTypes)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                {getPriceLevelText(restaurant.priceLevel)}
              </Text>
            </View>
          </View>

          {/* Dietary Restrictions */}
          {restaurant.supportedRestrictions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>飲食限制</Text>
              <View style={styles.infoRow}>
                <Ionicons name="leaf-outline" size={16} color="#4CAF50" />
                <Text style={styles.infoText}>
                  {getRestrictionDisplayText(restaurant.supportedRestrictions)}
                </Text>
              </View>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>其他資訊</Text>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                平均等候時間: {restaurant.averageWaitTime} 分鐘
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons 
                name={restaurant.acceptsReservations ? "checkmark-circle-outline" : "close-circle-outline"} 
                size={16} 
                color={restaurant.acceptsReservations ? "#4CAF50" : "#FF5252"} 
              />
              <Text style={styles.infoText}>
                {restaurant.acceptsReservations ? '接受預約' : '不接受預約'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call-outline" size={18} color="#4CAF50" />
              <Text style={styles.actionButtonText}>撥打電話</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
              <Ionicons name="navigate-outline" size={18} color="#2196F3" />
              <Text style={styles.actionButtonText}>查看路線</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewsText: {
    fontSize: 14,
    color: '#666',
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default RestaurantDetailModal;