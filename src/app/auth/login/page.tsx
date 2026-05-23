"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import GoogleIcon from "@/components/iconos/GoogleIcon";
import Loader from "@/components/ui/Loader";
import { AnimatePresence, motion } from "framer-motion";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  loginUser,
  resendVerification,
  getOAuthUrl,
  getProfile,
  RateLimitError,
  AuthApiError,
} from "@/app/lib/api";
import { fetchAndStoreEnvironment } from "@/app/lib/utils/location";
import { useRateLimit } from "@/hooks/useRateLimit";
import RateLimitBanner from "@/components/ui/RateLimitBanner";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setContext } = useAuthContext();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorAction, setErrorAction] = useState<"verify_email" | "none">(
    "none"
  );
  const [resendSent, setResendSent] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const { isBlocked } = useRateLimit();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError("");
      setErrorAction("none");
      setResendSent(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Completá todos los campos");
      return;
    }
    if (!formData.email.includes("@")) {
      setError("Introducí un email válido");
      return;
    }

    setIsLoading(true);
    setError("");
    setErrorAction("none");

    try {
      const data = await loginUser(formData.email, formData.password);
      if (data.mfa_required) {
        setError("MFA no está disponible aún en el frontend");
        setIsLoading(false);
        return;
      }
      setUser(data.user);
      // NOTE: avatar_url caching removed — AuthUser no longer carries avatar_url.
      // Avatar will be loaded from profile query in PR 3 of fix-auth-frontend-may-2026.
      
      try {
        await getProfile();
      } catch {
        /* non-critical */
      }
      try {
        const env = await fetchAndStoreEnvironment();
        if (env) setContext(env);
      } catch {
        /* non-critical */
      }
      const redirectTo = data.user.role_name === "admin" ? "/admin" : "/";
      setTimeout(() => router.push(redirectTo), 600);
    } catch (err) {
      if (err instanceof RateLimitError) {
        setError(err.message);
        setRateLimitError(err.message);
      } else if (err instanceof AuthApiError) {
        setError(err.message);
        setErrorAction(err.action);
      } else {
        setError("Error al conectar con el servidor. Intentá de nuevo.");
      }
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendSent(false);
    try {
      await resendVerification(formData.email);
      setResendSent(true);
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : "Error al reenviar el correo. Intentá de nuevo."
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const data = await getOAuthUrl("google");
      window.location.href = data.auth_url;
    } catch (err) {
      if (err instanceof RateLimitError) {
        setError(err.message);
        setRateLimitError(err.message);
      } else {
        setError(
          err instanceof AuthApiError
            ? err.message
            : "Error al conectar con el servidor."
        );
      }
    }
  };

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
            <p>{error}</p>
            {errorAction === "verify_email" && !resendSent && (
              <button
                type="button"
                onClick={handleResendVerification}
                className="mt-2 text-neutral-700 font-medium underline hover:no-underline text-xs"
              >
                Reenviar correo de verificación
              </button>
            )}
            {resendSent && (
              <p className="mt-2 text-green-600 text-xs font-medium">
                Correo reenviado. Revisá tu bandeja de entrada.
              </p>
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
          value={formData.email}
          onChange={handleInputChange}
          placeholder="correo@ejemplo.com"
        />

        <div className="space-y-1">
          <InputField
            label="Contraseña"
            name="password"
            type="password"
            id="login-password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            showPasswordToggle
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
          disabled={isLoading || isBlocked}
        >
          Iniciar sesión
        </Button>

        {isLoading && (
          <div className="flex justify-center pt-2">
            <Loader text="Iniciando sesión..." />
          </div>
        )}
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
