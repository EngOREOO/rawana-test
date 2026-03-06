import reducer, {
  addTextElement,
  deleteElement,
  pasteElement,
  updateElementLocal,
} from './elementsSlice';

describe('elementsSlice reducer', () => {
  it('adds and updates elements', () => {
    let state = reducer(undefined, addTextElement());
    const id = state.ids[0] as string;

    state = reducer(state, updateElementLocal({ id, changes: { x: 120, y: 240 } }));
    const updated = state.entities[id];
    expect(updated?.x).toBe(120);
    expect(updated?.y).toBe(240);
    expect(state.dirty).toBe(true);
  });

  it('pastes and deletes elements', () => {
    let state = reducer(undefined, addTextElement());
    const sourceId = state.ids[0] as string;
    const source = state.entities[sourceId];
    expect(source).toBeTruthy();

    state = reducer(
      state,
      pasteElement({
        ...(source as NonNullable<typeof source>),
        id: 'pasted-id',
        x: 200,
        y: 200,
      }),
    );
    expect(state.entities['pasted-id']).toBeTruthy();

    state = reducer(state, deleteElement('pasted-id'));
    expect(state.entities['pasted-id']).toBeUndefined();
    expect(state.dirty).toBe(true);
  });
});
