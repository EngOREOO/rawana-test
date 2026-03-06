import { configureStore } from '@reduxjs/toolkit';
import elementsReducer, { setElements } from './elementsSlice';
import { selectElementsSortedByZIndex } from './selectors';
import authReducer from '../auth/authSlice';
import slidesReducer from '../slides/slidesSlice';
import currentSlideReducer from '../currentSlide/currentSlideSlice';
import clipboardReducer from '../clipboard/clipboardSlice';
import uiReducer from '../ui/uiSlice';

describe('elements selectors', () => {
  it('sorts by zIndex then id', () => {
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
        { id: 'b', type: 'text', content: 'B', x: 0, y: 0, width: 10, height: 10, zIndex: 2 },
        { id: 'a', type: 'text', content: 'A', x: 0, y: 0, width: 10, height: 10, zIndex: 2 },
        { id: 'c', type: 'text', content: 'C', x: 0, y: 0, width: 10, height: 10, zIndex: 1 },
      ]),
    );

    const sorted = selectElementsSortedByZIndex(store.getState());
    expect(sorted.map((item) => item.id)).toEqual(['c', 'a', 'b']);
  });
});
