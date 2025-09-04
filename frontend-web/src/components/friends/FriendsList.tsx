import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { Button, Input } from '../ui';
import { api } from '../../services/api';

interface Friend {
  id: string;
  display_name: string;
  email: string;
  friendship_status: string;
  created_at: string;
}

interface FriendRequest {
  id: string;
  requester: {
    id: string;
    display_name: string;
    email: string;
  };
  requested: {
    id: string;
    display_name: string;
    email: string;
  };
  status: string;
  created_at: string;
}

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent'>('friends');
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      setIsLoading(true);
      const [friendsRes, pendingRes, sentRes] = await Promise.all([
        api.get('/friends', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/friends/requests/pending', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/friends/requests/sent', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setFriends(friendsRes.data.friends || []);
      setPendingRequests(pendingRes.data.requests || []);
      setSentRequests(sentRes.data.requests || []);
    } catch (error) {
      console.error('載入朋友資料失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    try {
      await api.post('/friends/request', {
        email: searchEmail.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('好友邀請已發送！');
      setSearchEmail('');
      loadFriendsData(); // 重新載入資料
    } catch (error: any) {
      const message = error.response?.data?.message || '發送好友邀請失敗';
      alert(message);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.put(`/friends/request/${requestId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('已接受好友邀請！');
      loadFriendsData();
    } catch (error) {
      console.error('接受好友邀請失敗:', error);
      alert('接受好友邀請失敗，請稍後再試');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await api.put(`/friends/request/${requestId}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('已拒絕好友邀請');
      loadFriendsData();
    } catch (error) {
      console.error('拒絕好友邀請失敗:', error);
      alert('拒絕好友邀請失敗，請稍後再試');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('確定要移除這位朋友嗎？')) return;

    try {
      await api.delete(`/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('已移除朋友');
      loadFriendsData();
    } catch (error) {
      console.error('移除朋友失敗:', error);
      alert('移除朋友失敗，請稍後再試');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
  };

  const tabs = [
    { key: 'friends' as const, label: `朋友 (${friends.length})`, count: friends.length },
    { key: 'pending' as const, label: `待處理 (${pendingRequests.length})`, count: pendingRequests.length },
    { key: 'sent' as const, label: `已發送 (${sentRequests.length})`, count: sentRequests.length },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 新增朋友區塊 */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">新增朋友</h3>
        <form onSubmit={handleSendRequest} className="flex space-x-3">
          <Input
            type="email"
            placeholder="輸入朋友的 Email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!searchEmail.trim()}>
            發送邀請
          </Button>
        </form>
      </div>

      {/* Tab 標籤 */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 內容區域 */}
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* 朋友列表 */}
            {activeTab === 'friends' && (
              <div className="space-y-4">
                {friends.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">還沒有朋友</h3>
                    <p className="text-gray-500">開始尋找並邀請朋友一起享用美食吧！</p>
                  </div>
                ) : (
                  friends.map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {friend.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{friend.display_name}</h4>
                          <p className="text-sm text-gray-500">{friend.email}</p>
                          <p className="text-xs text-gray-400">成為朋友：{formatDate(friend.created_at)}</p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        移除
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 待處理邀請 */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">沒有待處理的邀請</h3>
                    <p className="text-gray-500">當有人向您發送好友邀請時，會在這裡顯示</p>
                  </div>
                ) : (
                  pendingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {request.requester.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{request.requester.display_name}</h4>
                          <p className="text-sm text-gray-500">{request.requester.email}</p>
                          <p className="text-xs text-gray-400">邀請時間：{formatDate(request.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          接受
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDeclineRequest(request.id)}
                        >
                          拒絕
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 已發送邀請 */}
            {activeTab === 'sent' && (
              <div className="space-y-4">
                {sentRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📤</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">沒有發送中的邀請</h3>
                    <p className="text-gray-500">您發送的好友邀請會在這裡顯示</p>
                  </div>
                ) : (
                  sentRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 font-semibold">
                            {request.requested.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{request.requested.display_name}</h4>
                          <p className="text-sm text-gray-500">{request.requested.email}</p>
                          <p className="text-xs text-gray-400">發送時間：{formatDate(request.created_at)}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        等待回應
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendsList;