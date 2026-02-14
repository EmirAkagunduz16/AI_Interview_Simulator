import { configureStore } from "@reduxjs/toolkit";
import interviewReducer from "@/features/interview/store/interviewSlice";

export const store = configureStore({
  reducer: {
    interview: interviewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
