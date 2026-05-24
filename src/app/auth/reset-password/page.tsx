"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import AuthStatusIcon from "@/components/ui/AuthStatusIcon";
import { AnimatePresence, motion } from "framer-motion";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { resetPassword, AuthApiError, RateLimitError } from "@/app/lib/api";
import { validatePassword } from "@/app/lib/utils/validation";
import { useRateLimit } from "@/hooks/useRateLimit";
import RateLimitBanner from "@/components/ui/RateLimitBanner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const { isBlocked } = useRateLimit();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Completá todos los campos");
      return;
    }
    const check = validatePassword(formData.newPassword);
    if (!check.valid) {
      setError(check.errors[0]);
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!token) {
      setError("Token de recuperación no encontrado. Solicitá un nuevo link.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await resetPassword(token, formData.newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 3000);
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

  if (!token) {
    return (
      <div className="text-center space-y-5">
        <AuthStatusIcon variant="error" />
        <h2 className="text-xl font-semibold text-neutral-800">Link inválido</h2>
        <p className="text-neutral-500 text-sm">
          Este link no es válido o ha expirado. Solicitá uno nuevo.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center justify-center w-full px-4 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Solicitar nuevo link
        </Link>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!success && (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Nueva contraseña"
              name="newPassword"
              type="password"
              id="rp-new"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              showPasswordToggle
            />
            <InputField
              label="Confirmar nueva contraseña"
              name="confirmPassword"
              type="password"
              id="rp-confirm"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              showPasswordToggle
            />
            <Button
              type="submit"
              variant="primary"
              className="!py-3.5 mt-2"
              disabled={isLoading || isBlocked}
            >
              Cambiar contraseña
            </Button>
            {isLoading && (
              <div className="flex justify-center pt-2">
                <Loader text="Cambiando contraseña..." />
              </div>
            )}
          </form>
        </motion.div>
      )}

      {success && (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5"
        >
          <AuthStatusIcon variant="success" />
          <h2 className="text-xl font-semibold text-neutral-800">
            ¡Contraseña cambiada!
          </h2>
          <p className="text-neutral-500 text-sm">
            Tu contraseña se ha restablecido. Redirigiendo al inicio de sesión...
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Ir al inicio de sesión
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageLayout
      title="Nueva contraseña"
      subtitle="Elegí una contraseña segura para tu cuenta."
      variant="card"
      backHref="/auth/login"
    >
      <Suspense
        fallback={
          <div className="flex justify-center">
            <Loader text="Cargando..." />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthPageLayout>
  );
}
