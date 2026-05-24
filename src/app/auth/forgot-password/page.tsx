"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import AuthStatusIcon from "@/components/ui/AuthStatusIcon";
import { AnimatePresence, motion } from "framer-motion";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { AuthApiError, RateLimitError } from "@/app/lib/api";
import { validateForgotPassword } from "@/app/lib/validations/auth";
import { useForgotPasswordMutation } from "@/hooks/useForgotPasswordMutation";
import { useRateLimit } from "@/hooks/useRateLimit";
import RateLimitBanner from "@/components/ui/RateLimitBanner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const { isBlocked } = useRateLimit();
  const forgotPasswordMutation = useForgotPasswordMutation();

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

    forgotPasswordMutation.mutate(
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
      title={success ? "¡Email enviado!" : "¿Olvidaste tu contraseña?"}
      subtitle={
        success
          ? "Si el email está registrado, recibirás un link para recuperar tu contraseña."
          : "Te enviaremos un link para restablecerla."
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
              id="fp-email"
              type="email"
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
              disabled={forgotPasswordMutation.isPending || isBlocked}
            >
              Enviar link de recuperación
            </Button>
            {forgotPasswordMutation.isPending && (
              <div className="flex justify-center pt-2">
                <Loader text="Enviando email..." />
              </div>
            )}
          </form>
        </>
      )}

      {success && (
        <div className="text-center space-y-5">
          <AuthStatusIcon variant="success" />
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
