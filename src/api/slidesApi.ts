import { apiClient } from './client';
import type { MediaItem, SlideDetail, SlideElement, SlidesResponse } from '../types/models';
import { API_ENDPOINTS } from './endpoints';
import { mapMediaResponse, mapSlidesResponse, normalizeElement, normalizeSlide } from './mappers';

export const loginRequest = async (email: string, password: string) => {
  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    const response = await apiClient.post(API_ENDPOINTS.login, formData);
    const data = response.data;

    return {
      token: data?.token ?? data?.data?.token ?? data?.access_token,
      user: data?.user ?? data?.data?.user ?? null,
    };
  } catch {
    // Fallback for backends expecting JSON body instead of multipart/form-data
    const response = await apiClient.post(API_ENDPOINTS.login, { email, password }, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = response.data;

    return {
      token: data?.token ?? data?.data?.token ?? data?.access_token,
      user: data?.user ?? data?.data?.user ?? null,
    };
  }
};

export const resetPasswordRequest = async (email: string, password: string) => {
  const response = await apiClient.post(
    API_ENDPOINTS.resetPassword,
    { email, password },
    { headers: { 'Content-Type': 'application/json' } },
  );
  return response.data;
};

export const logoutRequest = async () => {
  await apiClient.post(API_ENDPOINTS.logout);
};

export const fetchUserDataRequest = async () => {
  const response = await apiClient.get(API_ENDPOINTS.userData);
  const data = response.data;
  return (data?.data ?? data?.user ?? data) as Record<string, unknown>;
};

export const fetchSlidesRequest = async (params: { page?: number; name?: string; perPage?: number }): Promise<SlidesResponse> => {
  const response = await apiClient.get(API_ENDPOINTS.slidesOfDesigner, {
    params: {
      page: params.page,
      name: params.name || undefined,
      per_page: params.perPage ?? 10,
    },
  });
  return mapSlidesResponse(response.data, params.page ?? 1);
};

export const fetchSlideByIdRequest = async (id: string): Promise<SlideDetail> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.slideById(id));
    const raw = (response.data as { data?: unknown }).data ?? response.data;
    const row = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
    const slide = normalizeSlide(raw);
    const elementsRaw = Array.isArray(row.elements) ? row.elements : [];
    return {
      ...slide,
      elements: elementsRaw.map((item, index) => normalizeElement(item, index)),
    };
  } catch {
    const fallback = await fetchSlidesRequest({ page: 1 });
    const matched = fallback.items.find((slide) => slide.id === id);
    return {
      ...(matched ?? {
        id,
        slideName: 'Untitled Slide',
        type: 'presentation',
        status: 'draft',
        rank: 1,
      }),
      elements: [],
    };
  }
};

export const fetchMultimediaRequest = async (slideId: string, type: string): Promise<MediaItem[]> => {
  const response = await apiClient.get(API_ENDPOINTS.mediaOfSlide(slideId));
  const normalized = mapMediaResponse(response.data);
  return type ? normalized.filter((item) => item.type === type) : normalized;
};

export const updateSlideElementRequest = async (
  slideId: string,
  elementId: string,
  updates: Partial<SlideElement>,
) => {
  await apiClient.post(API_ENDPOINTS.saveSlideDummy(slideId), {
    mode: 'update_element',
    elementId,
    updates,
  });
};

export const saveSlideLayoutRequest = async (payload: {
  slideId: string;
  html: string;
  screenshot?: string;
  elements: SlideElement[];
}) => {
  await apiClient.post(API_ENDPOINTS.saveSlideDummy(payload.slideId), {
    html: payload.html,
    screenshot: payload.screenshot,
    elements: payload.elements,
  });
};

export const syncSlideElementsRequest = async (slideId: string, elements: SlideElement[]) => {
  await apiClient.post(API_ENDPOINTS.saveSlideDummy(slideId), {
    mode: 'sync_elements',
    elements,
  });
};
