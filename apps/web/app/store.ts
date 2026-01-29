import { configureStore } from '@reduxjs/toolkit';
import interviewReducer from '../src/features/interview/store/interviewSlice';
import authReducer, { AuthState } from '../src/features/auth/store/authSlice';
import { InterviewState } from '../src/features/interview/types';

export interface RootState {
  interview: InterviewState;
  auth: AuthState;
}

export const store = configureStore({
  reducer: {
    interview: interviewReducer,
    auth: authReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
