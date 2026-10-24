export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 6 characters and include one capital letter, one number, and one special character';

export function isValidNewPassword(password: string): boolean {
  return (
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
