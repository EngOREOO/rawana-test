import { PayloadAction, createEntityAdapter, createSlice, nanoid } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { ImageElement, SlideElement, TextElement } from '../../types/models';
import { fetchSlideByIdThunk, saveSlideLayoutThunk } from '../currentSlide/currentSlideSlice';

const elementsAdapter = createEntityAdapter<SlideElement>();

interface ElementsState {
  selectedId: string | null;
  dirty: boolean;
}

const initialState = elementsAdapter.getInitialState<ElementsState>({
  selectedId: null,
  dirty: false,
});

const createDefaultTextElement = (): TextElement => ({
  id: nanoid(),
  type: 'text',
  content: 'type here',
  x: 80,
  y: 80,
  width: 220,
  height: 80,
  zIndex: 1,
  color: '#ffffff',
  fontSize: 42,
  fontWeight: 600,
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
});

const createDefaultImageElement = (src: string): ImageElement => ({
  id: nanoid(),
  type: 'image',
  src,
  x: 100,
  y: 100,
  width: 280,
  height: 180,
  zIndex: 2,
  alt: 'Slide image',
});

const elementsSlice = createSlice({
  name: 'elements',
  initialState,
  reducers: {
    addTextElement: (state) => {
      const element = createDefaultTextElement();
      elementsAdapter.addOne(state, element);
      state.selectedId = element.id;
      state.dirty = true;
    },
    addImageElement: (state, action: PayloadAction<{ src: string }>) => {
      const element = createDefaultImageElement(action.payload.src);
      elementsAdapter.addOne(state, element);
      state.selectedId = element.id;
      state.dirty = true;
    },
    setElements: (state, action: PayloadAction<SlideElement[]>) => {
      elementsAdapter.setAll(state, action.payload);
      state.selectedId = action.payload[0]?.id ?? null;
      state.dirty = false;
    },
    selectElement: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
    updateElementLocal: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<SlideElement> }>,
    ) => {
      elementsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload.changes,
      });
      state.dirty = true;
    },
    deleteElement: (state, action: PayloadAction<string>) => {
      elementsAdapter.removeOne(state, action.payload);
      if (state.selectedId === action.payload) {
        state.selectedId = null;
      }
      state.dirty = true;
    },
    pasteElement: (state, action: PayloadAction<SlideElement>) => {
      elementsAdapter.addOne(state, action.payload);
      state.selectedId = action.payload.id;
      state.dirty = true;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSlideByIdThunk.fulfilled, (state, action) => {
      elementsAdapter.setAll(state, action.payload.elements ?? []);
      state.selectedId = action.payload.elements?.[0]?.id ?? null;
      state.dirty = false;
    });
    builder.addCase(saveSlideLayoutThunk.fulfilled, (state) => {
      state.dirty = false;
    });
  },
});

export const elementsSelectors = elementsAdapter.getSelectors<RootState>((state) => state.elements);

export const {
  addTextElement,
  addImageElement,
  setElements,
  selectElement,
  updateElementLocal,
  deleteElement,
  pasteElement,
} = elementsSlice.actions;

export default elementsSlice.reducer;
