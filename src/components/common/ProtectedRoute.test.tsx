import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import authReducer from '../../features/auth/authSlice';
import slidesReducer from '../../features/slides/slidesSlice';
import currentSlideReducer from '../../features/currentSlide/currentSlideSlice';
import elementsReducer from '../../features/elements/elementsSlice';
import clipboardReducer from '../../features/clipboard/clipboardSlice';
import uiReducer from '../../features/ui/uiSlice';
import ProtectedRoute from './ProtectedRoute';

const makeStore = (token: string | null) =>
  configureStore({
    reducer: {
      auth: authReducer,
      slides: slidesReducer,
      currentSlide: currentSlideReducer,
      elements: elementsReducer,
      clipboard: clipboardReducer,
      ui: uiReducer,
    },
    preloadedState: {
      auth: {
        token,
        user: null,
        status: (token ? 'authenticated' : 'idle') as 'authenticated' | 'idle',
        error: null,
      },
    },
  });

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    const store = makeStore(null);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={(
                <ProtectedRoute>
                  <div>Private Page</div>
                </ProtectedRoute>
              )}
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
    const store = makeStore('token');
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={(
                <ProtectedRoute>
                  <div>Private Page</div>
                </ProtectedRoute>
              )}
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText('Private Page')).toBeInTheDocument();
  });
});
