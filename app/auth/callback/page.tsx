'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * OAuth callback page (cookie-based auth v2).
 * El backend ya estableció las cookies vía Set-Cookie durante el callback de Google.
 * Esta página solo verifica que la sesión quedó activa y redirige.
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuthContext();
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/current-user`, {
          credentials: 'include',
        });

        if (!response.ok) {
          setError('No se pudo verificar la sesión con Google');
          setStatus('error');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        const data = await response.json();
        console.log('✅ Google login exitoso:', data.user.email);

        await refreshUser();

        setStatus('success');
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      } catch (err) {
        console.error('❌ Error procesando callback:', err);
        setError('Error al procesar la autenticación');
        setStatus('error');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    processCallback();
  }, [router, refreshUser]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md"
        >
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error de autenticación
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirigiendo al login...</p>
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
          <div className="text-6xl mb-6">✅</div>
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
        <div className="text-6xl mb-6">🔐</div>
        <div className="mb-6">
          <Loader text="Completando autenticación con Google..." />
        </div>
        <p className="text-gray-600 text-sm">Iniciando tu sesión...</p>
      </motion.div>
    </div>
  );
}
