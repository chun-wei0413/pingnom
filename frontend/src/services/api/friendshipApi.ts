import { apiClient } from './apiClient';

export interface FriendshipStatus {
  pending: 'pending';
  accepted: 'accepted';
  blocked: 'blocked';
  declined: 'declined';
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'blocked' | 'declined';
  message?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
}

export interface FriendRequest {
  addresseeId: string;
  message?: string;
}

export interface BlockUserRequest {
  blockedId: string;
}

export interface Friend {
  id: string;
  displayName: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
}

export interface FriendRequestWithUser extends Friendship {
  requester?: Friend;
  addressee?: Friend;
}

export interface FriendsResponse {
  friends: Friend[];
}

export interface PendingRequestsResponse {
  pendingRequests: FriendRequestWithUser[];
}

export interface SentRequestsResponse {
  sentRequests: FriendRequestWithUser[];
}

export const friendshipApi = {
  // Send friend request
  sendFriendRequest: async (request: FriendRequest): Promise<Friendship> => {
    const response = await apiClient.post('/friends/request', request);
    return response.data;
  },

  // Accept friend request
  acceptFriendRequest: async (friendshipId: string): Promise<void> => {
    await apiClient.put(`/friends/request/${friendshipId}/accept`);
  },

  // Decline friend request
  declineFriendRequest: async (friendshipId: string): Promise<void> => {
    await apiClient.put(`/friends/request/${friendshipId}/decline`);
  },

  // Block user
  blockUser: async (request: BlockUserRequest): Promise<void> => {
    await apiClient.post('/friends/block', request);
  },

  // Remove friend
  removeFriend: async (friendId: string): Promise<void> => {
    await apiClient.delete(`/friends/${friendId}`);
  },

  // Get friends list
  getFriends: async (limit: number = 50, offset: number = 0): Promise<FriendsResponse> => {
    const response = await apiClient.get('/friends/', {
      limit, offset
    });
    // Backend returns data directly, not wrapped in {data: ...}
    return response.data || response;
  },

  // Get pending friend requests (received)
  getPendingRequests: async (limit: number = 50, offset: number = 0): Promise<PendingRequestsResponse> => {
    const response = await apiClient.get('/friends/requests/pending', {
      limit, offset
    });
    // Backend returns data directly, not wrapped in {data: ...}
    return response.data || response;
  },

  // Get sent friend requests
  getSentRequests: async (limit: number = 50, offset: number = 0): Promise<SentRequestsResponse> => {
    const response = await apiClient.get('/friends/requests/sent', {
      limit, offset
    });
    // Backend returns data directly, not wrapped in {data: ...}
    return response.data || response;
  },

  // Search users for adding friends
  searchUsers: async (query: string): Promise<Friend[]> => {
    const response = await apiClient.get('/users/search', {
      query
    });
    return response.data.users || [];
  },
};