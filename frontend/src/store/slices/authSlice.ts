import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, RegisterRequest, LoginRequest, RegisterResponse, LoginResponse } from '@/types/user';
import { userApi } from '@/services/api/userApi';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await userApi.register(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = await userApi.login(data);
      // 登入成功後立即獲取完整的用戶資料
      try {
        const userProfile = await userApi.getProfile();
        return { ...response, fullUser: userProfile };
      } catch (profileError) {
        // 即使獲取完整資料失敗，仍然返回登入結果
        console.warn('Failed to fetch full user profile after login:', profileError);
        return response;
      }
    } catch (error: any) {
      return rejectWithValue(error.error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    await userApi.logout();
    dispatch(clearAuth());
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await userApi.getProfile();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to fetch profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        // Note: Registration doesn't automatically log user in
        // They need to login after registration
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        // 如果有完整的用戶資料，使用它；否則使用基本資料
        if (action.payload.fullUser) {
          state.user = action.payload.fullUser;
        } else {
          // 建立基本的 User 物件
          state.user = {
            id: '', // 暫時空值
            email: '', // 暫時空值
            profile: action.payload.user,
            preferences: {
              cuisineTypes: [],
              restrictions: [],
              priceRange: { min: 0, max: 1000 }
            },
            privacySettings: {
              isDiscoverable: true,
              showLocation: true,
              allowFriendRequest: true
            },
            isActive: true,
            isVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as User;
        }
        state.accessToken = action.payload.accessToken;
        state.refreshToken = null; // 目前後端沒有實作 refresh token
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAuth, clearError, setTokens } = authSlice.actions;
export default authSlice.reducer;