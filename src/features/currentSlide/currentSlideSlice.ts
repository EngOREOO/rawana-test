import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { extractErrorMessage } from '../../api/client';
import {
  fetchMultimediaRequest,
  fetchSlideByIdRequest,
  saveSlideLayoutRequest,
  syncSlideElementsRequest,
  updateSlideElementRequest,
} from '../../api/slidesApi';
import type { MediaItem, SlideDetail, SlideElement } from '../../types/models';
import type { RootState } from '../../app/store';
import { addToast } from '../ui/uiSlice';
import { handleApiError } from '../../shared/utils/handleApiError';

interface CurrentSlideState {
  slide: SlideDetail | null;
  media: MediaItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastSavedHtml: string | null;
  lastScreenshot: string | null;
}

const initialState: CurrentSlideState = {
  slide: null,
  media: [],
  status: 'idle',
  error: null,
  lastSavedHtml: null,
  lastScreenshot: null,
};

export const fetchSlideByIdThunk = createAsyncThunk<SlideDetail, string, { rejectValue: string }>(
  'currentSlide/fetchById',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      return await fetchSlideByIdRequest(id);
    } catch (error) {
      return rejectWithValue(handleApiError(dispatch, error));
    }
  },
);

export const fetchMultimediaThunk = createAsyncThunk<MediaItem[], { slideId: string; type: string }, { rejectValue: string }>(
  'currentSlide/fetchMultimedia',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      return await fetchMultimediaRequest(payload.slideId, payload.type);
    } catch (error) {
      return rejectWithValue(handleApiError(dispatch, error));
    }
  },
);

export const updateSlideElementThunk = createAsyncThunk<
  { elementId: string; updates: Partial<SlideElement> },
  { slideId: string; elementId: string; updates: Partial<SlideElement> },
  { rejectValue: string }
>('currentSlide/updateElement', async (payload, { rejectWithValue, dispatch }) => {
  try {
    await updateSlideElementRequest(payload.slideId, payload.elementId, payload.updates);
    return { elementId: payload.elementId, updates: payload.updates };
  } catch (error) {
    return rejectWithValue(handleApiError(dispatch, error));
  }
});

export const saveSlideLayoutThunk = createAsyncThunk<
  { html: string; screenshot?: string },
  { slideId: string; html: string; screenshot?: string },
  { state: RootState; rejectValue: string }
>('currentSlide/saveLayout', async (payload, { getState, rejectWithValue, dispatch }) => {
  try {
    const state = getState();
    const elements = Object.values(state.elements.entities).filter(Boolean) as SlideElement[];
    await saveSlideLayoutRequest({
      slideId: payload.slideId,
      html: payload.html,
      screenshot: payload.screenshot,
      elements,
    });
    console.log('Redux state snapshot on save:', state);
    dispatch(addToast({ type: 'success', message: 'Slide saved successfully' }));
    return { html: payload.html, screenshot: payload.screenshot };
  } catch (error) {
    const message = extractErrorMessage(error);
    dispatch(addToast({ type: 'error', message }));
    return rejectWithValue(message);
  }
});

export const syncSlideElementsThunk = createAsyncThunk<
  void,
  { slideId: string },
  { state: RootState; rejectValue: string }
>('currentSlide/syncElements', async ({ slideId }, { getState, rejectWithValue, dispatch }) => {
  try {
    const state = getState();
    const elements = Object.values(state.elements.entities).filter(Boolean) as SlideElement[];
    await syncSlideElementsRequest(slideId, elements);
  } catch (error) {
    return rejectWithValue(handleApiError(dispatch, error));
  }
});

const currentSlideSlice = createSlice({
  name: 'currentSlide',
  initialState,
  reducers: {
    clearCurrentSlide: (state) => {
      state.slide = null;
      state.media = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSlideByIdThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSlideByIdThunk.fulfilled, (state, action) => {
        state.slide = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchSlideByIdThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch slide';
      })
      .addCase(fetchMultimediaThunk.fulfilled, (state, action) => {
        state.media = action.payload;
      })
      .addCase(saveSlideLayoutThunk.fulfilled, (state, action) => {
        state.lastSavedHtml = action.payload.html;
        state.lastScreenshot = action.payload.screenshot ?? null;
      });
  },
});

export const { clearCurrentSlide } = currentSlideSlice.actions;
export default currentSlideSlice.reducer;
