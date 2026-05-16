'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import * as authApi from '@/lib/api/auth';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  // Auto-verify on mount
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Token de verificación no encontrado');
      return;
    }

    authApi.verifyEmail(token)
      .then((response) => {
        setStatus('success');
        localStorage.setItem('proactrip_email_verified', Date.now().toString());
        setUser({
          id: response.user.id,
          email: response.user.email,
          email_verified: response.user.email_verified,
          role_name: response.user.role_name,
        });
        setTimeout(() => router.push('/'), 2000);
      })
      .catch((err: unknown) => {
        const apiErr = err as { code?: string; message?: string };
        if (apiErr.code === 'TOKEN_EXPIRED') {
          setError('El token ha expirado. Solicita un nuevo email de verificación.');
        } else if (apiErr.code === 'TOKEN_INVALID') {
          setError('Token inválido. Solicita un nuevo email de verificación.');
        } else {
          setError(apiErr.message || 'Error al verificar el email');
        }
        setStatus('error');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-paper-dim rounded-2xl shadow-lg overflow-hidden p-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <Compass size={22} className="text-coral" />
            <span className="font-black text-lg text-ink font-geist-sans">
              Proac<span className="text-coral">Trip</span>
            </span>
          </Link>

          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 size={40} className="animate-spin text-coral mx-auto mb-4" />
              <h1 suppressHydrationWarning className="text-xl font-bold text-ink mb-2 font-geist-sans">Verificando email...</h1>
              <p className="text-ink-muted text-sm">Un momento por favor</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-container rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-success" />
              </div>
              <h1 suppressHydrationWarning className="text-xl font-bold text-ink mb-2 font-geist-sans">¡Email verificado!</h1>
              <p className="text-ink-muted text-sm mb-6">Tu cuenta ha sido verificada exitosamente. Redirigiendo...</p>
              <Link href="/" className="inline-block px-6 py-3 rounded-xl font-semibold text-sm text-white bg-coral hover:bg-coral-hover transition-colors">
                Ir al inicio
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-error" />
              </div>
              <h1 suppressHydrationWarning className="text-xl font-bold text-ink mb-2 font-geist-sans">Error de verificación</h1>
              <p className="text-ink-muted text-sm mb-6">{error}</p>
              <Link href="/auth/resend-verification" className="inline-block px-6 py-3 rounded-xl font-semibold text-sm text-white bg-coral hover:bg-coral-hover transition-colors">
                Reenviar email
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 size={32} className="animate-spin text-coral" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
