import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchSlidesThunk } from '../features/slides/slidesSlice';
import {
  fetchMultimediaThunk,
  fetchSlideByIdThunk,
  saveSlideLayoutThunk,
  setSlideBackground,
  updateSlideElementThunk,
} from '../features/currentSlide/currentSlideSlice';
import CanvasArea from '../components/editor/CanvasArea';
import {
  addImageElement,
  addTextElement,
  selectElement,
  updateElementLocal,
} from '../features/elements/elementsSlice';
import type { SlideElement } from '../types/models';
import { selectSelectedElement } from '../features/elements/selectors';
import { serializeCanvasHtml } from '../shared/utils/htmlSerializer';
import { captureNodeScreenshot } from '../shared/utils/screenshot';

export default function EditorPage() {
  const { id = '' } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slide = useAppSelector((state) => state.currentSlide.slide);
  const media = useAppSelector((state) => state.currentSlide.media);
  const slides = useAppSelector((state) => state.slides.items);
  const selectedElement = useAppSelector(selectSelectedElement);
  const [rightSearch, setRightSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [selectedImageName, setSelectedImageName] = useState('');

  const imageLibrary = [
    ...uploadedImages,
    ...media.map((item) => ({ id: item.id, name: item.name, url: item.url })),
  ];

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

    const html = serializeCanvasHtml(canvasRef.current);
    const screenshot = await captureNodeScreenshot(canvasRef.current);

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

  const onChooseFile = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const next = files.map((file) => ({
      id: `upload-${crypto.randomUUID()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...next, ...prev]);
    setSelectedImageName(next[0]?.name ?? '');
    event.target.value = '';
  };

  const onAddImageToSlide = (url: string, name: string) => {
    dispatch(addImageElement({ src: url }));
    setSelectedImageName(name);
  };

  const onUseAsBackground = (url: string, name: string) => {
    dispatch(setSlideBackground(url));
    setSelectedImageName(name);
  };

  return (
    <div className="min-h-screen bg-slate-200">
      <header className="flex items-center justify-between bg-[#28335b] px-4 py-3 text-white">
        <div>
          <p className="text-sm uppercase tracking-wide">Slide Editor</p>
          <h1 className="text-lg font-semibold">{slide?.slideName ?? 'Loading...'}</h1>
        </div>
        <p className="text-xl font-semibold tracking-wide">
          __{selectedImageName || slide?.slideName || 'slide_name_goes_here'}
        </p>
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
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              className={`rounded-md px-3 py-2 text-sm font-semibold ${activeTab === 'text' ? 'bg-[#28335b] text-white' : 'bg-slate-200 text-slate-700'}`}
              onClick={() => setActiveTab('text')}
            >
              Text
            </button>
            <button
              className={`rounded-md px-3 py-2 text-sm font-semibold ${activeTab === 'image' ? 'bg-[#7ba3d9] text-white' : 'bg-slate-200 text-slate-700'}`}
              onClick={() => setActiveTab('image')}
            >
              Image
            </button>
          </div>

          {activeTab === 'text' && (
            <div className="mb-4 rounded-lg border border-slate-200 p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Text Panel</h3>
              {selectedElement?.type === 'text' ? (
                <textarea
                  className="min-h-40 w-full rounded border border-slate-300 p-2 text-sm"
                  value={selectedElement.content}
                  onChange={(event) => onUpdateSelected({ content: event.target.value })}
                />
              ) : (
                <div className="min-h-20 rounded border border-slate-300 p-2 text-sm text-slate-500">
                  Select a text element
                </div>
              )}
            </div>
          )}

          {activeTab === 'image' && (
            <div className="mb-4 rounded-lg border border-slate-200 p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Image Panel</h3>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              <button className="mb-3 w-full rounded-md bg-[#28335b] px-3 py-2 text-sm font-semibold text-white" onClick={onChooseFile}>
                Choose File
              </button>
              <p className="mb-2 text-xs font-semibold text-slate-600">
                Selected: {selectedImageName || 'none'}
              </p>
              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-auto">
                {imageLibrary.map((item) => (
                  <div key={item.id} className="rounded border border-slate-200 p-1">
                    <img src={item.url} alt={item.name} className="mb-1 h-20 w-full rounded object-cover" />
                    <button
                      className="mb-1 w-full rounded bg-[#28335b] px-2 py-1 text-xs font-semibold text-white"
                      onClick={() => onAddImageToSlide(item.url, item.name)}
                    >
                      Add to slide
                    </button>
                    <button
                      className="w-full rounded bg-slate-700 px-2 py-1 text-xs font-semibold text-white"
                      onClick={() => onUseAsBackground(item.url, item.name)}
                    >
                      Use as background
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Element Properties</h3>
            {selectedElement && activeTab === 'text' && selectedElement.type === 'text' ? (
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
                <textarea
                  className="w-full rounded border border-slate-300 px-2 py-1"
                  value={selectedElement.content}
                  onChange={(event) => onUpdateSelected({ content: event.target.value })}
                />
              </div>
            ) : selectedElement && activeTab === 'image' && selectedElement.type === 'image' ? (
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
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {activeTab === 'text'
                  ? 'Select a text element to edit text controls.'
                  : 'Select an image element to edit image controls.'}
              </p>
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
