import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loginThunk } from '../features/auth/authSlice';
import { validateLoginEmail, validateLoginPassword } from '../shared/utils/validation';

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
    return validateLoginEmail(email);
  }, [email, submitted]);

  const passwordError = useMemo(() => {
    if (!submitted) return '';
    return validateLoginPassword(password);
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
        <h1 className="mb-6 text-[49px] font-semibold text-[#28335b]">Log in</h1>

        <label className="mb-[4px] block text-[23px] font-[400] text-[#28335b] ">Email</label>
        <input
          className="mb-[28px] w-full rounded-lg border border-[#707070] px-3 py-2 outline-none focus:border-[#707070]"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
        />
        {emailError && <p className="mb-3 text-sm text-red-600">{emailError}</p>}

        <label className="mb-[4px] block text-[23px] font-[400] text-[#28335b]">Password</label>
        <input
          className="mb-[28px] w-full rounded-lg border border-[#707070] px-3 py-2 outline-none focus:border-[#707070]"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
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
          <Link to="/reset-password" className="text-[#28335b] hover:underline">
            Forgot Password?
          </Link>
        </div>
      </form>
    </div>
  );
}
