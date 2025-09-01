// User related types matching Backend API

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface UserProfile {
  displayName: string;
  avatar?: string;
  bio?: string;
  defaultLocations?: Location[];
}

export interface DietaryPreferences {
  cuisineTypes?: string[];
  restrictions?: string[];
  priceRange: PriceRange;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface PrivacySettings {
  isDiscoverable: boolean;
  showLocation: boolean;
  allowFriendRequest: boolean;
}

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  profile: UserProfile;
  preferences: DietaryPreferences;
  privacySettings: PrivacySettings;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
}

// Auth types
export interface RegisterRequest {
  email: string;
  phoneNumber?: string;
  password: string;
  displayName: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  displayName: string;
  isVerified: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

export interface UpdateProfileRequest {
  displayName: string;
  avatar?: string;
  bio?: string;
  defaultLocations?: Location[];
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}