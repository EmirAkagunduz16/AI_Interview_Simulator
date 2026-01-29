import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserInfo {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserInfo>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    
    updateUser: (state, action: PayloadAction<Partial<UserInfo>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, updateUser, logout } = authSlice.actions;

export default authSlice.reducer;
