import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import pingReducer from './slices/pingSlice';
import friendshipReducer from './slices/friendshipSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    ping: pingReducer,
    friendship: friendshipReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;