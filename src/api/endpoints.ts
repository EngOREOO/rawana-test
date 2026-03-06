export const API_ENDPOINTS = {
  login: '/api/login',
  logout: '/api/logout',
  userData: '/api/user-data',
  slidesOfDesigner: '/api/slides-of-designer',
  slideById: (id: string) => `/api/slides/${id}`,
  mediaOfSlide: (slideId: string) => `/api/media-of-slide/${slideId}`,
  saveSlideDummy: (slideId: string) => `/api/save-slide-dummy/${slideId}`,
  attachMediaToSlide: (slideId: string) => `/api/attach-media-to-slide/${slideId}`,
} as const;
