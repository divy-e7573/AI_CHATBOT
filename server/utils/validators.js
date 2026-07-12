// Simple, dependency-free input validators for auth.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export const isValidEmail = (email) =>
  typeof email === "string" && EMAIL_REGEX.test(email.trim());

export const isValidPassword = (password) =>
  typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;

/**
 * Validate signup input. Returns an array of error messages (empty if valid).
 */
export const validateSignup = ({ name, email, password }) => {
  const errors = [];
  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("Name is required.");
  }
  if (!isValidEmail(email)) {
    errors.push("A valid email is required.");
  }
  if (!isValidPassword(password)) {
    errors.push(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    );
  }
  return errors;
};

/**
 * Validate login input. Returns an array of error messages (empty if valid).
 */
export const validateLogin = ({ email, password }) => {
  const errors = [];
  if (!isValidEmail(email)) {
    errors.push("A valid email is required.");
  }
  if (!password || typeof password !== "string") {
    errors.push("Password is required.");
  }
  return errors;
};
