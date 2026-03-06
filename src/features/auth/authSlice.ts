import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { extractErrorMessage } from '../../api/client';
import { loginRequest, logoutRequest } from '../../api/slidesApi';
import type { RootState } from '../../app/store';
import { addToast } from '../ui/uiSlice';
import { handleApiError } from '../../shared/utils/handleApiError';

interface AuthState {
  token: string | null;
  user: Record<string, unknown> | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error: string | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('auth_token'),
  user: null,
  status: localStorage.getItem('auth_token') ? 'authenticated' : 'idle',
  error: null,
};

export const loginThunk = createAsyncThunk<
  { token: string; user: Record<string, unknown> | null },
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async (payload, { rejectWithValue, dispatch }) => {
  try {
    const response = await loginRequest(payload.email, payload.password);

    if (!response.token) {
      return rejectWithValue('Invalid credentials');
    }

    dispatch(addToast({ type: 'success', message: 'Login successful' }));
    return { token: response.token, user: response.user };
  } catch (error) {
    const message = extractErrorMessage(error);
    handleApiError(dispatch, error);
    if (message.toLowerCase().includes('credential') || message.toLowerCase().includes('unauth')) {
      return rejectWithValue('Invalid credentials');
    }
    return rejectWithValue('Invalid credentials');
  }
});

export const logoutThunk = createAsyncThunk<void, void, { state: RootState }>(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await logoutRequest();
    } catch {
      // ignore remote logout failures
    }
    dispatch(addToast({ type: 'info', message: 'Logged out' }));
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateToken: (state) => {
      state.token = localStorage.getItem('auth_token');
      state.status = state.token ? 'authenticated' : 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
        localStorage.setItem('auth_token', action.payload.token);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? 'Invalid credentials';
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.status = 'idle';
        state.error = null;
        localStorage.removeItem('auth_token');
      });
  },
});

export const { hydrateToken } = authSlice.actions;
export default authSlice.reducer;
