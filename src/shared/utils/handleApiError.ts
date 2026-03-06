import axios from 'axios';
import type { ApiError } from '../types/api';
import { addToast } from '../../features/ui/uiSlice';

export const toApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    return {
      message:
        (error.response?.data as { message?: string } | undefined)?.message ||
        error.message ||
        'Request failed',
      code: error.response?.status,
      details: error.response?.data,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'Unknown error occurred' };
};

export const handleApiError = (dispatch: (action: unknown) => unknown, error: unknown): string => {
  const mapped = toApiError(error);

  if (mapped.code === 401) {
    localStorage.removeItem('auth_token');
    dispatch(addToast({ type: 'error', message: 'Session expired. Please login again.' }));
    return mapped.message;
  }

  if (mapped.code === 422) {
    dispatch(addToast({ type: 'error', message: mapped.message }));
    return mapped.message;
  }

  if (mapped.code && mapped.code >= 500) {
    dispatch(addToast({ type: 'error', message: 'Server error. Please try again.' }));
    return mapped.message;
  }

  dispatch(addToast({ type: 'error', message: mapped.message }));
  return mapped.message;
};
