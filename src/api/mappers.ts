import type { MediaItem, Slide, SlideElement, SlidesResponse } from '../types/models';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord => (typeof value === 'object' && value !== null ? value as UnknownRecord : {});
const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export const normalizeSlide = (raw: unknown, index = 0): Slide => {
  const row = asRecord(raw);
  return {
    id: asString(row.id, asString(row.uuid, asString(row.slide_id, `slide-${index}`))),
    slideName: asString(row.slideName, asString(row.name, asString(row.title, `Slide ${index + 1}`))),
    type: asString(row.type, 'presentation'),
    status: asString(row.status, 'draft'),
    rank: asNumber(row.rank, asNumber(row.order, index + 1)),
    thumbnail: asString(row.thumbnail, asString(row.preview, asString(row.image, asString(row.background, '')))) || undefined,
    background: asString(row.background, asString(row.image, '')) || undefined,
    html: asString(row.html, asString(row.content, '')) || undefined,
  };
};

export const normalizeElement = (raw: unknown, index = 0): SlideElement => {
  const row = asRecord(raw);
  const base = {
    id: asString(row.id, asString(row.uuid, `el-${index}`)),
    x: asNumber(row.x, asNumber(row.left, 40 + index * 10)),
    y: asNumber(row.y, asNumber(row.top, 40 + index * 10)),
    width: asNumber(row.width, 160),
    height: asNumber(row.height, 80),
    zIndex: asNumber(row.zIndex, asNumber(row.z_index, index + 1)),
  };

  if (row.type === 'image' || typeof row.src === 'string' || typeof row.url === 'string') {
    return {
      ...base,
      type: 'image',
      src: asString(row.src, asString(row.url, asString(row.image, ''))),
      alt: asString(row.alt, '') || undefined,
    };
  }

  return {
    ...base,
    type: 'text',
    content: asString(row.content, asString(row.text, 'type here')),
    color: asString(row.color, '') || undefined,
    fontSize: asNumber(row.fontSize, asNumber(row.font_size, 32)),
    fontWeight: asNumber(row.fontWeight, asNumber(row.font_weight, 600)),
  };
};

export const mapSlidesResponse = (
  payload: unknown,
  fallbackPage = 1,
): SlidesResponse => {
  const root = asRecord(payload);
  const container = asRecord(root.data ?? root);
  const rows = Array.isArray(container.data)
    ? container.data
    : Array.isArray(container)
      ? container
      : Array.isArray(root.slides)
        ? root.slides
        : [];

  const items = rows.map((item, index) => normalizeSlide(item, index));
  const page = asNumber(container.current_page, asNumber(root.current_page, fallbackPage));
  const totalPages = asNumber(container.last_page, asNumber(root.last_page, 1));
  const totalCount = asNumber(container.total, asNumber(root.total, items.length));

  return { items, page, totalPages, totalCount };
};

export const mapMediaResponse = (payload: unknown): MediaItem[] => {
  const root = asRecord(payload);
  const data = root.data ?? root;
  const container = asRecord(data);
  const rows = Array.isArray(data) ? data : Array.isArray(container.media) ? container.media : [];

  return rows
    .map((raw, index) => {
      const row = asRecord(raw);
      return {
        id: asString(row.id, asString(row.uuid, `media-${index}`)),
        type: asString(row.type, 'image'),
        name: asString(row.name, `Media ${index + 1}`),
        url: asString(row.url, asString(row.media, asString(row.path, ''))),
        thumbnail: asString(row.thumbnail, '') || undefined,
      };
    })
    .filter((item) => Boolean(item.url));
};
