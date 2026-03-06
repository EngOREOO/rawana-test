import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import slidesReducer from '../features/slides/slidesSlice';
import currentSlideReducer from '../features/currentSlide/currentSlideSlice';
import elementsReducer from '../features/elements/elementsSlice';
import clipboardReducer from '../features/clipboard/clipboardSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    slides: slidesReducer,
    currentSlide: currentSlideReducer,
    elements: elementsReducer,
    clipboard: clipboardReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
