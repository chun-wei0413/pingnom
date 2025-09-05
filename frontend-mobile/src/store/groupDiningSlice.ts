import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { 
  GroupDiningPlan, 
  CreateGroupDiningPlanRequest,
  AddTimeSlotRequest,
  AddRestaurantOptionRequest,
  JoinGroupDiningPlanRequest,
  StartVotingRequest,
  SubmitVoteRequest,
  FinalizeGroupDiningPlanRequest,
  VotingResults,
  Vote
} from '../types/api';
import api from '../services/api';

interface GroupDiningState {
  plans: GroupDiningPlan[];
  currentPlan: GroupDiningPlan | null;
  votingResults: VotingResults | null;
  votes: Vote[];
  loading: boolean;
  error: string | null;
}

const initialState: GroupDiningState = {
  plans: [],
  currentPlan: null,
  votingResults: null,
  votes: [],
  loading: false,
  error: null,
};

// 異步操作
export const createGroupDiningPlan = createAsyncThunk(
  'groupDining/createPlan',
  async (planData: CreateGroupDiningPlanRequest) => {
    const response = await api.post('/group-dining/plans', planData);
    return response.data;
  }
);

export const fetchGroupDiningPlans = createAsyncThunk(
  'groupDining/fetchPlans',
  async (params: { created_by?: string; user_id?: string }) => {
    let endpoint = '/group-dining/plans';
    const queryParams = new URLSearchParams();
    
    if (params.created_by) {
      queryParams.append('created_by', params.created_by);
    } else if (params.user_id) {
      endpoint = '/group-dining/participants/plans';
      queryParams.append('user_id', params.user_id);
    }
    
    const url = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
    const response = await api.get(url);
    return response.data.plans || response.data;
  }
);

export const fetchGroupDiningPlan = createAsyncThunk(
  'groupDining/fetchPlan',
  async (planId: string) => {
    const response = await api.get(`/group-dining/plans/${planId}`);
    return response.data;
  }
);

export const addTimeSlot = createAsyncThunk(
  'groupDining/addTimeSlot',
  async ({ planId, timeSlotData }: { planId: string; timeSlotData: Omit<AddTimeSlotRequest, 'plan_id'> }) => {
    const response = await api.post(`/group-dining/plans/${planId}/time-slots`, timeSlotData);
    return response.data;
  }
);

export const addRestaurantOption = createAsyncThunk(
  'groupDining/addRestaurantOption',
  async ({ planId, restaurantData }: { planId: string; restaurantData: Omit<AddRestaurantOptionRequest, 'plan_id'> }) => {
    const response = await api.post(`/group-dining/plans/${planId}/restaurants`, restaurantData);
    return response.data;
  }
);

export const joinGroupDiningPlan = createAsyncThunk(
  'groupDining/joinPlan',
  async ({ planId, userData }: { planId: string; userData: Omit<JoinGroupDiningPlanRequest, 'plan_id'> }) => {
    const response = await api.post(`/group-dining/plans/${planId}/join`, userData);
    return response.data;
  }
);

export const startVoting = createAsyncThunk(
  'groupDining/startVoting',
  async ({ planId, votingData }: { planId: string; votingData: Omit<StartVotingRequest, 'plan_id'> }) => {
    const response = await api.post(`/group-dining/plans/${planId}/start-voting`, votingData);
    return response.data;
  }
);

export const submitVote = createAsyncThunk(
  'groupDining/submitVote',
  async ({ planId, voteData }: { planId: string; voteData: Omit<SubmitVoteRequest, 'plan_id'> }) => {
    const response = await api.post(`/group-dining/plans/${planId}/vote`, voteData);
    return response.data;
  }
);

export const fetchVotingResults = createAsyncThunk(
  'groupDining/fetchVotingResults',
  async (planId: string) => {
    const response = await api.get(`/group-dining/plans/${planId}/results`);
    return response.data;
  }
);

export const finalizeGroupDiningPlan = createAsyncThunk(
  'groupDining/finalizePlan',
  async ({ planId, finalizeData }: { planId: string; finalizeData: Omit<FinalizeGroupDiningPlanRequest, 'plan_id'> }) => {
    const response = await api.post(`/group-dining/plans/${planId}/finalize`, finalizeData);
    return response.data;
  }
);

const groupDiningSlice = createSlice({
  name: 'groupDining',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPlan: (state) => {
      state.currentPlan = null;
    },
    clearVotingResults: (state) => {
      state.votingResults = null;
    },
    updateCurrentPlan: (state, action: PayloadAction<Partial<GroupDiningPlan>>) => {
      if (state.currentPlan) {
        state.currentPlan = { ...state.currentPlan, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Group Dining Plan
      .addCase(createGroupDiningPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroupDiningPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.plans.unshift(action.payload);
        state.currentPlan = action.payload;
      })
      .addCase(createGroupDiningPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create group dining plan';
      })

      // Fetch Group Dining Plans
      .addCase(fetchGroupDiningPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupDiningPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchGroupDiningPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch group dining plans';
      })

      // Fetch Single Group Dining Plan
      .addCase(fetchGroupDiningPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupDiningPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPlan = action.payload;
        // Update plan in plans array if it exists
        const index = state.plans.findIndex(plan => plan.id === action.payload.id);
        if (index !== -1) {
          state.plans[index] = action.payload;
        }
      })
      .addCase(fetchGroupDiningPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch group dining plan';
      })

      // Add Time Slot
      .addCase(addTimeSlot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTimeSlot.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentPlan) {
          state.currentPlan = action.payload;
        }
      })
      .addCase(addTimeSlot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add time slot';
      })

      // Add Restaurant Option
      .addCase(addRestaurantOption.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addRestaurantOption.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentPlan) {
          state.currentPlan = action.payload;
        }
      })
      .addCase(addRestaurantOption.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add restaurant option';
      })

      // Join Group Dining Plan
      .addCase(joinGroupDiningPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinGroupDiningPlan.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentPlan) {
          state.currentPlan = action.payload;
        }
      })
      .addCase(joinGroupDiningPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to join group dining plan';
      })

      // Start Voting
      .addCase(startVoting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startVoting.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentPlan) {
          state.currentPlan = action.payload;
        }
      })
      .addCase(startVoting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to start voting';
      })

      // Submit Vote
      .addCase(submitVote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitVote.fulfilled, (state, action) => {
        state.loading = false;
        // Update current plan or add to votes
        if (state.currentPlan) {
          // Refresh current plan after voting
          const updatedParticipant = state.currentPlan.participants.find(
            p => p.user_id === action.payload.user_id
          );
          if (updatedParticipant) {
            updatedParticipant.has_voted = true;
          }
        }
      })
      .addCase(submitVote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to submit vote';
      })

      // Fetch Voting Results
      .addCase(fetchVotingResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVotingResults.fulfilled, (state, action) => {
        state.loading = false;
        state.votingResults = action.payload;
      })
      .addCase(fetchVotingResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch voting results';
      })

      // Finalize Group Dining Plan
      .addCase(finalizeGroupDiningPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(finalizeGroupDiningPlan.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentPlan) {
          state.currentPlan = action.payload;
        }
        // Update plan in plans array
        const index = state.plans.findIndex(plan => plan.id === action.payload.id);
        if (index !== -1) {
          state.plans[index] = action.payload;
        }
      })
      .addCase(finalizeGroupDiningPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to finalize group dining plan';
      });
  },
});

export const { 
  clearError, 
  clearCurrentPlan, 
  clearVotingResults, 
  updateCurrentPlan 
} = groupDiningSlice.actions;

export default groupDiningSlice.reducer;