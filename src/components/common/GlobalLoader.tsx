import { useAppSelector } from '../../app/hooks';

export default function GlobalLoader() {
  const pending = useAppSelector((state) => state.ui.pendingRequests);
  if (!pending) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] flex items-center justify-center bg-black/20">
      <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow">Loading...</div>
    </div>
  );
}
