import { PayloadAction, createSlice, nanoid } from '@reduxjs/toolkit';
import type { SlideElement } from '../../types/models';

interface ClipboardState {
  element: SlideElement | null;
}

const initialState: ClipboardState = {
  element: null,
};

const clipboardSlice = createSlice({
  name: 'clipboard',
  initialState,
  reducers: {
    copyElement: (state, action: PayloadAction<SlideElement>) => {
      state.element = action.payload;
    },
    clearClipboard: (state) => {
      state.element = null;
    },
    createPastedElement: (state) => {
      if (!state.element) {
        return;
      }

      state.element = {
        ...state.element,
        id: nanoid(),
        x: state.element.x + 20,
        y: state.element.y + 20,
      };
    },
  },
});

export const { copyElement, clearClipboard, createPastedElement } = clipboardSlice.actions;
export default clipboardSlice.reducer;
