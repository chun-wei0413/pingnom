// Navigation types for React Navigation

export type RootStackParamList = {
  AuthNavigator: undefined;
  MainNavigator: undefined;
  Loading: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  HomeTabs: undefined;
  UserProfile: { userId?: string };
  EditProfile: undefined;
  Settings: undefined;
  CreatePing: undefined;
  PingDetail: { pingId: string };
  RestaurantDetail: { restaurantId: string };
  SearchUsers: undefined;
  AddFriend: undefined;
};

export type HomeTabsParamList = {
  Home: undefined;
  Pings: undefined;
  Friends: undefined;
  Profile: undefined;
};

// Screen component props types
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  StackScreenProps<AuthStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = CompositeScreenProps<
  StackScreenProps<MainStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type HomeTabsScreenProps<T extends keyof HomeTabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<HomeTabsParamList, T>,
  MainStackScreenProps<keyof MainStackParamList>
>;