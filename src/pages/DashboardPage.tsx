import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchSlidesThunk } from '../features/slides/slidesSlice';
import { fetchUserDataThunk } from '../features/auth/authSlice';
// import { logoutThunk } from '../features/auth/authSlice';


const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items, page, totalPages, status } = useAppSelector((state) => state.slides);
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchSlidesThunk({ page: 1 }));
  }, [dispatch]);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchUserDataThunk());
    }
  }, [dispatch, token, user]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    dispatch(fetchSlidesThunk({ page: 1, name: search.trim() || undefined }));
  };

  const onPage = (nextPage: number) => {
    dispatch(fetchSlidesThunk({ page: nextPage, name: search.trim() || undefined }));
  };

  const avatarLabel = (user?.name || user?.email || 'User').toString();
  const avatarInitial = avatarLabel.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-[32px] font-bold text-[#28335B]">Slides</h1>
          <div className="flex items-center gap-3 rounded-full bg-white px-2 py-1 shadow-sm">
            {user?.avatar ? (
              <img src={user.avatar} alt={avatarLabel} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#28335B] text-sm font-bold text-white">
                {avatarInitial}
              </div>
            )}
            <div className="pr-2">
              <p className="text-sm font-semibold text-[#28335B]">{(user?.name || 'Designer').toString()}</p>
              <p className="text-xs text-slate-500">{(user?.email || '').toString()}</p>
            </div>
          </div>
        </div>

      
        <form onSubmit={onSearch} className="mb-10 rounded-2xl bg-[#F2F2F2] p-10 flex gap-6 items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by slide name"
            className="flex-1 rounded-lg border-none px-4 py-3 text-gray-700 shadow-sm focus:ring-2 focus:ring-[#DCA126]"
          />
          <button className="rounded-lg bg-[#DCA126] px-16 py-3 font-semibold text-white transition-hover hover:bg-[#c58f21]">
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          
          <table className="w-full border-separate border-spacing-x-4 border-spacing-y-3 text-left">
            <thead>
              <tr className="text-white">
                <th className="bg-[#28335B] rounded-lg px-6 py-3 font-semibold text-[18px]">slide Name</th>
                <th className="bg-[#28335B] rounded-lg px-6 py-3 font-semibold text-[18px]">type</th>
                <th className="bg-[#28335B] rounded-lg px-6 py-3 font-semibold text-[18px]">Status</th>
                <th className="bg-[#28335B] rounded-lg px-6 py-3 font-semibold text-[18px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((slide) => (
                <tr
                  key={slide.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/slides/${slide.id}`)}
                >
                
                  <td className="bg-[#F1F1F1] rounded-lg px-6 py-4 text-[#7E7E7E] text-[16px] group-hover:bg-gray-200 transition-colors">
                    {slide.slideName}
                  </td>
                  <td className="bg-[#F1F1F1] rounded-lg px-6 py-4 text-[#7E7E7E] text-[16px] group-hover:bg-gray-200 transition-colors">
                    {slide.type}
                  </td>
                  <td className="bg-[#F1F1F1] rounded-lg px-6 py-4 text-[#7E7E7E] text-[16px] group-hover:bg-gray-200 transition-colors">
                    {slide.status}
                  </td>
                  <td className="bg-[#F1F1F1] rounded-lg px-6 py-4 text-center group-hover:bg-gray-200 transition-colors">
                    <div className="flex justify-center">
                      <EditIcon />
                    </div>
                  </td>
                </tr>
              ))}
              
              {(!items || items.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-gray-400 text-lg">
                    {status === 'loading' ? 'Loading slides...' : 'No slides found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        <div className="mt-8 flex items-center justify-end gap-2">
           <button 
             className="px-4 py-2 bg-[#E2E8F0] rounded text-[#28335B] disabled:opacity-50 cursor-pointer"
             onClick={() => onPage(Math.max(1, page - 1))}
             disabled={page <= 1}
           >
             Previous
           </button>
           
           {[...Array(totalPages)].map((_, i) => (
             <button
               key={i}
               onClick={() => onPage(i + 1)}
               className={`w-10 h-10 rounded flex items-center justify-center font-bold ${
                 page === i + 1 ? 'bg-[#28335B] text-white' : 'bg-[#E2E8F0] text-gray-600'
               }`}
             >
               {i + 1}
             </button>
           ))}

           <button 
             className="px-4 py-2 bg-[#E2E8F0] rounded text-[#28335B] disabled:opacity-50 cursor-pointer"
             onClick={() => onPage(Math.min(totalPages, page + 1))}
             disabled={page >= totalPages}
           >
             Next
           </button>
        </div>
      </div>
    </div>
  );
}
