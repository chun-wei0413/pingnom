import { api } from './api';

// 群組管理 API 擴展
export const groupApi = {
  // 建立群組
  async createGroup(data: {
    name: string;
    description?: string;
    privacy: 'public' | 'private';
    maxMembers: number;
  }) {
    const response = await api.post('/groups', data);
    return response.data;
  },

  // 取得用戶群組列表
  async getUserGroups() {
    const response = await api.get('/groups');
    return response.data;
  },

  // 根據 ID 取得群組詳情
  async getGroupById(groupId: string) {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  // 更新群組資訊
  async updateGroupInfo(groupId: string, data: {
    name?: string;
    description?: string;
  }) {
    const response = await api.put(`/groups/${groupId}`, data);
    return response.data;
  },

  // 邀請群組成員
  async inviteGroupMember(groupId: string, data: {
    userId: string;
  }) {
    const response = await api.post(`/groups/${groupId}/members`, data);
    return response.data;
  },

  // 移除群組成員
  async removeGroupMember(groupId: string, memberId: string) {
    const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
    return response.data;
  },

  // 離開群組
  async leaveGroup(groupId: string) {
    const response = await api.post(`/groups/${groupId}/leave`);
    return response.data;
  },

  // 搜尋群組
  async searchGroups(params: {
    name?: string;
    privacy?: 'public' | 'private';
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params.name) queryParams.append('name', params.name);
    if (params.privacy) queryParams.append('privacy', params.privacy);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await api.get(`/groups/search?${queryParams.toString()}`);
    return response.data;
  },

  // 取得群組統計
  async getGroupStats(groupId: string) {
    const response = await api.get(`/groups/${groupId}/stats`);
    return response.data;
  }
};

export default groupApi;