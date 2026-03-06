import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { elementsSelectors } from './elementsSlice';

export const selectElementsSortedByZIndex = createSelector(
  [elementsSelectors.selectAll],
  (elements) => elements.slice().sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id)),
);

export const selectSelectedElement = createSelector(
  [elementsSelectors.selectAll, (state: RootState) => state.elements.selectedId],
  (elements, selectedId) => elements.find((element) => element.id === selectedId) ?? null,
);
