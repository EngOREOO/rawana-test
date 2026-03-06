import {
  validateLoginEmail,
  validateLoginPassword,
  validateResetConfirmPassword,
  validateResetPassword,
} from './validation';

describe('validation utils', () => {
  it('validates login email rules', () => {
    expect(validateLoginEmail('')).toBe('Email is required.');
    expect(validateLoginEmail('bad-email')).toBe('Email format is invalid.');
    expect(validateLoginEmail('a@b.com')).toBe('');
  });

  it('validates login password rules', () => {
    expect(validateLoginPassword('')).toBe('Password is required.');
    expect(validateLoginPassword('123')).toBe('Password must be at least 8 characters.');
    expect(validateLoginPassword('Password123')).toBe('');
  });

  it('validates reset password and confirm password rules', () => {
    expect(validateResetPassword('password').length).toBeGreaterThan(0);
    expect(validateResetPassword('Password@123')).toEqual([]);
    expect(validateResetConfirmPassword('Password@123', '')).toBe('Confirmation Password is required.');
    expect(validateResetConfirmPassword('Password@123', 'Password@124')).toBe('Passwords do not match.');
    expect(validateResetConfirmPassword('Password@123', 'Password@123')).toBe('');
  });
});
