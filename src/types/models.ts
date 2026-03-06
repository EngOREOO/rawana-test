export interface Slide {
  id: string;
  slideName: string;
  type: string;
  status: string;
  rank: number;
  thumbnail?: string;
  background?: string;
  html?: string;
}

export interface MediaItem {
  id: string;
  type: string;
  name: string;
  url: string;
  thumbnail?: string;
}

export type ElementType = 'text' | 'image';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt?: string;
}

export type SlideElement = TextElement | ImageElement;

export interface SlideDetail extends Slide {
  elements: SlideElement[];
}

export interface SlidesResponse {
  items: Slide[];
  page: number;
  totalPages: number;
  totalCount: number;
}
