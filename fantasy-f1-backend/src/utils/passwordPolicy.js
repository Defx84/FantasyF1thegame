const PASSWORD_MIN_LENGTH = 6;

const PASSWORD_RULE_MESSAGE =
  'Password must be at least 6 characters and include one capital letter, one number, and one special character';

function isValidNewPassword(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }

  const hasCapitalLetter = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

  return hasCapitalLetter && hasNumber && hasSpecialCharacter;
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULE_MESSAGE,
  isValidNewPassword
};
