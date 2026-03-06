import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { validateResetConfirmPassword, validateResetPassword } from '../shared/utils/validation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const passwordErrors = useMemo(() => (submitted ? validateResetPassword(password) : []), [password, submitted]);

  const confirmError = useMemo(() => {
    if (!submitted) return '';
    return validateResetConfirmPassword(password, confirmPassword);
  }, [confirmPassword, password, submitted]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (passwordErrors.length || confirmError) {
      return;
    }

    setShowSuccess(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onSubmit={onSubmit}>
        <h1 className="mb-6 text-2xl font-semibold text-slate-800">Reset Password</h1>

        <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
        />
        {passwordErrors.map((error) => (
          <p key={error} className="text-sm text-red-600">
            {error}
          </p>
        ))}

        <label className="mb-2 mt-4 block text-sm font-medium text-slate-700">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mb-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
        />
        {confirmError && <p className="text-sm text-red-600">{confirmError}</p>}

        <button type="submit" className="mt-6 w-full rounded-lg bg-[#28335b] px-4 py-2 text-white hover:bg-[#1f2747]">
          Reset Password
        </button>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </form>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-800">Password Reset</h2>
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
