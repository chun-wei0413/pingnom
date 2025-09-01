import React from 'react';
import { Platform } from 'react-native';
import RestaurantMapView from './RestaurantMapView';
import { RecommendationResult, Location } from '@/services/api/restaurantApi';

interface PlatformMapViewProps {
  recommendations: RecommendationResult[];
  userLocation?: Location | null;
  centerLocation?: Location;
  selectedRestaurant?: RecommendationResult | null;
  onRestaurantPress: (recommendation: RecommendationResult) => void;
  onUserLocationPress?: () => void;
}

const PlatformMapView: React.FC<PlatformMapViewProps> = (props) => {
  // 在 web 平台上使用簡單地圖（避免 React-Leaflet 兼容性問題）
  if (Platform.OS === 'web') {
    // 動態引入簡單地圖組件
    const SimpleMapView = React.lazy(() => import('./SimpleMapView.web'));
    
    return (
      <React.Suspense fallback={<RestaurantMapView {...props} />}>
        <SimpleMapView {...props} />
      </React.Suspense>
    );
  }
  
  // 在 mobile 平台上使用原來的簡化地圖
  return <RestaurantMapView {...props} />;
};

export default PlatformMapView;