"use client";

import Link from "next/link";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import AuthStatusIcon from "@/components/ui/AuthStatusIcon";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { AuthApiError, RateLimitError } from "@/app/lib/api";
import { validateForgotPassword } from "@/app/lib/validations/auth";
import { useResendVerificationMutation } from "@/hooks/useResendVerificationMutation";
import { useRateLimit } from "@/hooks/useRateLimit";
import RateLimitBanner from "@/components/ui/RateLimitBanner";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const { isBlocked } = useRateLimit();
  const resendVerificationMutation = useResendVerificationMutation();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setError("Introducí tu email");
      return;
    }
    const validation = validateForgotPassword({ email });
    if (!Object.keys(validation).every((k) => !validation[k])) {
      setError(validation.email ?? "Introducí un email válido");
      return;
    }
    setError("");

    resendVerificationMutation.mutate(
      { email },
      {
        onSuccess: () => setSuccess(true),
        onError: (err) => {
          if (err instanceof RateLimitError) {
            setError(err.message);
            setRateLimitError(err.message);
          } else if (err instanceof AuthApiError) {
            setError(err.message);
          } else {
            setError("Error al conectar con el servidor. Intentá de nuevo.");
          }
        },
      },
    );
  };

  return (
    <AuthPageLayout
      title={success ? "¡Email reenviado!" : "Reenviar verificación"}
      subtitle={
        success
          ? `Te enviamos un nuevo email de verificación a ${email}`
          : "Te enviaremos un nuevo link de verificación."
      }
      variant="card"
      backHref="/auth/login"
    >
      {!success && (
        <>
          <RateLimitBanner
            rateLimitError={rateLimitError}
            onRetryReady={() => {
              setRateLimitError(null);
              setError("");
            }}
          />
          <AnimatePresence>
            {error && !isBlocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                role="alert"
                aria-live="assertive"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Email"
              name="email"
              type="email"
              id="rv-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="correo@ejemplo.com"
            />
            <Button
              type="submit"
              variant="primary"
              className="!py-3.5"
              disabled={resendVerificationMutation.isPending || isBlocked}
            >
              Reenviar email de verificación
            </Button>
            {resendVerificationMutation.isPending && (
              <div className="flex justify-center pt-2">
                <Loader text="Reenviando email..." />
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            ¿Ya verificaste tu email?{" "}
            <Link
              href="/auth/login"
              className="text-neutral-900 font-semibold hover:underline"
            >
              Iniciá sesión
            </Link>
          </p>
        </>
      )}

      {success && (
        <div className="text-center space-y-5">
          <AuthStatusIcon variant="success" />
          <div className="space-y-2 pt-2">
            <p className="text-sm text-neutral-500">
              Revisá tu bandeja de entrada y también la carpeta de spam.
            </p>
            <p className="text-xs text-neutral-400">
              El link de verificación expira en 24 horas.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      )}
    </AuthPageLayout>
  );
}
