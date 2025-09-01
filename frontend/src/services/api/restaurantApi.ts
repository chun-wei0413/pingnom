import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: Location;
  cuisineTypes: string[];
  priceLevel: number;
  rating: number;
  totalReviews: number;
  phoneNumber: string;
  openingHours: Record<string, any>;
  supportedRestrictions: string[];
  averageWaitTime: number;
  acceptsReservations: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationResult {
  restaurant: Restaurant;
  score: number;
  distanceFromCenter: number;
  averageDistance: number;
  maxDistance: number;
}

export interface RestaurantRecommendationRequest {
  participantLocations: Location[];
  cuisinePreferences?: string[];
  priceRange?: {
    minPrice: number;
    maxPrice: number;
  };
  dietaryRestrictions?: string[];
  maxDistance?: number;
  maxResults?: number;
}

export interface RestaurantSearchParams {
  lat?: number;
  lon?: number;
  radius?: number;
  limit?: number;
  offset?: number;
  minRating?: number;
  cuisineTypes?: string;
  sortBy?: string;
  sortOrder?: string;
}

class RestaurantApi {
  private basePath = '/restaurants';

  async searchRestaurants(params: RestaurantSearchParams): Promise<ApiResponse<{ restaurants: Restaurant[] }>> {
    const queryParams = new URLSearchParams();
    
    if (params.lat !== undefined) queryParams.append('lat', params.lat.toString());
    if (params.lon !== undefined) queryParams.append('lon', params.lon.toString());
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.minRating) queryParams.append('minRating', params.minRating.toString());
    if (params.cuisineTypes) queryParams.append('cuisineTypes', params.cuisineTypes);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `${this.basePath}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ restaurants: Restaurant[] }>(url);
  }

  async getRecommendations(request: RestaurantRecommendationRequest): Promise<ApiResponse<{ recommendations: RecommendationResult[] }>> {
    return apiClient.post<{ recommendations: RecommendationResult[] }>(`${this.basePath}/recommendations`, request);
  }

  async getRestaurantById(id: string): Promise<ApiResponse<Restaurant>> {
    return apiClient.get<Restaurant>(`${this.basePath}/${id}`);
  }
}

export const restaurantApi = new RestaurantApi();
export default restaurantApi;