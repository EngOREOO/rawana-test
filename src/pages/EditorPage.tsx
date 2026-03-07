import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { addLocalSlide, fetchSlidesThunk } from '../features/slides/slidesSlice';
import { logoutThunk } from '../features/auth/authSlice';
import {
  fetchMultimediaThunk,
  fetchSlideByIdThunk,
  saveSlideLayoutThunk,
  setSlideBackground,
  updateSlideElementThunk,
} from '../features/currentSlide/currentSlideSlice';
import CanvasArea from '../components/editor/CanvasArea';
import {
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
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [showSavePreview, setShowSavePreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [savedPreviewBySlideId, setSavedPreviewBySlideId] = useState<Record<string, string>>({});

  const imageLibrary = [
    ...uploadedImages,
    ...media.map((item) => ({ id: item.id, name: item.name, url: item.url })),
  ];
  const isTextSelected = selectedElement?.type === 'text';
  const isImageSelected = selectedElement?.type === 'image';

  const isLocalSlide = slides.some((slideItem) => slideItem.id === id && slideItem.isLocal);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchSlideByIdThunk(id));
    if (!isLocalSlide) {
      dispatch(fetchMultimediaThunk({ slideId: id, type: 'image' }));
    }
  }, [dispatch, id, isLocalSlide]);

  useEffect(() => {
    dispatch(fetchSlidesThunk({ page: 1, name: rightSearch || undefined }));
  }, [dispatch, rightSearch]);

  useEffect(() => {
    if (selectedElement?.type === 'text') {
      setActiveTab('text');
    }
  }, [selectedElement?.type]);

  const onSave = async () => {
    if (!canvasRef.current || !id) {
      return;
    }

    const html = serializeCanvasHtml(canvasRef.current);
    const screenshot = await captureNodeScreenshot(canvasRef.current);
    const result = await dispatch(
      saveSlideLayoutThunk({
        slideId: id,
        html,
        screenshot,
      }),
    );
    if (saveSlideLayoutThunk.fulfilled.match(result)) {
      if (screenshot) {
        setSavedPreviewBySlideId((prev) => ({ ...prev, [id]: screenshot }));
      }
      const index = slides.findIndex((slideItem) => slideItem.id === id);
      setPreviewIndex(index >= 0 ? index : 0);
      setShowSavePreview(true);
    }
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
    setSelectedImageId(next[0]?.id ?? null);
    setSelectedImageName(next[0]?.name ?? '');
    event.target.value = '';
  };

  const onDropFiles = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files ?? []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    const next = files.map((file) => ({
      id: `upload-${crypto.randomUUID()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...next, ...prev]);
    setSelectedImageId(next[0]?.id ?? null);
    setSelectedImageName(next[0]?.name ?? '');
  };

  const onSelectLibraryImage = (item: { id: string; name: string; url: string }) => {
    setSelectedImageId(item.id);
    setSelectedImageName(item.name);
  };

  const onAddImageToSlide = (item: { id: string; name: string; url: string }) => {
    const exists = imageLibrary.some((entry) => entry.id === item.id);
    if (!exists) {
      setUploadedImages((prev) => [item, ...prev]);
    }
    onSelectLibraryImage(item);
    const nextRank = slides.length ? Math.max(...slides.map((slideItem) => slideItem.rank)) + 1 : 1;
    dispatch(
      addLocalSlide({
        id: `local-${crypto.randomUUID()}`,
        slideName: item.name || `Slide ${nextRank}`,
        type: 'presentation',
        status: 'draft',
        rank: nextRank,
        thumbnail: item.url,
        background: item.url,
        html: '',
        isLocal: true,
      }),
    );
  };

  const onUseAsBackground = (item: { id: string; name: string; url: string }) => {
    const exists = imageLibrary.some((entry) => entry.id === item.id);
    if (!exists) {
      setUploadedImages((prev) => [item, ...prev]);
    }
    onSelectLibraryImage(item);
    dispatch(setSlideBackground(item.url));
  };

  const onClickTextTab = () => {
    setActiveTab('text');
    dispatch(addTextElement());
  };

  const onLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login', { replace: true });
  };

  const previewSlides = slides.map((slideItem) => ({
    ...slideItem,
    preview: savedPreviewBySlideId[slideItem.id] || slideItem.thumbnail || slideItem.background || '',
  }));

  const activePreview = previewSlides[previewIndex] ?? null;

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
          <button className="rounded-md bg-[#dca126] px-4 py-2 text-sm text-white" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-72px)] grid-cols-[300px_1fr_320px] gap-0">
        <aside className="border-r border-slate-300 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Add Elements</h2>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              className={`rounded-md px-3 py-2 text-sm font-semibold ${activeTab === 'text' ? 'bg-[#28335b] text-white' : 'bg-slate-200 text-slate-700'}`}
              onClick={onClickTextTab}
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
                <>
                  <div className="mb-2 grid grid-cols-4 gap-1 rounded border border-slate-300 p-1">
                    <button
                      className={`rounded px-2 py-1 text-xs ${selectedElement.fontWeight === 700 ? 'bg-[#28335b] text-white' : 'bg-slate-200'}`}
                      onClick={() => onUpdateSelected({ fontWeight: selectedElement.fontWeight === 700 ? 400 : 700 })}
                    >
                      B
                    </button>
                    <button
                      className={`rounded px-2 py-1 text-xs ${selectedElement.fontStyle === 'italic' ? 'bg-[#28335b] text-white' : 'bg-slate-200'}`}
                      onClick={() => onUpdateSelected({ fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    >
                      I
                    </button>
                    <button
                      className={`rounded px-2 py-1 text-xs ${selectedElement.textDecoration === 'underline' ? 'bg-[#28335b] text-white' : 'bg-slate-200'}`}
                      onClick={() => onUpdateSelected({ textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })}
                    >
                      U
                    </button>
                    <input
                      type="color"
                      className="h-8 w-full rounded border border-slate-300"
                      value={selectedElement.color ?? '#ffffff'}
                      onChange={(event) => onUpdateSelected({ color: event.target.value })}
                    />
                  </div>
                  <div className="mb-2 grid grid-cols-4 gap-1">
                    <button className="rounded bg-slate-200 px-2 py-1 text-xs" onClick={() => onUpdateSelected({ textAlign: 'left' })}>Left</button>
                    <button className="rounded bg-slate-200 px-2 py-1 text-xs" onClick={() => onUpdateSelected({ textAlign: 'center' })}>Center</button>
                    <button className="rounded bg-slate-200 px-2 py-1 text-xs" onClick={() => onUpdateSelected({ textAlign: 'right' })}>Right</button>
                    <input
                      type="number"
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                      value={selectedElement.fontSize ?? 42}
                      onChange={(event) => onUpdateSelected({ fontSize: Number(event.target.value) })}
                    />
                  </div>
                  <textarea
                    className="min-h-40 w-full rounded border border-slate-300 p-2 text-sm"
                    value={selectedElement.content}
                    onChange={(event) => onUpdateSelected({ content: event.target.value })}
                  />
                </>
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
              <div
                className="grid max-h-64 grid-cols-2 gap-2 overflow-auto rounded-md border-2 border-dashed border-slate-300 p-2"
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDropFiles}
              >
                {imageLibrary.map((item) => (
                  <div
                    key={item.id}
                    className={`group relative overflow-hidden rounded border p-1 ${
                      selectedImageId === item.id ? 'border-yellow-300 ring-2 ring-yellow-300' : 'border-slate-200'
                    }`}
                    onClick={() => onSelectLibraryImage(item)}
                  >
                    <img src={item.url} alt={item.name} className="h-24 w-full rounded object-cover" />
                    <div className="pointer-events-none absolute inset-1 rounded bg-black/20" />
                    <div className="absolute inset-1 flex flex-col items-center justify-center gap-2">
                      <button
                        className="pointer-events-auto rounded bg-[#28335b]/50 px-3 py-1 text-xs font-semibold text-white"
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddImageToSlide(item);
                        }}
                      >
                        Add to slide
                      </button>
                      <button
                        className="pointer-events-auto rounded bg-slate-700/50 px-3 py-1 text-xs font-semibold text-white"
                        onClick={(event) => {
                          event.stopPropagation();
                          onUseAsBackground(item);
                        }}
                      >
                        Use as background
                      </button>
                    </div>
                    <p className="mt-1 truncate text-[11px] font-medium text-slate-600">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Element Properties</h3>
            {isTextSelected ? (
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
            ) : activeTab === 'image' && isImageSelected ? (
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

      {showSavePreview && activePreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-lg">
          <div className="relative w-[min(92vw,620px)] rounded-3xl bg-white p-6 shadow-2xl">
            <button
              className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
              onClick={() => setShowSavePreview(false)}
            >
              Close
            </button>
            <h3 className="mb-4 text-center text-4xl font-bold text-[#28335b]">Preview screenshot...</h3>
            <div className="relative mx-auto w-full max-w-[520px]">
              {activePreview.preview ? (
                <img
                  src={activePreview.preview}
                  alt={activePreview.slideName}
                  className="h-[420px] w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-[420px] w-full items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                  No preview available
                </div>
              )}
              <p className="mt-3 text-center text-sm font-semibold text-slate-700">
                {activePreview.rank}. {activePreview.slideName}
              </p>
              {previewSlides.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-[#28335b]/80 text-3xl text-white"
                    onClick={() => setPreviewIndex((prev) => (prev - 1 + previewSlides.length) % previewSlides.length)}
                  >
                    ‹
                  </button>
                  <button
                    className="absolute right-3 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-[#28335b]/80 text-3xl text-white"
                    onClick={() => setPreviewIndex((prev) => (prev + 1) % previewSlides.length)}
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
