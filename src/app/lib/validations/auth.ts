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

/** Whether the errors record is empty (form is valid). Handles optional-field records. */
export function isValid(errors: Record<string, string | undefined>): boolean {
  return Object.keys(errors).every((key) => !errors[key]);
}

// ── Field-level validators (for real-time per-field feedback) ──

/** Returns error message or null for a single login field. */
export function validateLoginField(
  field: 'email' | 'password',
  value: string,
): string | null {
  if (field === 'email') {
    if (!value?.trim()) return 'El email es requerido';
    if (!EMAIL_RE.test(value)) return 'Email inválido';
    return null;
  }
  if (field === 'password') {
    if (!value) return 'La contraseña es requerida';
    return null;
  }
  return null;
}

/** Returns error message or null for a single register field. */
export function validateRegisterField(
  field: 'email' | 'password' | 'first_name' | 'confirmPassword',
  value: string,
  confirmValue?: string,
): string | null {
  switch (field) {
    case 'email':
      if (!value?.trim()) return 'El email es requerido';
      if (!EMAIL_RE.test(value)) return 'Email inválido';
      return null;
    case 'first_name':
      if (!value?.trim()) return 'El nombre es requerido';
      if (value.length > 100) return 'El nombre no puede exceder 100 caracteres';
      return null;
    case 'password':
      if (!value) return 'La contraseña es requerida';
      if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
      if (!PASSWORD_COMPLEXITY_RE.test(value))
        return 'La contraseña debe incluir mayúscula, minúscula, número y carácter especial';
      return null;
    case 'confirmPassword':
      if (typeof confirmValue === 'string' && value !== confirmValue)
        return 'Las contraseñas no coinciden';
      return null;
    default:
      return null;
  }
}
