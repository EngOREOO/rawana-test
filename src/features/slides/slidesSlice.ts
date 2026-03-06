import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchSlidesRequest } from '../../api/slidesApi';
import { extractErrorMessage } from '../../api/client';
import type { Slide } from '../../types/models';
import { addToast } from '../ui/uiSlice';

interface SlidesState {
  items: Slide[];
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SlidesState = {
  items: [],
  page: 1,
  totalPages: 1,
  totalCount: 0,
  search: '',
  status: 'idle',
  error: null,
};

export const fetchSlidesThunk = createAsyncThunk<
  { items: Slide[]; page: number; totalPages: number; totalCount: number },
  { page?: number; name?: string; perPage?: number },
  { rejectValue: string }
>('slides/fetchSlides', async (params, { rejectWithValue, dispatch }) => {
  try {
    return await fetchSlidesRequest(params);
  } catch (error) {
    const message = extractErrorMessage(error);
    dispatch(addToast({ type: 'error', message }));
    return rejectWithValue(message);
  }
});

const slidesSlice = createSlice({
  name: 'slides',
  initialState,
  reducers: {
    setSlideSearch: (state, action) => {
      state.search = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSlidesThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSlidesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchSlidesThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unable to fetch slides';
      });
  },
});

export const { setSlideSearch } = slidesSlice.actions;
export default slidesSlice.reducer;
