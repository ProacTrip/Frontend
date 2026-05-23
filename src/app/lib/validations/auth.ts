/**
 * Client-side form validation for auth flows.
 *
 * Zod was NOT installed (not in package.json), so these are manual
 * validation functions that mirror the schema rules from the spec:
 *   - auth-login-flow: email format, password required
 *   - auth-register-flow: email format, password ≥8 with complexity,
 *     first_name ≤100, confirmPassword match
 */

// ── Types ───────────────────────────────────────────────

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
}

export interface ForgotPasswordFormValues {
  email: string;
}

// ── Shared regex ────────────────────────────────────────

/** RFC 5322 simplified — good enough for client-side UX */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password complexity: ≥8 chars, at least one uppercase, one lowercase,
 * one digit, and one special character.
 */
const PASSWORD_COMPLEXITY_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// ── Validators ──────────────────────────────────────────

/** Returns a map of field → error message. Empty object = valid. */
export function validateLogin(
  values: LoginFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.email?.trim()) {
    errors.email = 'El email es requerido';
  } else if (!EMAIL_RE.test(values.email)) {
    errors.email = 'Email inválido';
  }

  if (!values.password) {
    errors.password = 'La contraseña es requerida';
  }

  return errors;
}

/** Returns a map of field → error message. Empty object = valid. */
export function validateRegister(
  values: RegisterFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};

  // ── first_name ──
  if (!values.first_name?.trim()) {
    errors.first_name = 'El nombre es requerido';
  } else if (values.first_name.length > 100) {
    errors.first_name = 'El nombre no puede exceder 100 caracteres';
  }

  // ── email ──
  if (!values.email?.trim()) {
    errors.email = 'El email es requerido';
  } else if (!EMAIL_RE.test(values.email)) {
    errors.email = 'Email inválido';
  }

  // ── password ──
  if (!values.password) {
    errors.password = 'La contraseña es requerida';
  } else if (values.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres';
  } else if (!PASSWORD_COMPLEXITY_RE.test(values.password)) {
    errors.password =
      'La contraseña debe incluir mayúscula, minúscula, número y carácter especial';
  }

  // ── confirmPassword ──
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  return errors;
}

/** Returns a map of field → error message. Empty object = valid. */
export function validateForgotPassword(
  values: ForgotPasswordFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.email?.trim()) {
    errors.email = 'El email es requerido';
  } else if (!EMAIL_RE.test(values.email)) {
    errors.email = 'Email inválido';
  }

  return errors;
}

/** Whether the errors record is empty (form is valid). */
export function isValid(errors: Record<string, string>): boolean {
  return Object.keys(errors).length === 0;
}
