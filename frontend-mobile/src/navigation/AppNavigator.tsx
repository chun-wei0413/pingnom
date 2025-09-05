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
import GroupDiningScreen from '../screens/GroupDiningScreen';
import CreateGroupDiningPlanScreen from '../screens/CreateGroupDiningPlanScreen';
import GroupDiningPlanDetailScreen from '../screens/GroupDiningPlanDetailScreen';
import VotingScreen from '../screens/VotingScreen';
import VotingResultsScreen from '../screens/VotingResultsScreen';

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

export type GroupDiningStackParamList = {
  GroupDiningHome: undefined;
  CreateGroupDiningPlan: undefined;
  GroupDiningPlanDetail: { planId: string };
  Voting: { planId: string };
  VotingResults: { planId: string };
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const GroupDiningStack = createStackNavigator<GroupDiningStackParamList>();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
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
        component={ProfileScreen}
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