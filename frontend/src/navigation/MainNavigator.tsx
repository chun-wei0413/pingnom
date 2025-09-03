import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeTabsParamList } from '@/types/navigation';
import HomeScreen from '@/screens/home/HomeScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import PingsScreen from '@/screens/pings/PingsScreen';
import CreatePingScreen from '@/screens/pings/CreatePingScreen';
import FriendsScreen from '@/screens/friends/FriendsScreen';
import SearchUsersScreen from '@/screens/friends/SearchUsersScreen';

// Placeholder screens for development
const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderSubtitle}>即將推出...</Text>
    </View>
  );
};

// Create stack navigator for Pings tab
const PingsStack = createStackNavigator();
const PingsNavigator = () => {
  return (
    <PingsStack.Navigator screenOptions={{ headerShown: false }}>
      <PingsStack.Screen name="PingsList" component={PingsScreen} />
      <PingsStack.Screen name="CreatePing" component={CreatePingScreen} />
    </PingsStack.Navigator>
  );
};

// Create stack navigator for Friends tab
const FriendsStack = createStackNavigator();
const FriendsNavigator = () => {
  return (
    <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
      <FriendsStack.Screen name="FriendsList" component={FriendsScreen} />
      <FriendsStack.Screen name="SearchUsers" component={SearchUsersScreen} />
    </FriendsStack.Navigator>
  );
};

// Create stack navigator for Group Dining tab - Coming Soon
const GroupDiningNavigator = () => {
  return <PlaceholderScreen title="群組聚餐" />;
};

const Tab = createBottomTabNavigator<HomeTabsParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Pings') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'GroupDining') {
            iconName = focused ? 'people-circle' : 'people-circle-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: '首頁' }}
      />
      <Tab.Screen 
        name="Pings" 
        component={PingsNavigator}
        options={{ tabBarLabel: 'Pings' }}
      />
      <Tab.Screen 
        name="GroupDining" 
        component={GroupDiningNavigator}
        options={{ tabBarLabel: '群組聚餐' }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsNavigator}
        options={{ tabBarLabel: '朋友' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: '個人' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MainNavigator;