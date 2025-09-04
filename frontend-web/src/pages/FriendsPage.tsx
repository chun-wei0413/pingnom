import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';
import { Button } from '../components/ui';
import { FriendsList } from '../components/friends';

const FriendsPage: React.FC = () => {
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
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-2xl font-bold text-primary-600 hover:text-primary-700">
                🍽️ Pingnom
              </a>
              <nav className="hidden md:flex space-x-6">
                <a 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  首頁
                </a>
                <span className="text-primary-600 font-medium">朋友</span>
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
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">朋友管理</h1>
          <p className="text-gray-600">管理您的朋友清單，發送和接受好友邀請</p>
        </div>

        <FriendsList />
      </main>
    </div>
  );
};

export default FriendsPage;