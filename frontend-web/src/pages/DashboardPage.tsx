import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';
import { Button } from '../components/ui';
import { CreatePingModal, PingList } from '../components/ping';
import { api } from '../services/api';

const DashboardPage: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [isCreatePingModalOpen, setIsCreatePingModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    friendsCount: 0,
    participatedPings: 0,
    createdPings: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [friendsRes, pingsRes] = await Promise.all([
        api.get('/friends', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/pings', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const friends = friendsRes.data.friends || [];
      const pings = pingsRes.data.pings || [];
      
      const createdPings = pings.filter((ping: any) => ping.created_by.id === user?.id).length;
      const participatedPings = pings.filter((ping: any) => ping.created_by.id !== user?.id).length;

      setStats({
        friendsCount: friends.length,
        participatedPings,
        createdPings
      });
    } catch (error) {
      console.error('載入統計資料失敗:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleCreatePingSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    loadStats(); // 重新載入統計
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary-600">🍽️ Pingnom</h1>
              <nav className="hidden md:flex space-x-6">
                <span className="text-primary-600 font-medium">首頁</span>
                <a 
                  href="/friends" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  朋友
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">歡迎，{user?.display_name}</span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Welcome Card */}
            <div className="col-span-1 md:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  歡迎使用 Pingnom！
                </h2>
                <p className="text-gray-600 mb-6">
                  開始您的美食社交之旅。與朋友一起探索美味，分享快樂時光。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    className="w-full" 
                    onClick={() => setIsCreatePingModalOpen(true)}
                  >
                    🍽️ 創建群組聚餐
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => window.location.href = '/friends'}
                  >
                    👥 管理朋友
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">快速統計</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">朋友數量</span>
                    <span className="font-semibold">{stats.friendsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">參與聚餐</span>
                    <span className="font-semibold">{stats.participatedPings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">創建聚餐</span>
                    <span className="font-semibold">{stats.createdPings}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Pings */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">我的聚餐邀請</h2>
              <Button onClick={() => setIsCreatePingModalOpen(true)}>
                + 新增聚餐
              </Button>
            </div>
            <PingList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>

      {/* Create Ping Modal */}
      <CreatePingModal
        isOpen={isCreatePingModalOpen}
        onClose={() => setIsCreatePingModalOpen(false)}
        onSuccess={handleCreatePingSuccess}
      />
    </div>
  );
};

export default DashboardPage;