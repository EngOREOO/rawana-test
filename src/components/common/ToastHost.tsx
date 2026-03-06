import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { removeToast } from '../../features/ui/uiSlice';

export default function ToastHost() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, 3500),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dispatch, toasts]);

  return (
    <div className="fixed right-4 top-4 z-[9999] flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-600'
              : toast.type === 'success'
                ? 'bg-emerald-600'
                : 'bg-slate-700'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
