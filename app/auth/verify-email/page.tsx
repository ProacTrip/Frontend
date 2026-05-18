'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Loader from '@/components/ui/Loader';
import AuthPageLayout from '@/components/layout/AuthPageLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { verifyEmail, AuthApiError, RateLimitError } from '@/app/lib/api';
import { fetchAndStoreEnvironment } from '@/app/lib/utils/location';

function VerifyEmailContent() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { setUser, setContext } = useAuthContext();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    const verifyEmailToken = async () => {
      try {
        const data = await verifyEmail(token);

        setStatus('success');
        setMessage('Email verificado. Ya podés cerrar esta pestaña y volver a la aplicación.');

        if (data.user) {
          setUser(data.user);
        }

        // Señal cross-tab: notificar a la pestaña del registro que el email fue verificado
        localStorage.setItem('proactrip_email_verified', Date.now().toString());

        // Cargamos environment para consistencia de sessionStorage.
        try {
          const env = await fetchAndStoreEnvironment();
          if (env) setContext(env);
        } catch {
          // Environment no crítico
        }

        // NO redirigir — esta pestaña se abrió desde el email.
      } catch (err) {
        console.error('Error verificando email:', err);
        setStatus('error');
        if (err instanceof RateLimitError) {
          setMessage(err.message);
        } else if (err instanceof AuthApiError) {
          setMessage(err.message);
        } else {
          setMessage('Error al verificar el email. Intenta de nuevo.');
        }
      }
    };

    verifyEmailToken();
  }, [token, router, setUser, setContext]);

  return (
    <AuthPageLayout title="Verificando tu email" subtitle={status === 'loading' ? 'Esto tomará solo un momento...' : ''} variant="card">
      {status === 'loading' && (
        <>
          <div className="text-6xl mb-6">📧</div>
          <Loader text="Verificando..." />
        </>
      )}

      {status === 'success' && (
        <>
          <div className="text-6xl mb-6">✅</div>
          <p className="text-gray-600 mb-6">{message}</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="text-6xl mb-6">❌</div>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link href="/auth/login">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Ir al inicio de sesión
            </motion.button>
          </Link>
        </>
      )}
    </AuthPageLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader text="Verificando..." />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
