import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { pingApi, Ping, PingRequest, RespondToPingRequest, CreatePingResult } from '@/services/api/pingApi';

interface PingState {
  pings: Ping[];
  currentPing: Ping | null;
  isLoading: boolean;
  isCreating: boolean;
  isResponding: boolean;
  error: string | null;
  total: number;
}

const initialState: PingState = {
  pings: [],
  currentPing: null,
  isLoading: false,
  isCreating: false,
  isResponding: false,
  error: null,
  total: 0,
};

// Async thunks
export const createPing = createAsyncThunk(
  'ping/createPing',
  async (pingData: PingRequest) => {
    const response = await pingApi.createPing(pingData);
    return response;
  }
);

export const fetchUserPings = createAsyncThunk(
  'ping/fetchUserPings',
  async ({ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}) => {
    const response = await pingApi.getUserPings(limit, offset);
    return response;
  }
);

export const respondToPing = createAsyncThunk(
  'ping/respondToPing',
  async ({ pingId, data }: { pingId: string; data: RespondToPingRequest }) => {
    await pingApi.respondToPing(pingId, data);
    return { pingId, ...data };
  }
);

export const fetchPingById = createAsyncThunk(
  'ping/fetchPingById',
  async (pingId: string) => {
    const response = await pingApi.getPingById(pingId);
    return response;
  }
);

const pingSlice = createSlice({
  name: 'ping',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPing: (state) => {
      state.currentPing = null;
    },
    resetPings: (state) => {
      state.pings = [];
      state.total = 0;
    },
  },
  extraReducers: (builder) => {
    // Create Ping
    builder
      .addCase(createPing.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createPing.fulfilled, (state, action: PayloadAction<CreatePingResult>) => {
        state.isCreating = false;
        // Refresh pings after creating
      })
      .addCase(createPing.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.error.message || 'Failed to create ping';
      });

    // Fetch User Pings
    builder
      .addCase(fetchUserPings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserPings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pings = action.payload.pings;
        state.total = action.payload.total;
      })
      .addCase(fetchUserPings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch pings';
      });

    // Respond to Ping
    builder
      .addCase(respondToPing.pending, (state) => {
        state.isResponding = true;
        state.error = null;
      })
      .addCase(respondToPing.fulfilled, (state, action) => {
        state.isResponding = false;
        // Update the ping in the list
        const { pingId, status, message } = action.payload;
        const pingIndex = state.pings.findIndex(p => p.id === pingId);
        if (pingIndex !== -1) {
          // Update response in the ping
          const ping = state.pings[pingIndex];
          // This would need the current user ID to update the correct response
          // For now, we'll refresh the data
        }
      })
      .addCase(respondToPing.rejected, (state, action) => {
        state.isResponding = false;
        state.error = action.error.message || 'Failed to respond to ping';
      });

    // Fetch Ping by ID
    builder
      .addCase(fetchPingById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPingById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPing = action.payload;
      })
      .addCase(fetchPingById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch ping';
      });
  },
});

export const { clearError, clearCurrentPing, resetPings } = pingSlice.actions;
export default pingSlice.reducer;