import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loginThunk } from '../features/auth/authSlice';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const authError = useAppSelector((state) => state.auth.error);
  const authStatus = useAppSelector((state) => state.auth.status);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emailError = useMemo(() => {
    if (!submitted) return '';
    if (!email) return 'Email is required.';
    if (email.length > 255) return 'Email cannot exceed 255 characters.';
    if (!isValidEmail(email)) return 'Email format is invalid.';
    return '';
  }, [email, submitted]);

  const passwordError = useMemo(() => {
    if (!submitted) return '';
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password.length > 255) return 'Password cannot exceed 255 characters.';
    return '';
  }, [password, submitted]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (emailError || passwordError) {
      return;
    }

    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(result)) {
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onSubmit={onSubmit}>
        <h1 className="mb-6 text-2xl font-semibold text-slate-800">Sign In</h1>

        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input
          className="mb-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        {emailError && <p className="mb-3 text-sm text-red-600">{emailError}</p>}

        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
        <input
          className="mb-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
        {passwordError && <p className="mb-3 text-sm text-red-600">{passwordError}</p>}

        {authError && <p className="mb-4 text-sm text-red-600">{authError}</p>}

        <button
          type="submit"
          disabled={authStatus === 'loading'}
          className="w-full rounded-lg bg-[#28335b] px-4 py-2 text-white transition hover:bg-[#1f2747] disabled:opacity-60"
        >
          {authStatus === 'loading' ? 'Signing in...' : 'Login'}
        </button>

        <div className="mt-4 flex justify-end text-sm">
          <Link to="/reset-password" className="text-blue-600 hover:underline">
            Reset Password
          </Link>
        </div>
      </form>
    </div>
  );
}
