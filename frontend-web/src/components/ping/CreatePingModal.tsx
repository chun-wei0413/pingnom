import React, { useState, useEffect } from 'react';
import { Button, Input } from '../ui';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { api } from '../../services/api';

interface CreatePingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Friend {
  id: string;
  display_name: string;
  email: string;
}

const CreatePingModal: React.FC<CreatePingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      const response = await api.get('/friends', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('載入朋友清單失敗:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedFriends.length === 0) return;

    setIsLoading(true);
    try {
      await api.post('/pings', {
        title: title.trim(),
        description: description.trim(),
        meal_type: mealType,
        scheduled_time: scheduledTime || null,
        invitee_ids: selectedFriends
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 重置表單
      setTitle('');
      setDescription('');
      setMealType('lunch');
      setScheduledTime('');
      setSelectedFriends([]);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('創建 Ping 失敗:', error);
      alert('創建聚餐邀請失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const mealTypes = [
    { value: 'breakfast', label: '早餐 🌅' },
    { value: 'lunch', label: '午餐 🌞' },
    { value: 'dinner', label: '晚餐 🌆' },
    { value: 'snack', label: '點心 ☕' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">創建聚餐邀請</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">關閉</span>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              聚餐標題 *
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：午餐聚會"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述說明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="說明這次聚餐的詳細資訊..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用餐類型
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {mealTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              預定時間 (選填)
            </label>
            <Input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邀請朋友 * (選擇 {selectedFriends.length} 人)
            </label>
            {friends.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无朋友，請先添加朋友</p>
            ) : (
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                {friends.map(friend => (
                  <label key={friend.id} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2">
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(friend.id)}
                      onChange={() => toggleFriendSelection(friend.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">{friend.display_name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !title.trim() || selectedFriends.length === 0}
            >
              {isLoading ? '創建中...' : '創建聚餐'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePingModal;