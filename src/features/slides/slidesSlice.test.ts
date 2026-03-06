import { configureStore } from '@reduxjs/toolkit';
import slidesReducer, { fetchSlidesThunk } from './slidesSlice';
import authReducer from '../auth/authSlice';
import currentSlideReducer from '../currentSlide/currentSlideSlice';
import elementsReducer from '../elements/elementsSlice';
import clipboardReducer from '../clipboard/clipboardSlice';
import uiReducer from '../ui/uiSlice';

const fetchSlidesRequestMock = vi.fn(async () => ({
  items: [
    { id: '1', slideName: 'A', type: 'presentation', status: 'draft', rank: 1 },
  ],
  page: 2,
  totalPages: 5,
  totalCount: 100,
}));

vi.mock('../../api/slidesApi', async () => {
  const actual = await vi.importActual<typeof import('../../api/slidesApi')>('../../api/slidesApi');
  return {
    ...actual,
    fetchSlidesRequest: (...args: Parameters<typeof fetchSlidesRequestMock>) => fetchSlidesRequestMock(...args),
  };
});

describe('slidesSlice thunk', () => {
  it('handles fetch with pagination/search params', async () => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
        slides: slidesReducer,
        currentSlide: currentSlideReducer,
        elements: elementsReducer,
        clipboard: clipboardReducer,
        ui: uiReducer,
      },
    });

    await store.dispatch(fetchSlidesThunk({ page: 2, name: 'hero' }));
    expect(fetchSlidesRequestMock).toHaveBeenCalledWith({ page: 2, name: 'hero' });
    expect(store.getState().slides.page).toBe(2);
  });
});
