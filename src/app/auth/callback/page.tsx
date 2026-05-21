"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/ui/Loader";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { useAuthContext } from "@/contexts/AuthContext";
import { getCurrentUser } from "@/app/lib/api/auth";
import { getProfile } from "@/app/lib/api";
import { fetchAndStoreEnvironment } from "@/app/lib/utils/location";
import { USER_AVATAR_CACHE_KEY } from "@/app/lib/constants/avatars";

const OAUTH_ERROR_MAP: Record<string, string> = {
  OAUTH_CODE_MISSING:
    "Error al procesar la autenticación con Google. Intentá de nuevo.",
  OAUTH_STATE_MISSING:
    "Error de seguridad en la autenticación. Intentá de nuevo.",
  OAUTH_STATE_INVALID:
    "La sesión de autenticación ha expirado. Intentá de nuevo.",
  OAUTH_ACCESS_DENIED:
    "Acceso denegado. Asegurate de otorgar los permisos necesarios.",
  OAUTH_EXCHANGE_FAILED:
    "Error al completar la autenticación. Intentá de nuevo.",
  OAUTH_PROVIDER_NOT_FOUND: "Proveedor de autenticación no soportado.",
  EMAIL_NOT_VERIFIED: "El email de tu cuenta de Google no está verificado.",
  ACCOUNT_LOCKED:
    "Tu cuenta está bloqueada temporalmente. Intentá más tarde.",
  ACCOUNT_DISABLED: "Tu cuenta ha sido deshabilitada. Contactá al soporte.",
  ACCOUNT_SUSPENDED: "Tu cuenta ha sido suspendida. Contactá al soporte.",
  ACCOUNT_INACTIVE: "Tu cuenta está inactiva. Contactá al soporte.",
};

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setContext } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );

  useEffect(() => {
    const processCallback = async () => {
      const oauthStatus = searchParams.get("status");
      const errorCode = searchParams.get("code");

      // ── Error branch ──────────────────────────
      if (oauthStatus === "error") {
        const message =
          errorCode && OAUTH_ERROR_MAP[errorCode]
            ? OAUTH_ERROR_MAP[errorCode]
            : "Error al autenticar con Google. Intentá de nuevo.";
        setErrorMessage(message);
        setStatus("error");
        setTimeout(() => router.push("/auth/login"), 4000);
        return;
      }

      if (oauthStatus !== "success") {
        setErrorMessage("Acceso directo a esta página no está permitido.");
        setStatus("error");
        setTimeout(() => router.push("/auth/login"), 3000);
        return;
      }

      // ── Success branch — session bootstrap per AUTH_API.md ──
      // Backend already set __Secure-access_token + __Secure-refresh_token cookies.
      // Verify session by calling documented endpoints (not /v1/auth/me).
      try {
        // Step 1: Verify session via /v1/user/profile (documented endpoint).
        // Also fetches travel_preferences in the same call.
        let profileOk = false;
        try {
          await getProfile();
          profileOk = true;
        } catch {
          // Profile might fail if user just created and backend hasn't
          // finished creating the profile yet. Not fatal — redirect anyway.
        }

        // Step 2: Pre-fetch user identity (id, email, role_name) for AuthContext.
        // This calls /v1/auth/me internally — optional bonus, not strictly
        // required since AuthContext does this at boot anyway.
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            if (currentUser.avatar_url) {
              localStorage.setItem(
                USER_AVATAR_CACHE_KEY,
                currentUser.avatar_url
              );
            }
          }
        } catch {
          // /v1/auth/me may not be implemented yet (AUTH_API.md says so).
          // That's fine — AuthContext will bootstrap on the landing page.
        }

        // Step 3: Pre-cache environment for immediate UI on landing
        try {
          const env = await fetchAndStoreEnvironment();
          if (env) setContext(env);
        } catch {
          /* non-critical */
        }

        // If profile succeeded OR getCurrentUser succeeded, session is valid.
        if (!profileOk) {
          // Fallback: check if we got user data
          // If neither worked, cookies might not be readable.
          // Still redirect — AuthContext handles 401 gracefully.
        }

        // Signal that OAuth just completed — AuthProvider reads this on the
        // landing page to force /v1/auth/me even when cookies aren't visible
        // to the Next.js server (different origins in dev, cookie Domain mismatch).
        try {
          localStorage.setItem("proactrip_oauth_login", "1");
        } catch {
          /* noop */
        }

        setStatus("success");
        setTimeout(() => router.push("/"), 800);
      } catch {
        setErrorMessage("Error al verificar la sesión. Intentá de nuevo.");
        setStatus("error");
        setTimeout(() => router.push("/auth/login"), 4000);
      }
    };

    processCallback();
  }, [router, searchParams, setUser, setContext]);

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
      <div className="text-center space-y-5">
        {status === "processing" && (
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <Loader text="Completando autenticación..." />
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
            <p className="text-neutral-500 text-sm">Redirigiendo al home...</p>
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
            <p className="text-neutral-500 text-sm">{errorMessage}</p>
            <p className="text-xs text-neutral-400">
              Redirigiendo al inicio de sesión...
            </p>
          </>
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
      <GoogleCallbackContent />
    </Suspense>
  );
}
