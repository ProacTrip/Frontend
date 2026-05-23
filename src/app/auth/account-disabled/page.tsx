"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthPageLayout from "@/components/layout/AuthPageLayout";
import Button from "@/components/ui/Button";
import { useAuthContext } from "@/contexts/AuthContext";

export default function AccountDisabledPage() {
  const router = useRouter();
  const { logout } = useAuthContext();

  useEffect(() => {
    try {
      sessionStorage.removeItem("user_session");
      sessionStorage.removeItem("session_saved_at");
      localStorage.removeItem("user_environment");
      localStorage.removeItem("user_environment_stored_at");
      localStorage.removeItem("user_currency_preference");
    } catch {
      /* private browsing mode may fail */
    }
  }, []);

  const handleBackHome = () => router.push("/");

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AuthPageLayout
      title="Cuenta deshabilitada"
      subtitle="Tu cuenta ha sido deshabilitada por un administrador."
      variant="card"
    >
      <div className="space-y-5">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-amber-800 text-sm leading-relaxed">
            Si creés que esto es un error, contactá al administrador del sistema
            para que revise el estado de tu cuenta.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button variant="primary" className="w-full" onClick={handleBackHome}>
            Volver al inicio
          </Button>
          <button
            onClick={handleLogout}
            className="w-full text-neutral-400 hover:text-neutral-600 text-sm font-medium transition-colors py-2 cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </AuthPageLayout>
  );
}
