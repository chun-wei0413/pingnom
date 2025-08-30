import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/common/Button';
import { useAppSelector } from '@/store/hooks';
import { HomeTabsScreenProps } from '@/types/navigation';

type HomeScreenProps = HomeTabsScreenProps<'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            你好{user?.profile.displayName ? `, ${user.profile.displayName}` : ''}！
          </Text>
          <Text style={styles.subtitle}>想要和朋友一起用餐嗎？</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>快速開始</Text>
          
          <Button
            title="🍽️ 發起新的聚餐"
            onPress={() => {
              // TODO: Navigate to CreatePing screen
              console.log('Navigate to CreatePing');
            }}
            size="large"
            style={styles.actionButton}
          />
          
          <Button
            title="👥 尋找朋友"
            onPress={() => {
              // TODO: Navigate to SearchUsers screen
              console.log('Navigate to SearchUsers');
            }}
            variant="outline"
            size="large"
            style={styles.actionButton}
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>最近活動</Text>
          
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎯</Text>
            <Text style={styles.emptyStateTitle}>還沒有活動</Text>
            <Text style={styles.emptyStateText}>
              發起您的第一個聚餐邀請，開始與朋友們的美食之旅！
            </Text>
          </View>
        </View>

        {/* Development Info */}
        <View style={styles.developmentInfo}>
          <Text style={styles.developmentTitle}>🚀 開發狀態</Text>
          <Text style={styles.developmentText}>
            目前實作功能：使用者註冊、基礎 UI 元件
          </Text>
          <Text style={styles.developmentText}>
            即將推出：Ping 建立、朋友管理、餐廳推薦
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickActions: {
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 12,
  },
  recentActivity: {
    marginBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  developmentInfo: {
    backgroundColor: '#FFF5F3',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  developmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 8,
  },
  developmentText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default HomeScreen;