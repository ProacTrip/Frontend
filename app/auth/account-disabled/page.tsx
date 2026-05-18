'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageLayout from '@/components/layout/AuthPageLayout';
import Button from '@/components/ui/Button';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Página mostrada cuando el backend rechaza al usuario con ACCOUNT_DISABLED (403).
 * Muestra un mensaje claro de "Cuenta deshabilitada" y un botón para volver al inicio.
 *
 * La página también limpia cualquier sesión residual en sessionStorage/localStorage
 * por si la redirección desde AuthContext no alcanzó a ejecutar todos los cleanup.
 */
export default function AccountDisabledPage() {
  const router = useRouter();
  const { logout } = useAuthContext();

  // Limpiar datos de sesión residuales al montar
  useEffect(() => {
    try {
      sessionStorage.removeItem('user_session');
      sessionStorage.removeItem('session_saved_at');
      localStorage.removeItem('user_environment');
      localStorage.removeItem('user_environment_stored_at');
      localStorage.removeItem('user_currency_preference');
      localStorage.removeItem('proactrip_email_verified');
    } catch {
      // En modo privado puede fallar
    }
  }, []);

  const handleBackHome = () => {
    router.push('/home');
  };

  const handleLogout = async () => {
    await logout();
    // logout ya hace window.location.href = '/home'
  };

  return (
    <AuthPageLayout
      title="Cuenta deshabilitada"
      subtitle="Tu cuenta ha sido deshabilitada por un administrador."
      variant="card"
    >
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-amber-800 text-sm leading-relaxed">
            Si crees que esto es un error, por favor contactá al administrador
            del sistema para que revise el estado de tu cuenta.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={handleBackHome}
          >
            Volver al inicio
          </Button>

          <button
            onClick={handleLogout}
            className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors py-2 cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </AuthPageLayout>
  );
}
