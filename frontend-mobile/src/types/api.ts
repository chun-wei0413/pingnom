// API 相關類型定義

// 基礎回應類型
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// 用戶相關
export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// 朋友相關
export interface Friend {
  id: string;
  display_name: string;
  email: string;
  friendship_status?: string;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

// Ping 相關
export interface Ping {
  id: string;
  created_by: string;
  title: string;
  description: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  scheduled_time?: string;
  invitee_ids: string[];
  responses: PingResponse[];
  status: 'active' | 'responded' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface PingResponse {
  user_id: string;
  user_name: string;
  response: 'accept' | 'decline' | 'maybe';
  responded_at: string;
}

export interface CreatePingRequest {
  title: string;
  description: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  scheduled_time?: string;
  invitee_ids: string[];
}

// 統計相關
export interface DashboardStats {
  totalPings: number;
  activePings: number;
  totalFriends: number;
  pendingRequests: number;
}

// Group Dining 相關
export interface GroupDiningPlan {
  id: string;
  created_by: string;
  title: string;
  description: string;
  status: 'planning' | 'voting' | 'finalized' | 'cancelled';
  time_slots: TimeSlot[];
  restaurant_options: RestaurantOption[];
  participants: Participant[];
  confirmed_time_slot?: TimeSlot;
  confirmed_restaurant?: RestaurantOption;
  created_at: string;
  updated_at: string;
  voting_deadline?: string;
}

export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  description: string;
  vote_count: number;
}

export interface RestaurantOption {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  cuisine_type: string;
  vote_count: number;
}

export interface Participant {
  user_id: string;
  display_name: string;
  joined_at: string;
  has_voted: boolean;
}

export interface CreateGroupDiningPlanRequest {
  created_by: string;
  title: string;
  description: string;
}

export interface AddTimeSlotRequest {
  plan_id: string;
  start_time: string;
  end_time: string;
  description: string;
}

export interface AddRestaurantOptionRequest {
  plan_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  cuisine_type: string;
}

export interface JoinGroupDiningPlanRequest {
  plan_id: string;
  user_id: string;
  display_name: string;
}

export interface StartVotingRequest {
  plan_id: string;
  voting_deadline?: string;
}

export interface SubmitVoteRequest {
  plan_id: string;
  user_id: string;
  time_slot_ids: string[];
  restaurant_ids: string[];
  comment?: string;
}

export interface FinalizeGroupDiningPlanRequest {
  plan_id: string;
  time_slot_id: string;
  restaurant_id: string;
}

export interface Vote {
  id: string;
  plan_id: string;
  user_id: string;
  choices: VoteChoice[];
  comment?: string;
  voted_at: string;
}

export interface VoteChoice {
  id: string;
  type: 'time_slot' | 'restaurant';
  option_id: string;
}

export interface VotingResults {
  total_participants: number;
  voted_participants: number;
  voting_progress: number;
  time_slots: TimeSlot[];
  restaurants: RestaurantOption[];
}