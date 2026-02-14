import { configureStore } from "@reduxjs/toolkit";
import interviewReducer from "../src/features/interview/store/interviewSlice";
import { InterviewState } from "../src/features/interview/types";

export interface RootState {
  interview: InterviewState;
}

export const store = configureStore({
  reducer: {
    interview: interviewReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
