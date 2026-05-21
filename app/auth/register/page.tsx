"use client";

import { useState, type FormEvent, useEffect } from "react";
import Link from "next/link";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import GoogleIcon from "@/components/iconos/GoogleIcon";
import Loader from "@/components/ui/Loader";
import { AnimatePresence, motion } from "framer-motion";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  registerUser,
  getOAuthUrl,
  RateLimitError,
  AuthApiError,
} from "@/app/lib/api";
import { validatePassword } from "@/app/lib/utils/validation";
import { fetchAndStoreEnvironment } from "@/app/lib/utils/location";
import { useRateLimit } from "@/hooks/useRateLimit";
import RateLimitBanner from "@/components/ui/RateLimitBanner";

export default function RegisterPage() {
  const { setUser, setContext } = useAuthContext();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const { isBlocked } = useRateLimit();

  useEffect(() => {
    if (!success) return;
    const STORAGE_KEY = "proactrip_email_verified";
    const redirectToHome = () => {
      window.location.href = "/";
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) redirectToHome();
    };
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(() => {
      if (localStorage.getItem(STORAGE_KEY)) redirectToHome();
    }, 2000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [success]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (name === "password") {
      const result = validatePassword(value);
      setPasswordErrors(result.valid ? [] : result.errors);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.first_name.trim()
    ) {
      setError("Completá todos los campos");
      return;
    }
    if (!formData.email.includes("@")) {
      setError("Introducí un email válido");
      return;
    }
    const validation = validatePassword(formData.password);
    if (!validation.valid) {
      setError(validation.errors.join(". "));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const registerData = await registerUser(
        formData.email,
        formData.password,
        formData.first_name.trim()
      );
      if (registerData.user) setUser(registerData.user);
      try {
        const env = await fetchAndStoreEnvironment();
        if (env) setContext(env);
      } catch {
        /* non-critical */
      }
      setSuccess(true);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "",
      });
      setPasswordErrors([]);
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
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm"
          >
            ¡Cuenta creada! Revisá tu correo para verificar tu cuenta.
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Nombre"
          name="first_name"
          type="text"
          id="reg-name"
          value={formData.first_name}
          onChange={handleInputChange}
          placeholder="Tu nombre"
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          id="reg-email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="correo@ejemplo.com"
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
          />
          {passwordErrors.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-red-500">
              {[
                {
                  met: formData.password.length >= 8,
                  text: "Mínimo 8 caracteres",
                },
                {
                  met: /[A-Z]/.test(formData.password),
                  text: "Al menos una mayúscula",
                },
                {
                  met: /[a-z]/.test(formData.password),
                  text: "Al menos una minúscula",
                },
                {
                  met: /[0-9]/.test(formData.password),
                  text: "Al menos un dígito",
                },
                {
                  met: /[!@#$%^&*]/.test(formData.password),
                  text: "Al menos un carácter especial (!@#$%^&*)",
                },
              ].map((req, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className={req.met ? "text-green-500" : "text-red-400"}>
                    {req.met ? "✓" : "✗"}
                  </span>
                  {req.text}
                </li>
              ))}
            </ul>
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
        />

        <Button
          type="submit"
          variant="primary"
          className="!py-3.5 mt-2"
          disabled={isLoading || isBlocked}
        >
          Crear cuenta
        </Button>

        {isLoading && (
          <div className="flex justify-center pt-2">
            <Loader text="Creando cuenta..." />
          </div>
        )}
      </form>

      <div className="relative my-5">
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
