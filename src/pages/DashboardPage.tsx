import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchSlidesThunk } from '../features/slides/slidesSlice';
import { logoutThunk } from '../features/auth/authSlice';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items, page, totalPages, totalCount, status } = useAppSelector((state) => state.slides);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchSlidesThunk({ page: 1 }));
  }, [dispatch]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    dispatch(fetchSlidesThunk({ page: 1, name: search.trim() || undefined }));
  };

  const onPage = (nextPage: number) => {
    dispatch(fetchSlidesThunk({ page: nextPage, name: search.trim() || undefined }));
  };

  const onLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl rounded-xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-800">Slides Dashboard</h1>
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-white" onClick={onLogout}>
            Logout
          </button>
        </div>

        <form onSubmit={onSearch} className="mb-4 flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by slide name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">Search</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="border border-slate-200 px-3 py-2">Slide Name</th>
                <th className="border border-slate-200 px-3 py-2">Type</th>
                <th className="border border-slate-200 px-3 py-2">Status</th>
                <th className="border border-slate-200 px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((slide) => (
                <tr key={slide.id}>
                  <td className="border border-slate-200 px-3 py-2">{slide.slideName}</td>
                  <td className="border border-slate-200 px-3 py-2">{slide.type}</td>
                  <td className="border border-slate-200 px-3 py-2">{slide.status}</td>
                  <td className="border border-slate-200 px-3 py-2">
                    <Link className="text-blue-600 hover:underline" to={`/slides/${slide.id}`}>
                      Open Editor
                    </Link>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={4} className="border border-slate-200 px-3 py-6 text-center text-slate-500">
                    {status === 'loading' ? 'Loading slides...' : 'No slides found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            Page {page} of {totalPages} | Total: {totalCount}
          </p>
          <div className="flex gap-2">
            <button
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              onClick={() => onPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <button
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              onClick={() => onPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
