import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import CanvasArea from './CanvasArea';
import authReducer from '../../features/auth/authSlice';
import slidesReducer from '../../features/slides/slidesSlice';
import currentSlideReducer from '../../features/currentSlide/currentSlideSlice';
import elementsReducer, { setElements } from '../../features/elements/elementsSlice';
import clipboardReducer from '../../features/clipboard/clipboardSlice';
import uiReducer from '../../features/ui/uiSlice';

vi.mock('../../features/currentSlide/currentSlideSlice', async () => {
  const actual = await vi.importActual<typeof import('../../features/currentSlide/currentSlideSlice')>(
    '../../features/currentSlide/currentSlideSlice',
  );
  return {
    ...actual,
    updateSlideElementThunk: vi.fn(() => ({ type: 'noop' })),
    syncSlideElementsThunk: vi.fn(() => ({ type: 'noop' })),
  };
});

describe('CanvasArea context menu flow', () => {
  it('supports copy/paste/delete from context menu', () => {
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
        { id: 'e1', type: 'text', content: 'Hello', x: 10, y: 10, width: 80, height: 40, zIndex: 1 },
      ]),
    );

    render(
      <Provider store={store}>
        <CanvasArea slideId="1" canvasRef={{ current: null }} />
      </Provider>,
    );

    fireEvent.contextMenu(screen.getByText('Hello'));
    fireEvent.click(screen.getByText('Copy'));

    fireEvent.contextMenu(screen.getByText('Hello'));
    fireEvent.click(screen.getByText('Paste'));
    expect(Object.keys(store.getState().elements.entities).length).toBe(2);

    fireEvent.contextMenu(screen.getAllByText('Hello')[0]);
    fireEvent.click(screen.getByText('Delete'));
    expect(Object.keys(store.getState().elements.entities).length).toBe(1);
  });
});
