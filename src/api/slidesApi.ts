import { apiClient } from './client';
import type { MediaItem, Slide, SlideDetail, SlideElement, SlidesResponse } from '../types/models';

const normalizeSlide = (raw: any, index = 0): Slide => ({
  id: String(raw?.id ?? raw?.uuid ?? raw?.slide_id ?? `slide-${index}`),
  slideName: String(raw?.slideName ?? raw?.name ?? raw?.title ?? `Slide ${index + 1}`),
  type: String(raw?.type ?? 'presentation'),
  status: String(raw?.status ?? 'draft'),
  rank: Number(raw?.rank ?? raw?.order ?? index + 1),
  thumbnail: raw?.thumbnail ?? raw?.preview ?? raw?.image ?? raw?.background,
  background: raw?.background ?? raw?.image,
  html: raw?.html ?? raw?.content,
});

const normalizeElement = (raw: any, index = 0): SlideElement => {
  const base = {
    id: String(raw?.id ?? raw?.uuid ?? `el-${index}`),
    x: Number(raw?.x ?? raw?.left ?? 40 + index * 10),
    y: Number(raw?.y ?? raw?.top ?? 40 + index * 10),
    width: Number(raw?.width ?? 160),
    height: Number(raw?.height ?? 80),
    zIndex: Number(raw?.zIndex ?? raw?.z_index ?? index + 1),
  };

  if (raw?.type === 'image' || raw?.src || raw?.url) {
    return {
      ...base,
      type: 'image',
      src: String(raw?.src ?? raw?.url ?? raw?.image ?? ''),
      alt: raw?.alt,
    };
  }

  return {
    ...base,
    type: 'text',
    content: String(raw?.content ?? raw?.text ?? 'type here'),
    color: raw?.color,
    fontSize: Number(raw?.fontSize ?? raw?.font_size ?? 32),
    fontWeight: Number(raw?.fontWeight ?? raw?.font_weight ?? 600),
  };
};

export const loginRequest = async (email: string, password: string) => {
  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    const response = await apiClient.post('/api/login', formData);
    const data = response.data;

    return {
      token: data?.token ?? data?.data?.token ?? data?.access_token,
      user: data?.user ?? data?.data?.user ?? null,
    };
  } catch {
    // Fallback for backends expecting JSON body instead of multipart/form-data
    const response = await apiClient.post('/api/login', { email, password }, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = response.data;

    return {
      token: data?.token ?? data?.data?.token ?? data?.access_token,
      user: data?.user ?? data?.data?.user ?? null,
    };
  }
};

export const logoutRequest = async () => {
  await apiClient.post('/api/logout');
};

export const fetchSlidesRequest = async (params: { page?: number; name?: string }): Promise<SlidesResponse> => {
  const response = await apiClient.get('/api/slides-of-designer', {
    params: {
      page: params.page,
      name: params.name || undefined,
    },
  });

  const payload = response.data;
  const container = payload?.data ?? payload;
  const rows = Array.isArray(container?.data)
    ? container.data
    : Array.isArray(container)
      ? container
      : Array.isArray(payload?.slides)
        ? payload.slides
        : [];

  const items = rows.map(normalizeSlide);
  const page = Number(container?.current_page ?? payload?.current_page ?? params.page ?? 1);
  const totalPages = Number(container?.last_page ?? payload?.last_page ?? 1);
  const totalCount = Number(container?.total ?? payload?.total ?? items.length);

  return { items, page, totalPages, totalCount };
};

export const fetchSlideByIdRequest = async (id: string): Promise<SlideDetail> => {
  try {
    const response = await apiClient.get(`/api/slides/${id}`);
    const raw = response.data?.data ?? response.data;
    const slide = normalizeSlide(raw);
    const elementsRaw = raw?.elements ?? [];
    return {
      ...slide,
      elements: Array.isArray(elementsRaw) ? elementsRaw.map(normalizeElement) : [],
    };
  } catch {
    const fallback = await fetchSlidesRequest({ page: 1 });
    const matched = fallback.items.find((slide) => slide.id === id) ?? fallback.items[0];
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
  const response = await apiClient.get(`/api/media-of-slide/${slideId}`);
  const payload = response.data?.data ?? response.data;
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.media) ? payload.media : [];

  const normalized = rows
    .map((raw: any, index: number) => ({
      id: String(raw?.id ?? raw?.uuid ?? `media-${index}`),
      type: String(raw?.type ?? 'image'),
      name: String(raw?.name ?? `Media ${index + 1}`),
      url: String(raw?.url ?? raw?.media ?? raw?.path ?? ''),
      thumbnail: raw?.thumbnail,
    }))
    .filter((item: MediaItem) => item.url);

  return type ? normalized.filter((item: MediaItem) => item.type === type) : normalized;
};

export const updateSlideElementRequest = async (
  slideId: string,
  elementId: string,
  updates: Partial<SlideElement>,
) => {
  await apiClient.post(`/api/save-slide-dummy/${slideId}`, {
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
  await apiClient.post(`/api/save-slide-dummy/${payload.slideId}`, {
    html: payload.html,
    screenshot: payload.screenshot,
    elements: payload.elements,
  });
};
