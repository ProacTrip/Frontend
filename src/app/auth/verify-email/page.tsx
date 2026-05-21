"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { useAuthContext } from "@/contexts/AuthContext";
import { verifyEmail, getProfile, AuthApiError, RateLimitError } from "@/app/lib/api";
import { fetchAndStoreEnvironment } from "@/app/lib/utils/location";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { setUser, setContext } = useAuthContext();

  const initialStatus: "loading" | "success" | "error" = token ? "loading" : "error";
  const [status, setStatus] = useState<"loading" | "success" | "error">(initialStatus);
  const [message, setMessage] = useState(token ? "" : "Token de verificación no encontrado");

  useEffect(() => {
    if (!token) return;

    const verifyEmailToken = async () => {
      try {
        const data = await verifyEmail(token);
        setStatus("success");
        setMessage("Email verificado. Cerra esta pestaña y volvé a la aplicación.");
        if (data.user) setUser(data.user);
        try {
          await getProfile();
        } catch {
          /* non-critical */
        }
        localStorage.setItem("proactrip_email_verified", Date.now().toString());
        try {
          const env = await fetchAndStoreEnvironment();
          if (env) setContext(env);
        } catch {
          /* non-critical */
        }
      } catch (err) {
        setStatus("error");
        if (err instanceof RateLimitError) setMessage(err.message);
        else if (err instanceof AuthApiError) setMessage(err.message);
        else setMessage("Error al verificar el email. Intentá de nuevo.");
      }
    };

    verifyEmailToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthPageLayout
      title={
        status === "loading"
          ? "Verificando tu email"
          : status === "success"
            ? "¡Email verificado!"
            : "Error de verificación"
      }
      subtitle={
        status === "loading" ? "Esto tomará solo un momento..." : ""
      }
      variant="card"
    >
      <div className="text-center space-y-5">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-neutral-400 animate-pulse"
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
            <Loader text="Verificando..." />
          </>
        )}
        {status === "success" && (
          <>
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-neutral-600 text-sm">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-neutral-600 text-sm">{message}</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full px-4 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Ir al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </AuthPageLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader text="Verificando..." />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
