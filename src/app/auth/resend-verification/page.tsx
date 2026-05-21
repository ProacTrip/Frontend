"use client";

import Link from "next/link";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { resendVerification, AuthApiError, RateLimitError } from "@/app/lib/api";
import { useRateLimit } from "@/hooks/useRateLimit";
import RateLimitBanner from "@/components/ui/RateLimitBanner";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const { isBlocked } = useRateLimit();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setError("Introducí tu email");
      return;
    }
    if (!email.includes("@")) {
      setError("Introducí un email válido");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await resendVerification(email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof RateLimitError) {
        setError(err.message);
        setRateLimitError(err.message);
      } else if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError("Error al conectar con el servidor. Intentá de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
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
              disabled={isLoading || isBlocked}
            >
              Reenviar email de verificación
            </Button>
            {isLoading && (
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
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
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
