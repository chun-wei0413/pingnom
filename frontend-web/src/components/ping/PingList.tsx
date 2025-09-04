import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { Button } from '../ui';
import { api } from '../../services/api';

interface Ping {
  id: string;
  title: string;
  description: string;
  meal_type: string;
  status: string;
  scheduled_time?: string;
  created_at: string;
  created_by: {
    id: string;
    display_name: string;
  };
  invitees: Array<{
    id: string;
    display_name: string;
    response: string;
    responded_at?: string;
  }>;
}

interface PingListProps {
  refreshTrigger?: number;
}

const PingList: React.FC<PingListProps> = ({ refreshTrigger }) => {
  const [pings, setPings] = useState<Ping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadPings();
  }, [refreshTrigger]);

  const loadPings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/pings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPings(response.data.pings || []);
    } catch (error) {
      console.error('載入 Ping 清單失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (pingId: string, response: 'accepted' | 'declined' | 'maybe') => {
    try {
      await api.put(`/pings/${pingId}/respond`, { response }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 重新載入清單以顯示更新
      loadPings();
    } catch (error) {
      console.error('回應 Ping 失敗:', error);
      alert('回應失敗，請稍後再試');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMealTypeEmoji = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'dinner': return '🌆';
      case 'snack': return '☕';
      default: return '🍽️';
    }
  };

  const getMealTypeLabel = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '早餐';
      case 'lunch': return '午餐';
      case 'dinner': return '晚餐';
      case 'snack': return '點心';
      default: return '用餐';
    }
  };

  const getResponseColor = (response: string) => {
    switch (response) {
      case 'accepted': return 'text-green-600 bg-green-50';
      case 'declined': return 'text-red-600 bg-red-50';
      case 'maybe': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getResponseLabel = (response: string) => {
    switch (response) {
      case 'accepted': return '已接受';
      case 'declined': return '已拒絕';
      case 'maybe': return '待定';
      default: return '未回應';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (pings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-4">🍽️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暫無聚餐邀請</h3>
        <p className="text-gray-500">創建您的第一個聚餐邀請，開始與朋友共享美食時光！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pings.map(ping => {
        const isCreator = ping.created_by.id === user?.id;
        const myResponse = ping.invitees.find(inv => inv.id === user?.id);
        const acceptedCount = ping.invitees.filter(inv => inv.response === 'accepted').length;
        const totalInvitees = ping.invitees.length;

        return (
          <div key={ping.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{getMealTypeEmoji(ping.meal_type)}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{ping.title}</h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {getMealTypeLabel(ping.meal_type)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-2">{ping.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span>👤 {ping.created_by.display_name}</span>
                  <span>📅 {formatDateTime(ping.created_at)}</span>
                  {ping.scheduled_time && (
                    <span>⏰ {formatDateTime(ping.scheduled_time)}</span>
                  )}
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-sm text-gray-600">
                    參與狀況：{acceptedCount}/{totalInvitees}
                  </span>
                  {ping.invitees.slice(0, 3).map(invitee => (
                    <span
                      key={invitee.id}
                      className={`text-xs px-2 py-1 rounded-full ${getResponseColor(invitee.response)}`}
                    >
                      {invitee.display_name}: {getResponseLabel(invitee.response)}
                    </span>
                  ))}
                  {ping.invitees.length > 3 && (
                    <span className="text-xs text-gray-500">+{ping.invitees.length - 3}人</span>
                  )}
                </div>
              </div>
            </div>

            {!isCreator && myResponse && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">您的回應：</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${getResponseColor(myResponse.response)}`}>
                    {getResponseLabel(myResponse.response)}
                  </span>
                </div>
                
                {myResponse.response === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleResponse(ping.id, 'accepted')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      ✓ 接受
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleResponse(ping.id, 'maybe')}
                      className="flex-1"
                    >
                      ? 待定
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResponse(ping.id, 'declined')}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      ✗ 拒絕
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isCreator && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">您創建的聚餐</span>
                  <Button size="sm" variant="secondary" disabled>
                    查看詳情
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PingList;