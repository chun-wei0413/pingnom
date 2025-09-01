import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { friendshipApi, Friend, FriendRequestWithUser, FriendRequest, BlockUserRequest } from '@/services/api/friendshipApi';

export interface FriendshipState {
  friends: Friend[];
  pendingRequests: FriendRequestWithUser[];
  sentRequests: FriendRequestWithUser[];
  searchResults: Friend[];
  isLoading: boolean;
  isSearching: boolean;
  isAccepting: boolean;
  isDeclining: boolean;
  isRemoving: boolean;
  isBlocking: boolean;
  isSending: boolean;
  error: string | null;
  searchError: string | null;
}

const initialState: FriendshipState = {
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  searchResults: [],
  isLoading: false,
  isSearching: false,
  isAccepting: false,
  isDeclining: false,
  isRemoving: false,
  isBlocking: false,
  isSending: false,
  error: null,
  searchError: null,
};

// Async thunks
export const fetchFriends = createAsyncThunk(
  'friendship/fetchFriends',
  async ({ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await friendshipApi.getFriends(limit, offset);
      return response.friends;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch friends');
    }
  }
);

export const fetchPendingRequests = createAsyncThunk(
  'friendship/fetchPendingRequests',
  async ({ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await friendshipApi.getPendingRequests(limit, offset);
      return response.pendingRequests;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch pending requests');
    }
  }
);

export const fetchSentRequests = createAsyncThunk(
  'friendship/fetchSentRequests',
  async ({ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await friendshipApi.getSentRequests(limit, offset);
      return response.sentRequests;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch sent requests');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'friendship/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      const users = await friendshipApi.searchUsers(query);
      return users;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to search users');
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'friendship/sendFriendRequest',
  async (request: FriendRequest, { rejectWithValue }) => {
    try {
      const friendship = await friendshipApi.sendFriendRequest(request);
      return friendship;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send friend request');
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'friendship/acceptFriendRequest',
  async (friendshipId: string, { rejectWithValue }) => {
    try {
      await friendshipApi.acceptFriendRequest(friendshipId);
      return friendshipId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to accept friend request');
    }
  }
);

export const declineFriendRequest = createAsyncThunk(
  'friendship/declineFriendRequest',
  async (friendshipId: string, { rejectWithValue }) => {
    try {
      await friendshipApi.declineFriendRequest(friendshipId);
      return friendshipId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to decline friend request');
    }
  }
);

export const removeFriend = createAsyncThunk(
  'friendship/removeFriend',
  async (friendId: string, { rejectWithValue }) => {
    try {
      await friendshipApi.removeFriend(friendId);
      return friendId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove friend');
    }
  }
);

export const blockUser = createAsyncThunk(
  'friendship/blockUser',
  async (request: BlockUserRequest, { rejectWithValue }) => {
    try {
      await friendshipApi.blockUser(request);
      return request.blockedId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to block user');
    }
  }
);

const friendshipSlice = createSlice({
  name: 'friendship',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.searchError = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch friends
    builder.addCase(fetchFriends.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchFriends.fulfilled, (state, action) => {
      state.isLoading = false;
      state.friends = action.payload;
    });
    builder.addCase(fetchFriends.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch pending requests
    builder.addCase(fetchPendingRequests.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchPendingRequests.fulfilled, (state, action) => {
      state.isLoading = false;
      state.pendingRequests = action.payload;
    });
    builder.addCase(fetchPendingRequests.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch sent requests
    builder.addCase(fetchSentRequests.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchSentRequests.fulfilled, (state, action) => {
      state.isLoading = false;
      state.sentRequests = action.payload;
    });
    builder.addCase(fetchSentRequests.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Search users
    builder.addCase(searchUsers.pending, (state) => {
      state.isSearching = true;
      state.searchError = null;
    });
    builder.addCase(searchUsers.fulfilled, (state, action) => {
      state.isSearching = false;
      state.searchResults = action.payload;
    });
    builder.addCase(searchUsers.rejected, (state, action) => {
      state.isSearching = false;
      state.searchError = action.payload as string;
    });

    // Send friend request
    builder.addCase(sendFriendRequest.pending, (state) => {
      state.isSending = true;
      state.error = null;
    });
    builder.addCase(sendFriendRequest.fulfilled, (state, action) => {
      state.isSending = false;
      // Add to sent requests if needed
    });
    builder.addCase(sendFriendRequest.rejected, (state, action) => {
      state.isSending = false;
      state.error = action.payload as string;
    });

    // Accept friend request
    builder.addCase(acceptFriendRequest.pending, (state) => {
      state.isAccepting = true;
      state.error = null;
    });
    builder.addCase(acceptFriendRequest.fulfilled, (state, action) => {
      state.isAccepting = false;
      // Remove from pending requests
      state.pendingRequests = state.pendingRequests.filter(
        request => request.id !== action.payload
      );
    });
    builder.addCase(acceptFriendRequest.rejected, (state, action) => {
      state.isAccepting = false;
      state.error = action.payload as string;
    });

    // Decline friend request
    builder.addCase(declineFriendRequest.pending, (state) => {
      state.isDeclining = true;
      state.error = null;
    });
    builder.addCase(declineFriendRequest.fulfilled, (state, action) => {
      state.isDeclining = false;
      // Remove from pending requests
      state.pendingRequests = state.pendingRequests.filter(
        request => request.id !== action.payload
      );
    });
    builder.addCase(declineFriendRequest.rejected, (state, action) => {
      state.isDeclining = false;
      state.error = action.payload as string;
    });

    // Remove friend
    builder.addCase(removeFriend.pending, (state) => {
      state.isRemoving = true;
      state.error = null;
    });
    builder.addCase(removeFriend.fulfilled, (state, action) => {
      state.isRemoving = false;
      // Remove from friends list
      state.friends = state.friends.filter(friend => friend.id !== action.payload);
    });
    builder.addCase(removeFriend.rejected, (state, action) => {
      state.isRemoving = false;
      state.error = action.payload as string;
    });

    // Block user
    builder.addCase(blockUser.pending, (state) => {
      state.isBlocking = true;
      state.error = null;
    });
    builder.addCase(blockUser.fulfilled, (state, action) => {
      state.isBlocking = false;
      // Remove from friends list if blocked
      state.friends = state.friends.filter(friend => friend.id !== action.payload);
    });
    builder.addCase(blockUser.rejected, (state, action) => {
      state.isBlocking = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, clearSearchResults } = friendshipSlice.actions;
export default friendshipSlice.reducer;