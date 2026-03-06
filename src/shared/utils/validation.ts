const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export const validateLoginEmail = (email: string): string => {
  if (!email) return 'Email is required.';
  if (email.length > 255) return 'Email cannot exceed 255 characters.';
  if (!EMAIL_REGEX.test(email)) return 'Email format is invalid.';
  return '';
};

export const validateLoginPassword = (password: string): string => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 255) return 'Password cannot exceed 255 characters.';
  return '';
};

export const validateResetPassword = (password: string): string[] => {
  const errors: string[] = [];
  if (!password) errors.push('Password is required.');
  if (password && password.length < 8) errors.push('Password must be at least 8 characters long.');
  if (password.length > 64) errors.push('Password cannot exceed 64 characters.');
  if (password && !/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter.');
  if (password && !/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter.');
  if (password && !/[0-9]/.test(password)) errors.push('Password must contain at least one number.');
  if (password && !SPECIAL_CHAR_REGEX.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  return errors;
};

export const validateResetConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) return 'Confirmation Password is required.';
  if (confirmPassword !== password) return 'Passwords do not match.';
  return '';
};
