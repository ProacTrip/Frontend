'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Loader from '@/components/ui/Loader';
import { useAuthContext } from '@/contexts/AuthContext';

function VerifyEmailContent() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { setUser, setContext, refreshUser } = useAuthContext();
  const refreshUserRef = useRef(refreshUser);
  refreshUserRef.current = refreshUser;
  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;
  const setContextRef = useRef(setContext);
  setContextRef.current = setContext;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/verify-email`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Email verificado exitosamente. Redirigiendo...');
          
          if (data.user) {
            setUserRef.current(data.user);
          }
          if (data.context) {
            setContextRef.current(data.context);
            localStorage.setItem('user_context', JSON.stringify(data.context));
            localStorage.setItem('user_location', JSON.stringify({
              currency: data.context.location.currency,
              gl: data.context.location.country_code,
              hl: data.context.location.language,
              timezone: data.context.location.timezone,
              country: data.context.location.country,
              city: data.context.location.city,
            }));
          } else {
            await refreshUserRef.current();
          }

          setTimeout(() => {
            router.push('/home');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.detail || data.title || 'Token inválido o expirado');
        }
      } catch (err) {
        console.error('Error verificando email:', err);
        setStatus('error');
        setMessage('Error al verificar el email. Intenta de nuevo.');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gray-900">
      
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/loginRegister/background-travel.png"
          alt="Background"
          fill
          sizes="100vw"
          className="object-cover brightness-[0.7]"
          priority
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center"
      >
        {status === 'loading' && (
          <>
            <div className="text-6xl mb-6">📧</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Verificando tu email</h2>
            <Loader text="Verificando..." />
            <p className="text-gray-500 text-sm mt-4">Esto tomará solo un momento...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">¡Email verificado!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.8 }}
              className="h-1 bg-green-500 rounded-full mx-auto"
            />
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error de verificación</h2>
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
      </motion.div>
    </main>
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
