import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchSlidesThunk } from '../features/slides/slidesSlice';
import {
  fetchMultimediaThunk,
  fetchSlideByIdThunk,
  saveSlideLayoutThunk,
  updateSlideElementThunk,
} from '../features/currentSlide/currentSlideSlice';
import CanvasArea from '../components/editor/CanvasArea';
import {
  addImageElement,
  addTextElement,
  elementsSelectors,
  selectElement,
  updateElementLocal,
} from '../features/elements/elementsSlice';
import type { SlideElement } from '../types/models';

export default function EditorPage() {
  const { id = '' } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  const slide = useAppSelector((state) => state.currentSlide.slide);
  const media = useAppSelector((state) => state.currentSlide.media);
  const slides = useAppSelector((state) => state.slides.items);
  const selectedId = useAppSelector((state) => state.elements.selectedId);
  const elements = useAppSelector(elementsSelectors.selectAll);

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedId) ?? null,
    [elements, selectedId],
  );

  const [rightSearch, setRightSearch] = useState('');

  useEffect(() => {
    if (!id) return;
    dispatch(fetchSlideByIdThunk(id));
    dispatch(fetchMultimediaThunk({ slideId: id, type: 'image' }));
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(fetchSlidesThunk({ page: 1, name: rightSearch || undefined }));
  }, [dispatch, rightSearch]);

  const onSave = async () => {
    if (!canvasRef.current || !id) {
      return;
    }

    const html = canvasRef.current.innerHTML;
    const shot = await html2canvas(canvasRef.current);
    const screenshot = shot.toDataURL('image/png');

    await dispatch(
      saveSlideLayoutThunk({
        slideId: id,
        html,
        screenshot,
      }),
    );
  };

  const onUpdateSelected = (changes: Partial<SlideElement>) => {
    if (!selectedElement || !id) return;

    dispatch(updateElementLocal({ id: selectedElement.id, changes }));
    dispatch(
      updateSlideElementThunk({
        slideId: id,
        elementId: selectedElement.id,
        updates: changes,
      }),
    );
  };

  const onSearchRight = (event: FormEvent) => {
    event.preventDefault();
    dispatch(fetchSlidesThunk({ page: 1, name: rightSearch.trim() || undefined }));
  };

  return (
    <div className="min-h-screen bg-slate-200">
      <header className="flex items-center justify-between bg-[#28335b] px-4 py-3 text-white">
        <div>
          <p className="text-sm uppercase tracking-wide">Slide Editor</p>
          <h1 className="text-lg font-semibold">{slide?.slideName ?? 'Loading...'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-white/30 px-4 py-2 text-sm hover:bg-white/10"
            onClick={onSave}
          >
            Save
          </button>
          <Link className="rounded-md bg-white px-4 py-2 text-sm text-[#28335b]" to="/">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-72px)] grid-cols-[300px_1fr_320px] gap-0">
        <aside className="border-r border-slate-300 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Add Elements</h2>
          <div className="mb-4 flex gap-2">
            <button
              className="rounded-md bg-[#7ba3d9] px-3 py-2 text-sm font-medium text-white"
              onClick={() => dispatch(addTextElement())}
            >
              Add Text
            </button>
            <button
              className="rounded-md bg-slate-300 px-3 py-2 text-sm"
              onClick={() => {
                const first = media[0];
                if (first) dispatch(addImageElement({ src: first.url }));
              }}
            >
              Add Image
            </button>
          </div>

          <div className="mb-4 rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Text Panel (Rich Text)</h3>
            <div className="mb-2 flex flex-wrap gap-1">
              {['bold', 'italic', 'underline'].map((command) => (
                <button
                  key={command}
                  type="button"
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                  onClick={() => document.execCommand(command)}
                >
                  {command}
                </button>
              ))}
            </div>
            <div
              className="min-h-20 rounded border border-slate-300 p-2 text-sm"
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) => {
                if (selectedElement?.type === 'text') {
                  onUpdateSelected({ content: event.currentTarget.innerText });
                }
              }}
            >
              {selectedElement?.type === 'text' ? selectedElement.content : 'Select a text element'}
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Image Panel</h3>
            <div className="grid max-h-40 grid-cols-2 gap-2 overflow-auto">
              {media.map((item) => (
                <button
                  key={item.id}
                  className="overflow-hidden rounded border border-slate-200"
                  onClick={() => dispatch(addImageElement({ src: item.url }))}
                >
                  <img src={item.url} alt={item.name} className="h-16 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Element Properties</h3>
            {selectedElement ? (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded border border-slate-300 px-2 py-1"
                    value={selectedElement.x}
                    type="number"
                    onChange={(event) => onUpdateSelected({ x: Number(event.target.value) })}
                  />
                  <input
                    className="rounded border border-slate-300 px-2 py-1"
                    value={selectedElement.y}
                    type="number"
                    onChange={(event) => onUpdateSelected({ y: Number(event.target.value) })}
                  />
                  <input
                    className="rounded border border-slate-300 px-2 py-1"
                    value={selectedElement.width}
                    type="number"
                    onChange={(event) => onUpdateSelected({ width: Number(event.target.value) })}
                  />
                  <input
                    className="rounded border border-slate-300 px-2 py-1"
                    value={selectedElement.height}
                    type="number"
                    onChange={(event) => onUpdateSelected({ height: Number(event.target.value) })}
                  />
                </div>
                <input
                  className="w-full rounded border border-slate-300 px-2 py-1"
                  value={selectedElement.zIndex}
                  type="number"
                  onChange={(event) => onUpdateSelected({ zIndex: Number(event.target.value) })}
                />
                {selectedElement.type === 'text' && (
                  <textarea
                    className="w-full rounded border border-slate-300 px-2 py-1"
                    value={selectedElement.content}
                    onChange={(event) => onUpdateSelected({ content: event.target.value })}
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select an element to edit properties.</p>
            )}
          </div>
        </aside>

        <main className="bg-slate-100 p-4">
          <CanvasArea slideId={id} canvasRef={canvasRef} />
        </main>

        <aside className="border-l border-slate-300 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Slides</h2>

          <form className="mb-3 flex gap-2" onSubmit={onSearchRight}>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Search slide"
              value={rightSearch}
              onChange={(event) => setRightSearch(event.target.value)}
            />
            <button className="rounded bg-amber-500 px-3 py-2 text-sm text-white">Go</button>
          </form>

          <div className="space-y-3 overflow-auto pb-4">
            {slides.map((slideItem) => (
              <button
                key={slideItem.id}
                className={`w-full rounded-lg border p-2 text-left ${
                  slideItem.id === id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                }`}
                onClick={() => {
                  dispatch(selectElement(null));
                  navigate(`/slides/${slideItem.id}`);
                }}
              >
                <p className="mb-1 text-xs font-semibold text-slate-700">{slideItem.rank}. {slideItem.slideName}</p>
                <img
                  src={slideItem.thumbnail || slideItem.background || 'https://picsum.photos/320/180'}
                  alt={slideItem.slideName}
                  className="h-24 w-full rounded object-cover"
                />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
