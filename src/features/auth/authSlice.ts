import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { extractErrorMessage } from '../../api/client';
import { fetchUserDataRequest, loginRequest, logoutRequest, resetPasswordRequest } from '../../api/slidesApi';
import type { RootState } from '../../app/store';
import { addToast } from '../ui/uiSlice';
import { handleApiError } from '../../shared/utils/handleApiError';

interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error: string | null;
  resetStatus: 'idle' | 'loading' | 'succeeded' | 'error';
  resetError: string | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('auth_token'),
  user: null,
  status: localStorage.getItem('auth_token') ? 'authenticated' : 'idle',
  error: null,
  resetStatus: 'idle',
  resetError: null,
};

export const loginThunk = createAsyncThunk<
  { token: string; user: AuthUser | null },
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

export const fetchUserDataThunk = createAsyncThunk<AuthUser, void, { rejectValue: string }>(
  'auth/fetchUserData',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const data = await fetchUserDataRequest();
      return {
        id: typeof data.id === 'string' ? data.id : undefined,
        name: typeof data.name === 'string' ? data.name : undefined,
        email: typeof data.email === 'string' ? data.email : undefined,
        avatar: typeof data.avatar === 'string' ? data.avatar : undefined,
      };
    } catch (error) {
      return rejectWithValue(handleApiError(dispatch, error));
    }
  },
);

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

export const resetPasswordThunk = createAsyncThunk<void, { email: string; password: string }, { rejectValue: string }>(
  'auth/resetPassword',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      await resetPasswordRequest(payload.email, payload.password);
      dispatch(addToast({ type: 'success', message: 'Password updated successfully' }));
    } catch (error) {
      return rejectWithValue(handleApiError(dispatch, error));
    }
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
      .addCase(fetchUserDataThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.status = 'idle';
        state.error = null;
        state.resetStatus = 'idle';
        state.resetError = null;
        localStorage.removeItem('auth_token');
      })
      .addCase(resetPasswordThunk.pending, (state) => {
        state.resetStatus = 'loading';
        state.resetError = null;
      })
      .addCase(resetPasswordThunk.fulfilled, (state) => {
        state.resetStatus = 'succeeded';
        state.resetError = null;
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.resetStatus = 'error';
        state.resetError = action.payload ?? 'Unable to update password';
      });
  },
});

export const { hydrateToken } = authSlice.actions;
export default authSlice.reducer;
