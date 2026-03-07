import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { resetPasswordThunk } from '../features/auth/authSlice';
import { validateLoginEmail } from '../shared/utils/validation';
import { validateResetConfirmPassword, validateResetPassword } from '../shared/utils/validation';

export default function ResetPasswordPage() {
  const dispatch = useAppDispatch();
  const resetStatus = useAppSelector((state) => state.auth.resetStatus);
  const resetError = useAppSelector((state) => state.auth.resetError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const emailError = useMemo(() => (submitted ? validateLoginEmail(email) : ''), [email, submitted]);
  const passwordErrors = useMemo(() => (submitted ? validateResetPassword(password) : []), [password, submitted]);

  const confirmError = useMemo(() => {
    if (!submitted) return '';
    return validateResetConfirmPassword(password, confirmPassword);
  }, [confirmPassword, password, submitted]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (emailError || passwordErrors.length || confirmError) {
      return;
    }

    const result = await dispatch(resetPasswordThunk({ email: email.trim(), password }));
    if (resetPasswordThunk.fulfilled.match(result)) {
      setShowSuccess(true);
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form className="w-full max-w-lg rounded-[60px] border-2 border-[#f2f2f2] bg-white p-6 shadow-xl" onSubmit={onSubmit}>
        <h1 className="mb-6 text-[49px] font-semibold text-[#28335b]">Reset Password</h1>

        <label className="mb-[4px] block text-[23px] font-[400] text-[#28335b]">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mb-2 w-full rounded-lg border border-[#707070] px-3 py-1 outline-none focus:border-[#707070]"
          placeholder="Enter your email"
        />
        {emailError && <p className="text-sm text-red-600">{emailError}</p>}

        <label className="mb-[4px] block text-[23px] font-[400] text-[#28335b]">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mb-2 w-full rounded-lg border border-[#707070] px-3 py-1 outline-none focus:border-[#707070]"
          placeholder="••••••••"
        />
        {passwordErrors.map((error) => (
          <p key={error} className="text-sm text-red-600">
            {error}
          </p>
        ))}

        <label className="mb-[4px] block text-[23px] font-[400] text-[#28335b] mt-8">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mb-1 w-full rounded-lg border border-[#707070] px-3 py-1 outline-none focus:border-[#707070]"
          placeholder="••••••••"
        />
        {confirmError && <p className="text-sm text-red-600">{confirmError}</p>}
        {resetError && <p className="mt-2 text-sm text-red-600">{resetError}</p>}

        <button
          type="submit"
          disabled={resetStatus === 'loading'}
          className="mt-6 w-full rounded-[8px] bg-[#dca126] px-4 py-2 text-white hover:bg-[#dca126] disabled:opacity-60"
        >
          {resetStatus === 'loading' ? 'Updating...' : 'Reset Password'}
        </button>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-[#28335b] hover:underline">
            Back to Login
          </Link>
        </div>
      </form>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-[#28335b]">Password Reset</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your password has been successfully reset.
            </p>
            <button
              className="mt-4 w-full rounded-lg bg-[#28335b] px-3 py-2 text-white"
              onClick={() => setShowSuccess(false)}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
