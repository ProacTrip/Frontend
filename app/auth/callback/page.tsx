'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import { getCurrentUser } from '@/app/lib/api/auth';
import { getContext } from '@/app/lib/api/context';

const OAUTH_ERROR_MAP: Record<string, string> = {
  OAUTH_CODE_MISSING: 'Error al procesar la autenticación con Google. Intenta de nuevo.',
  OAUTH_STATE_MISSING: 'Error de seguridad en la autenticación. Intenta de nuevo.',
  OAUTH_STATE_INVALID: 'La sesión de autenticación ha expirado. Intenta de nuevo.',
  OAUTH_ACCESS_DENIED: 'Acceso denegado. Asegúrate de otorgar los permisos necesarios.',
  OAUTH_EXCHANGE_FAILED: 'Error al completar la autenticación. Intenta de nuevo.',
  OAUTH_PROVIDER_NOT_FOUND: 'Proveedor de autenticación no soportado.',
  EMAIL_NOT_VERIFIED: 'El email de tu cuenta de Google no está verificado.',
  ACCOUNT_LOCKED: 'Tu cuenta está bloqueada temporalmente. Intenta de nuevo más tarde.',
  ACCOUNT_SUSPENDED: 'Tu cuenta ha sido suspendida. Contacta al soporte.',
  ACCOUNT_INACTIVE: 'Tu cuenta está inactiva. Contacta al soporte.',
};

/**
 * OAuth callback page (cookie-based auth).
 * 
 * El backend redirige aquí después del flujo OAuth con:
 *   - ?status=success → cookies ya establecidas por el backend vía Set-Cookie
 *   - ?status=error&code=XXX → el código de error para mostrar al usuario
 * 
 * Las cookies __Secure-access_token son HttpOnly — el frontend NO puede leerlas.
 * Para validar la sesión, llamamos a GET /v1/auth/me que usa las cookies automáticamente.
 */
function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setContext } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processCallback = async () => {
      const oauthStatus = searchParams.get('status');
      const errorCode = searchParams.get('code');

      // El backend siempre redirige con ?status=success o ?status=error
      if (oauthStatus === 'error') {
        const message = (errorCode && OAUTH_ERROR_MAP[errorCode])
          ? OAUTH_ERROR_MAP[errorCode]
          : 'Error al autenticar con Google. Intenta de nuevo.';
        setErrorMessage(message);
        setStatus('error');
        setTimeout(() => router.push('/auth/login'), 4000);
        return;
      }

      if (oauthStatus !== 'success') {
        // Sin query params — callback accedido directamente sin flujo OAuth
        setErrorMessage('Acceso directo a esta página no está permitido.');
        setStatus('error');
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      // status=success: las cookies ya fueron establecidas por el backend.
      // Validamos la sesión llamando a GET /v1/auth/me (el navegador envía las cookies automáticamente).
      try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          setErrorMessage('No se pudo verificar la sesión. Las cookies pueden no haberse establecido correctamente.');
          setStatus('error');
          setTimeout(() => router.push('/auth/login'), 4000);
          return;
        }

        setUser(currentUser);

        // Cargar contexto por separado (el backend no lo devuelve en OAuth callback)
        try {
          const ctx = await getContext();
          if (ctx) setContext(ctx);
        } catch {
          // Context no crítico
        }

        setStatus('success');
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      } catch {
        setErrorMessage('Error al verificar la sesión. Intenta de nuevo.');
        setStatus('error');
        setTimeout(() => router.push('/auth/login'), 4000);
      }
    };

    processCallback();
  }, [router, searchParams, setUser, setContext]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md"
        >
          <div className="text-6xl mb-4">&#x274C;</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error de autenticación
          </h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <p className="text-sm text-gray-500">Redirigiendo al inicio de sesión...</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-lg shadow-xl text-center"
        >
          <div className="text-6xl mb-6">&#x2705;</div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            ¡Autenticación exitosa!
          </h2>
          <p className="text-gray-600">Redirigiendo al home...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-lg shadow-xl text-center"
      >
        <div className="text-5xl mb-6">&#x1F510;</div>
        <div className="mb-6">
          <Loader text="Completando autenticación con Google..." />
        </div>
        <p className="text-gray-600 text-sm">Iniciando tu sesión...</p>
      </motion.div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader text="Procesando autenticación..." />
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
