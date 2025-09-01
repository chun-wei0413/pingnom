import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface LocationError {
  message: string;
  code?: string;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError({ message: '需要位置權限才能使用此功能' });
        return false;
      }
      return true;
    } catch (err) {
      setError({ message: '無法獲取位置權限' });
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000,
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // 嘗試獲取地址資訊
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (addressResponse && addressResponse.length > 0) {
          const address = addressResponse[0];
          locationData.address = [
            address.streetNumber,
            address.street,
            address.district,
            address.city,
          ].filter(Boolean).join(' ');
        }
      } catch (addressError) {
        console.log('無法獲取地址資訊:', addressError);
        // 地址獲取失敗不影響位置功能
      }

      setLocation(locationData);
    } catch (err: any) {
      console.error('獲取位置失敗:', err);
      setError({
        message: '無法獲取當前位置，請檢查GPS是否開啟',
        code: err.code,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setError(null);
  };

  // 計算兩點間距離（公里）
  const calculateDistance = (
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number => {
    const R = 6371; // 地球半徑（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    clearLocation,
    calculateDistance,
  };
};