export function validatePasswordRequirements(password) {
  return {
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-~`[\]\\;'/+=]/.test(password),
    hasMinLength: password.length >= 8,
    notTooLong: password.length <= 256,
  };
}

export function isPasswordValid(req) {
  return req.hasNumber && req.hasUppercase && req.hasLowercase &&
    req.hasSpecial && req.hasMinLength && req.notTooLong;
}
