import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import GroupDiningScreen from '../screens/GroupDiningScreen';
import CreateGroupDiningPlanScreen from '../screens/CreateGroupDiningPlanScreen';
import GroupDiningPlanDetailScreen from '../screens/GroupDiningPlanDetailScreen';
import VotingScreen from '../screens/VotingScreen';
import VotingResultsScreen from '../screens/VotingResultsScreen';
import RestaurantSearchScreen from '../screens/RestaurantSearchScreen';
import CreatePingScreen from '../screens/CreatePingScreen';

// Navigation type definitions
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  GroupDining: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Preferences: undefined;
  Privacy: undefined;
  ChangePassword: undefined;
};

export type GroupDiningStackParamList = {
  GroupDiningHome: undefined;
  CreateGroupDiningPlan: undefined;
  GroupDiningPlanDetail: { planId: string };
  Voting: { planId: string };
  VotingResults: { planId: string };
  RestaurantSearch: undefined;
  CreatePing: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const GroupDiningStack = createStackNavigator<GroupDiningStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ProfileStack.Screen 
        name="ProfileHome" 
        component={ProfileScreen}
        options={{
          title: '個人資料',
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          title: '編輯個人資料',
        }}
      />
      <ProfileStack.Screen 
        name="Preferences" 
        component={PreferencesScreen}
        options={{
          title: '偏好設定',
        }}
      />
      <ProfileStack.Screen 
        name="Privacy" 
        component={PrivacyScreen}
        options={{
          title: '隱私設定',
        }}
      />
      <ProfileStack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{
          title: '變更密碼',
        }}
      />
    </ProfileStack.Navigator>
  );
}

// Group Dining Stack Navigator
function GroupDiningNavigator() {
  return (
    <GroupDiningStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <GroupDiningStack.Screen 
        name="GroupDiningHome" 
        component={GroupDiningScreen}
        options={{
          title: '聚餐計畫',
          headerShown: false,
        }}
      />
      <GroupDiningStack.Screen 
        name="CreateGroupDiningPlan" 
        component={CreateGroupDiningPlanScreen}
        options={{
          title: '建立聚餐計畫',
        }}
      />
      <GroupDiningStack.Screen 
        name="GroupDiningPlanDetail" 
        component={GroupDiningPlanDetailScreen}
        options={{
          title: '聚餐計畫詳情',
        }}
      />
      <GroupDiningStack.Screen 
        name="Voting" 
        component={VotingScreen}
        options={{
          title: '投票選擇',
        }}
      />
      <GroupDiningStack.Screen 
        name="VotingResults" 
        component={VotingResultsScreen}
        options={{
          title: '投票結果',
        }}
      />
      <GroupDiningStack.Screen 
        name="RestaurantSearch" 
        component={RestaurantSearchScreen}
        options={{
          title: '餐廳搜尋',
        }}
      />
      <GroupDiningStack.Screen 
        name="CreatePing" 
        component={CreatePingScreen}
        options={{
          title: '發起聚餐',
        }}
      />
    </GroupDiningStack.Navigator>
  );
}

// Main Tab Navigator
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <MainTab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: '首頁',
          headerShown: false,
        }}
      />
      <MainTab.Screen 
        name="GroupDining" 
        component={GroupDiningNavigator}
        options={{
          title: '聚餐',
          headerShown: false,
        }}
      />
      <MainTab.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{
          title: '朋友',
          headerShown: false,
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{
          title: '個人',
          headerShown: false,
        }}
      />
    </MainTab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}