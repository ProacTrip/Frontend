"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import Loader from "@/components/ui/Loader";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { queryKeys } from "@/app/lib/queries/queryKeys";

const OAUTH_ERROR_MAP: Record<string, string> = {
  OAUTH_EXCHANGE_FAILED: "Error al conectar con Google. Intentá de nuevo.",
  OAUTH_ACCESS_DENIED:
    "Acceso denegado. No autorizaste la aplicación.",
  OAUTH_STATE_INVALID: "Error de seguridad. Intentá de nuevo.",
  OAUTH_STATE_MISSING: "Error de seguridad. Intentá de nuevo.",
  OAUTH_CODE_MISSING:
    "Error al procesar la autenticación. Intentá de nuevo.",
  OAUTH_PROVIDER_NOT_FOUND: "Proveedor de autenticación no soportado.",
  EMAIL_NOT_VERIFIED:
    "El email de tu cuenta de Google no está verificado.",
  ACCOUNT_LOCKED:
    "Tu cuenta está bloqueada temporalmente. Intentá más tarde.",
  ACCOUNT_SUSPENDED:
    "Tu cuenta fue suspendida. Contactá a soporte.",
  ACCOUNT_DISABLED:
    "Tu cuenta fue deshabilitada. Contactá a soporte.",
  ACCOUNT_INACTIVE:
    "Tu cuenta está inactiva. Contactá a soporte.",
};

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );

  useEffect(() => {
    const oauthStatus = searchParams.get("status");
    const errorCode = searchParams.get("code");

    // ── Error branch ──────────────────────────────────────────
    if (oauthStatus === "error") {
      const message =
        errorCode && OAUTH_ERROR_MAP[errorCode]
          ? OAUTH_ERROR_MAP[errorCode]
          : "Error al autenticar con Google. Intentá de nuevo.";
      setErrorMessage(message);
      setStatus("error");
      return;
    }

    // ── Invalid access ────────────────────────────────────────
    if (oauthStatus !== "success") {
      setErrorMessage("Acceso directo a esta página no está permitido.");
      setStatus("error");
      return;
    }

    // ── Success branch — session bootstrap via TanStack Query ──
    // Backend already set __Secure-access_token + __Secure-refresh_token cookies.
    // Invalidate profile + environment queries so AuthContext reactively
    // picks up the new session. NO getCurrentUser(), NO localStorage hacks,
    // NO avatar_url caching.
    const bootstrap = async () => {
      try {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.profile.all,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.env.all,
        });
        setStatus("success");
        router.push("/home");
      } catch {
        setErrorMessage("Error al verificar la sesión. Intentá de nuevo.");
        setStatus("error");
      }
    };

    bootstrap();
  }, [searchParams, queryClient, router]);

  return (
    <AuthPageLayout
      title={
        status === "processing"
          ? "Autenticando con Google"
          : status === "success"
            ? "¡Autenticación exitosa!"
            : "Error de autenticación"
      }
      subtitle={
        status === "processing"
          ? "Completando el inicio de sesión..."
          : status === "success"
            ? "Redirigiendo..."
            : ""
      }
      variant="card"
    >
      <div
        className="text-center space-y-5"
        aria-busy={status === "processing" ? true : undefined}
      >
        {/* ── Loading ── */}
        {status === "processing" && (
          <>
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-neutral-400 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <Loader text="Completando autenticación..." />
          </>
        )}

        {/* ── Success ── */}
        {status === "success" && (
          <div role="status" aria-live="polite">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm">Redirigiendo al home...</p>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div role="alert" aria-live="assertive">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm">{errorMessage}</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full px-4 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Intentar de nuevo
            </Link>
          </div>
        )}
      </div>
    </AuthPageLayout>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader text="Procesando autenticación..." />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
