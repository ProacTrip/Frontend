"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import GoogleIcon from "@/components/iconos/GoogleIcon";
import { AnimatePresence, motion } from "framer-motion";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { useRegisterMutation } from "@/hooks/useRegisterMutation";
import { validateRegisterField, isValid } from "@/app/lib/validations/auth";
import { getOAuthUrl, AuthApiError } from "@/app/lib/api";
import { useRateLimit } from "@/hooks/useRateLimit";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import PasswordStrengthBar from "@/components/ui/PasswordStrengthBar";
import { getAuthErrorMessage, extractFieldErrors } from "@/app/lib/utils/auth-errors";

export default function RegisterPage() {

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const registerMutation = useRegisterMutation();
  const { isBlocked } = useRateLimit();

  // ── Validation ─────────────────────────────────────────────────────

  function validate(): boolean {
    const errors: Record<string, string | undefined> = {};
    const nameErr = validateRegisterField("first_name", formData.first_name);
    const emailErr = validateRegisterField("email", formData.email);
    const passErr = validateRegisterField("password", formData.password);
    const confirmErr = validateRegisterField(
      "confirmPassword",
      formData.confirmPassword,
      formData.password,
    );
    if (nameErr) errors.first_name = nameErr;
    if (emailErr) errors.email = emailErr;
    if (passErr) errors.password = passErr;
    if (confirmErr) errors.confirmPassword = confirmErr;
    setFieldErrors(errors);
    return isValid(errors);
  }

  // ── Submit ─────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setRateLimitError(null);
    if (!validate()) return;

    registerMutation.mutate(
      {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name.trim(),
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            first_name: "",
          });
          setFieldErrors({});
        },
        onError: (err: unknown) => {
          const code =
            err instanceof AuthApiError ? err.code : undefined;

          if (code === "RATE_LIMIT_EXCEEDED") {
            setRateLimitError(
              err instanceof AuthApiError
                ? err.message
                : "Demasiadas peticiones. Intentá más tarde.",
            );
            return;
          }

          // Extract server-side field errors (RFC 9457)
          const serverFieldErrs = extractFieldErrors(
            err instanceof AuthApiError ? err : err,
          );
          if (Object.keys(serverFieldErrs).length > 0) {
            setFieldErrors((prev) => {
              const merged = { ...prev };
              for (const key of Object.keys(serverFieldErrs)) {
                merged[key] = serverFieldErrs[key];
              }
              return merged;
            });
          }

          setServerError(getAuthErrorMessage(err));
        },
      },
    );
  }

  // ── Field change (clears errors on edit) ───────────────────────────

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError(null);
  }

  // ── Google login ───────────────────────────────────────────────────

  async function handleGoogleLogin() {
    try {
      const data = await getOAuthUrl("google");
      window.location.href = data.auth_url;
    } catch (err) {
      if (err instanceof AuthApiError) {
        if (err.code === "RATE_LIMIT_EXCEEDED") {
          setRateLimitError(err.message);
          return;
        }
        setServerError(err.message);
      } else {
        setServerError("Error al conectar con Google. Intentá de nuevo.");
      }
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  const isPending = registerMutation.isPending;

  return (
    <AuthPageLayout
      title="Crear cuenta"
      subtitle="Registrate para empezar"
      variant="split"
      sideTitle="Comenzá tu aventura,"
      sideSubtitle="registrate hoy"
    >
      <RateLimitBanner
        rateLimitError={rateLimitError}
        onRetryReady={() => {
          setRateLimitError(null);
          setServerError(null);
        }}
      />

      {/* ── Server error banner ── */}
      <AnimatePresence>
        {serverError && !isBlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            aria-live="assertive"
            className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
          >
            {serverError}
          </motion.div>
        )}

        {/* ── Success banner ── */}
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="status"
            aria-live="polite"
            className="mb-5 p-3.5 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm"
          >
            ¡Cuenta creada!{" "}
            <Link
              href="/auth/login?registered=true"
              className="font-semibold underline hover:no-underline"
            >
              Iniciá sesión
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Formulario de registro"
        className="space-y-4"
      >
        <InputField
          label="Nombre"
          name="first_name"
          type="text"
          id="reg-name"
          value={formData.first_name}
          onChange={handleInputChange}
          placeholder="Tu nombre"
          error={fieldErrors.first_name}
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          id="reg-email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="correo@ejemplo.com"
          error={fieldErrors.email}
        />
        <div>
          <InputField
            label="Contraseña"
            name="password"
            type="password"
            id="reg-password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            showPasswordToggle
            error={fieldErrors.password}
          />
          {formData.password.length > 0 && (
            <PasswordStrengthBar password={formData.password} />
          )}
        </div>
        <InputField
          label="Confirmar contraseña"
          name="confirmPassword"
          type="password"
          id="reg-confirm"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="••••••••"
          showPasswordToggle
          error={fieldErrors.confirmPassword}
        />

        <Button
          type="submit"
          variant="primary"
          className="!py-3.5 mt-2"
          isLoading={isPending}
          disabled={isBlocked}
        >
          Crear cuenta
        </Button>
      </form>

      <div className="relative my-5" aria-hidden="true">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-neutral-400">o</span>
        </div>
      </div>

      <Button variant="google" onClick={handleGoogleLogin}>
        <GoogleIcon />
        Continuar con Google
      </Button>

      <p className="mt-8 text-center text-sm text-neutral-500">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/auth/login"
          className="text-neutral-900 font-semibold hover:underline"
        >
          Iniciá sesión
        </Link>
      </p>
    </AuthPageLayout>
  );
}
