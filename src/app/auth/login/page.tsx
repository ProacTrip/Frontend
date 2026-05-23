"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import GoogleIcon from "@/components/iconos/GoogleIcon";
import { AnimatePresence, motion } from "framer-motion";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { useLoginMutation } from "@/hooks/useLoginMutation";
import { validateLoginField, isValid } from "@/app/lib/validations/auth";
import { getOAuthUrl, AuthApiError } from "@/app/lib/api";
import { useRateLimit } from "@/hooks/useRateLimit";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import { getAuthErrorMessage, extractFieldErrors } from "@/app/lib/utils/auth-errors";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const loginMutation = useLoginMutation();
  const { isBlocked } = useRateLimit();

  // ── Validation ─────────────────────────────────────────────────────

  function validate(): boolean {
    const errors: Record<string, string | undefined> = {};
    const emailErr = validateLoginField("email", email);
    const passErr = validateLoginField("password", password);
    if (emailErr) errors.email = emailErr;
    if (passErr) errors.password = passErr;
    setFieldErrors(errors);
    return isValid(errors);
  }

  // ── Submit ─────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setRateLimitError(null);
    if (!validate()) return;

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          // Hook already handles MFA check + query invalidation.
          // Override the default redirect with returnUrl.
          if ("mfa_required" in data && data.mfa_required) return;
          router.push(returnUrl);
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

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (serverError) setServerError(null);
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
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

  const isPending = loginMutation.isPending;

  return (
    <AuthPageLayout
      title="Bienvenido"
      subtitle="Iniciá sesión para continuar"
      variant="split"
      sideTitle="Tu viaje no se detiene,"
      sideSubtitle="nosotros tampoco"
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
            className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
          >
            <p>{serverError}</p>
            {loginMutation.error instanceof AuthApiError &&
              loginMutation.error.code === "EMAIL_NOT_VERIFIED" && (
                <Link
                  href={`/auth/resend-verification?email=${encodeURIComponent(email)}`}
                  className="mt-2 inline-block text-neutral-700 font-medium underline hover:no-underline text-xs"
                >
                  Reenviar correo de verificación
                </Link>
              )}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          label="Email"
          name="email"
          type="email"
          id="login-email"
          value={email}
          onChange={handleEmailChange}
          placeholder="correo@ejemplo.com"
          error={fieldErrors.email}
        />

        <div className="space-y-1">
          <InputField
            label="Contraseña"
            name="password"
            type="password"
            id="login-password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="••••••••"
            showPasswordToggle
            error={fieldErrors.password}
          />
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="!py-3.5 mt-2"
          isLoading={isPending}
          disabled={isBlocked}
        >
          Iniciar sesión
        </Button>
      </form>

      <div className="relative my-6">
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
        ¿No tenés cuenta?{" "}
        <Link
          href="/auth/register"
          className="text-neutral-900 font-semibold hover:underline"
        >
          Registrate gratis
        </Link>
      </p>
    </AuthPageLayout>
  );
}
