import { configureStore } from '@reduxjs/toolkit';
import currentSlideReducer, { saveSlideLayoutThunk } from './currentSlideSlice';
import authReducer from '../auth/authSlice';
import slidesReducer from '../slides/slidesSlice';
import elementsReducer, { setElements } from '../elements/elementsSlice';
import clipboardReducer from '../clipboard/clipboardSlice';
import uiReducer from '../ui/uiSlice';

vi.mock('../../api/slidesApi', async () => {
  const actual = await vi.importActual<typeof import('../../api/slidesApi')>('../../api/slidesApi');
  return {
    ...actual,
    saveSlideLayoutRequest: vi.fn(async () => undefined),
  };
});

describe('saveSlideLayoutThunk', () => {
  it('dispatches fulfilled and stores last saved data', async () => {
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

    store.dispatch(
      setElements([
        { id: 'e1', type: 'text', content: 'X', x: 0, y: 0, width: 10, height: 10, zIndex: 1 },
      ]),
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const result = await store.dispatch(
      saveSlideLayoutThunk({
        slideId: '1',
        html: '<div>canvas</div>',
        screenshot: 'data:image/png;base64,abc',
      }),
    );

    expect(saveSlideLayoutThunk.fulfilled.match(result)).toBe(true);
    const state = store.getState().currentSlide;
    expect(state.lastSavedHtml).toBe('<div>canvas</div>');
    expect(state.lastScreenshot).toBe('data:image/png;base64,abc');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
