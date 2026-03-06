import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UiState {
  pendingRequests: number;
  toasts: ToastMessage[];
}

const initialState: UiState = {
  pendingRequests: 0,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'> & { id?: string }>) => {
      const id = action.payload.id ?? `${Date.now()}-${Math.random()}`;
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) => action.type.endsWith('/pending'),
      (state) => {
        state.pendingRequests += 1;
      },
    );
    builder.addMatcher(
      (action) => action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected'),
      (state) => {
        state.pendingRequests = Math.max(0, state.pendingRequests - 1);
      },
    );
  },
});

export const { addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
