import { MouseEvent, memo, useEffect, useState } from 'react';
import { nanoid } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  deleteElement,
  pasteElement,
  selectElement,
  updateElementLocal,
} from '../../features/elements/elementsSlice';
import { copyElement } from '../../features/clipboard/clipboardSlice';
import { syncSlideElementsThunk, updateSlideElementThunk } from '../../features/currentSlide/currentSlideSlice';
import type { SlideElement } from '../../types/models';
import { selectElementsSortedByZIndex } from '../../features/elements/selectors';

interface Props {
  slideId: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

type InteractionState =
  | {
      mode: 'drag';
      elementId: string;
      startX: number;
      startY: number;
      initialX: number;
      initialY: number;
    }
  | {
      mode: 'resize';
      elementId: string;
      startX: number;
      startY: number;
      initialW: number;
      initialH: number;
    }
  | null;

const stripHtmlTags = (value: string): string =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

interface CanvasElementProps {
  element: SlideElement;
  isSelected: boolean;
  onMouseDown: (event: MouseEvent<HTMLDivElement>, element: SlideElement) => void;
  onClickSelect: (event: MouseEvent<HTMLDivElement>, elementId: string) => void;
  onContextMenu: (event: MouseEvent<HTMLDivElement>, elementId: string) => void;
  onResizeMouseDown: (event: MouseEvent<HTMLDivElement>, element: SlideElement) => void;
}

const CanvasElement = memo(function CanvasElement({
  element,
  isSelected,
  onMouseDown,
  onClickSelect,
  onContextMenu,
  onResizeMouseDown,
}: CanvasElementProps) {
  return (
    <div
      className={`absolute cursor-move select-none ${isSelected ? 'ring-2 ring-yellow-300' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
      }}
      onMouseDown={(event) => onMouseDown(event, element)}
      onClick={(event) => onClickSelect(event, element.id)}
      onContextMenu={(event) => onContextMenu(event, element.id)}
    >
      {element.type === 'text' ? (
        <div
          className="h-full w-full overflow-hidden break-words text-white"
          style={{
            fontSize: element.fontSize ?? 42,
            fontWeight: element.fontWeight ?? 600,
            color: element.color ?? '#fff',
            fontStyle: element.fontStyle ?? 'normal',
            textDecoration: element.textDecoration ?? 'none',
            textAlign: element.textAlign ?? 'left',
          }}
        >
          {stripHtmlTags(element.content)}
        </div>
      ) : (
        <img src={element.src} alt={element.alt ?? 'element'} className="h-full w-full object-cover" />
      )}

      <div
        data-handle="resize"
        className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-white ring-1 ring-slate-800"
        onMouseDown={(event) => onResizeMouseDown(event, element)}
      />
    </div>
  );
});

export default function CanvasArea({ slideId, canvasRef }: Props) {
  const dispatch = useAppDispatch();
  const elements = useAppSelector(selectElementsSortedByZIndex);
  const selectedId = useAppSelector((state) => state.elements.selectedId);
  const clipboard = useAppSelector((state) => state.clipboard.element);
  const slide = useAppSelector((state) => state.currentSlide.slide);

  const [interaction, setInteraction] = useState<InteractionState>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);

  const startDrag = (event: MouseEvent<HTMLDivElement>, element: SlideElement) => {
    if ((event.target as HTMLElement).dataset.handle === 'resize') {
      return;
    }

    event.stopPropagation();
    dispatch(selectElement(element.id));
    setInteraction({
      mode: 'drag',
      elementId: element.id,
      startX: event.clientX,
      startY: event.clientY,
      initialX: element.x,
      initialY: element.y,
    });
  };

  const startResize = (event: MouseEvent<HTMLDivElement>, element: SlideElement) => {
    event.stopPropagation();
    dispatch(selectElement(element.id));
    setInteraction({
      mode: 'resize',
      elementId: element.id,
      startX: event.clientX,
      startY: event.clientY,
      initialW: element.width,
      initialH: element.height,
    });
  };

  useEffect(() => {
    if (!interaction) {
      return;
    }

    const onMove = (event: MouseEvent) => {
      if (interaction.mode === 'drag') {
        const nextX = Math.max(0, interaction.initialX + (event.clientX - interaction.startX));
        const nextY = Math.max(0, interaction.initialY + (event.clientY - interaction.startY));
        dispatch(updateElementLocal({ id: interaction.elementId, changes: { x: nextX, y: nextY } }));
      }

      if (interaction.mode === 'resize') {
        const width = Math.max(40, interaction.initialW + (event.clientX - interaction.startX));
        const height = Math.max(40, interaction.initialH + (event.clientY - interaction.startY));
        dispatch(updateElementLocal({ id: interaction.elementId, changes: { width, height } }));
      }
    };

    const onUp = () => {
      const element = elements.find((item) => item.id === interaction.elementId);
      if (element) {
        dispatch(
          updateSlideElementThunk({
            slideId,
            elementId: element.id,
            updates: {
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              zIndex: element.zIndex,
            },
          }),
        );
      }
      setInteraction(null);
    };

    window.addEventListener('mousemove', onMove as unknown as EventListener);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove as unknown as EventListener);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dispatch, elements, interaction, slideId]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const onContextMenu = (event: MouseEvent<HTMLDivElement>, elementId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY, elementId });
    dispatch(selectElement(elementId));
  };

  const onClickSelect = (event: MouseEvent<HTMLDivElement>, elementId: string) => {
    event.stopPropagation();
    dispatch(selectElement(elementId));
  };

  const onCopy = () => {
    if (!contextMenu) return;
    const element = elements.find((item) => item.id === contextMenu.elementId);
    if (!element) return;
    dispatch(copyElement(element));
    setContextMenu(null);
  };

  const onPaste = () => {
    if (!clipboard) return;
    const pasted = {
      ...clipboard,
      id: nanoid(),
      x: clipboard.x + 20,
      y: clipboard.y + 20,
      zIndex: Math.max(1, ...elements.map((item) => item.zIndex)) + 1,
    };
    dispatch(pasteElement(pasted));
    if (slideId) {
      dispatch(syncSlideElementsThunk({ slideId }));
    }
    setContextMenu(null);
  };

  const onDelete = () => {
    if (!contextMenu) return;
    dispatch(deleteElement(contextMenu.elementId));
    if (slideId) {
      dispatch(syncSlideElementsThunk({ slideId }));
    }
    setContextMenu(null);
  };

  return (
    <div className="relative flex h-full flex-col">
      <div
        ref={canvasRef}
        className="relative mx-auto mt-3 h-[560px] w-full max-w-[980px] overflow-hidden rounded-xl border border-slate-300 bg-slate-200"
        onClick={() => dispatch(selectElement(null))}
      >
        {slide?.background ? (
          <img src={slide.background} alt={slide.slideName} className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f2b56] via-[#1b4d96] to-[#12355e]" />
        )}

        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={selectedId === element.id}
            onMouseDown={startDrag}
            onClickSelect={onClickSelect}
            onContextMenu={onContextMenu}
            onResizeMouseDown={startResize}
          />
        ))}
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 w-40 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={onCopy}>
            Copy
          </button>
          <button
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:text-slate-400"
            onClick={onPaste}
            disabled={!clipboard}
          >
            Paste
          </button>
          <button className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={onDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
