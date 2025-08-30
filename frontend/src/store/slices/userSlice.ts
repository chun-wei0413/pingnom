import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User, UpdateProfileRequest, ChangePasswordRequest, UserSearchResult } from '@/types/user';
import { userApi } from '@/services/api/userApi';
import { SearchQuery } from '@/types/api';

export interface UserState {
  searchResults: UserSearchResult[];
  searchLoading: boolean;
  searchError: string | null;
  updateLoading: boolean;
  updateError: string | null;
}

const initialState: UserState = {
  searchResults: [],
  searchLoading: false,
  searchError: null,
  updateLoading: false,
  updateError: null,
};

// Async thunks
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: UpdateProfileRequest, { rejectWithValue }) => {
    try {
      await userApi.updateProfile(data);
      // Fetch updated profile after successful update
      const updatedUser = await userApi.getProfile();
      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to update profile');
    }
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (data: ChangePasswordRequest, { rejectWithValue }) => {
    try {
      await userApi.changePassword(data);
      return;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to change password');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'user/searchUsers',
  async (query: SearchQuery, { rejectWithValue }) => {
    try {
      const response = await userApi.searchUsers(query);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to search users');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    clearUpdateError: (state) => {
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.updateLoading = false;
        // Updated user info is handled by auth slice
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload as string;
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.updateLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload as string;
      });

    // Search Users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.users;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload as string;
      });
  },
});

export const { clearSearchResults, clearUpdateError } = userSlice.actions;
export default userSlice.reducer;