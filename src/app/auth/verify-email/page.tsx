"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import AuthStatusIcon from "@/components/ui/AuthStatusIcon";
import { useVerifyEmailMutation } from "@/hooks/useVerifyEmailMutation";
import { AuthApiError } from "@/app/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const verifyMutation = useVerifyEmailMutation();

  useEffect(() => {
    if (!token) return;
    verifyMutation.mutate({ token });
    // Run once on mount — eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── No token ────────────────────────────────────────────────────────

  if (!token) {
    return (
      <AuthPageLayout
        title="Error de verificación"
        subtitle=""
        variant="card"
      >
        <div className="text-center space-y-5" role="alert" aria-live="assertive">
          <AuthStatusIcon variant="error" />
          <p className="text-neutral-600 text-sm">
            Token de verificación no encontrado.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </AuthPageLayout>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────

  if (verifyMutation.isPending) {
    return (
      <AuthPageLayout
        title="Verificando tu email"
        subtitle="Esto tomará solo un momento..."
        variant="card"
      >
        <div className="text-center space-y-5" aria-busy="true">
          <AuthStatusIcon variant="loading" />
          <Loader text="Verificando..." />
        </div>
      </AuthPageLayout>
    );
  }

  // ── Success ──
  // The mutation hook auto-redirects via router.push('/') on success.
  // Show a brief success message before the redirect kicks in.

  if (verifyMutation.isSuccess) {
    return (
      <AuthPageLayout
        title="¡Email verificado!"
        subtitle="Redirigiendo..."
        variant="card"
      >
        <div className="text-center space-y-5" role="status" aria-live="polite">
          <AuthStatusIcon variant="success" />
          <p className="text-neutral-500 text-sm">Redirigiendo...</p>
        </div>
      </AuthPageLayout>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────

  if (verifyMutation.isError) {
    const err = verifyMutation.error;
    const isExpired =
      err instanceof AuthApiError &&
      (err.code === "TOKEN_EXPIRED" || err.code === "TOKEN_INVALID");

    return (
      <AuthPageLayout
        title="Error de verificación"
        subtitle=""
        variant="card"
      >
        <div className="text-center space-y-5" role="alert" aria-live="assertive">
          <AuthStatusIcon variant="error" />
          <p className="text-neutral-600 text-sm">
            {err instanceof AuthApiError
              ? err.message
              : "Error al verificar el email."}
          </p>
          {isExpired && (
            <Link
              href="/auth/resend-verification"
              className="inline-block text-neutral-700 font-medium underline hover:no-underline text-sm"
            >
              Solicitar un nuevo enlace de verificación
            </Link>
          )}
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </AuthPageLayout>
    );
  }

  // Should not reach here (token exists but mutation hasn't fired yet)
  return null;
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
