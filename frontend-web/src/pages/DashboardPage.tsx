import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import { Button } from '../components/ui';

const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">🍽️ Pingnom</h1>
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
                  <Button className="w-full">
                    🍽️ 創建群組聚餐
                  </Button>
                  <Button variant="secondary" className="w-full">
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
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">參與聚餐</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">創建聚餐</span>
                    <span className="font-semibold">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">最近活動</h3>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🍽️</div>
                  <p className="text-gray-500">暫無活動記錄</p>
                  <p className="text-sm text-gray-400 mt-2">
                    開始創建聚餐或與朋友互動吧！
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;