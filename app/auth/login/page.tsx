'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import Divider from '@/components/ui/Divider';
import GoogleIcon from '@/components/iconos/GoogleIcon';
import Loader from '@/components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import AuthPageLayout from '@/components/layout/AuthPageLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { loginUser, resendVerification, getOAuthUrl, RateLimitError, AuthApiError } from '@/app/lib/api';
import { fetchAndStoreEnvironment } from '@/app/lib/utils/location';
import { USER_AVATAR_CACHE_KEY } from '@/app/lib/constants/avatars';
import { useRateLimit } from '@/hooks/useRateLimit';
import RateLimitBanner from '@/components/ui/RateLimitBanner';


export default function LoginPage() {
  const router = useRouter();
  const { setUser, setContext } = useAuthContext();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorAction, setErrorAction] = useState<'verify_email' | 'none'>('none');
  const [resendSent, setResendSent] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const { isBlocked } = useRateLimit();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(previo => ({
      ...previo,
      [name]: value
    }));
    if (error) { setError(''); setErrorAction('none'); setResendSent(false); }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('Por favor, introduce un email válido');
      return;
    }

    setIsLoading(true);
    setError('');
    setErrorAction('none');

    try {
      const data = await loginUser(formData.email, formData.password);

      if (data.mfa_required) {
        // TODO: Redirigir a página de MFA cuando esté implementada
        setError('MFA no está implementado aún en el frontend');
        setIsLoading(false);
        return;
      }

      setUser(data.user);

      // Persist avatar_url for Navbar (it reads from localStorage)
      if (data.user.avatar_url) {
        localStorage.setItem(USER_AVATAR_CACHE_KEY, data.user.avatar_url);
      }

      // El backend NO devuelve environment en login.
      // Cargamos el environment por separado vía GET /v1/environment (con cache de 10 min).
      try {
        const env = await fetchAndStoreEnvironment();
        if (env) setContext(env);
      } catch {
        // Environment no crítico — no bloqueamos el login si falla
      }

      const redirectTo = data.user.role_name === 'admin' ? '/admin' : '/home';
      setTimeout(() => {
        router.push(redirectTo);
      }, 800);
    } catch (err) {
      if (err instanceof RateLimitError) {
        setError(err.message);
        setRateLimitError(err.message);
      } else if (err instanceof AuthApiError) {
        setError(err.message);
        setErrorAction(err.action);
      } else {
        console.error('Error en login:', err);
        setError('Error al conectar con el servidor. Intenta de nuevo.');
      }
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendSent(false);
    try {
      await resendVerification(formData.email);
      setResendSent(true);
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError('Error al reenviar el correo. Intenta de nuevo.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const data = await getOAuthUrl('google');
      window.location.href = data.auth_url;
    } catch (err) {
      if (err instanceof RateLimitError) {
        setError(err.message);
        setRateLimitError(err.message);
      } else if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError('Error al conectar con el servidor. Intenta de nuevo.');
      }
    }
  };

  return (
    <AuthPageLayout
      title="Bienvenido"
      subtitle="Inicia sesión para continuar"
      variant="split"
      sideTitle="Tu viaje no se detiene,"
      sideSubtitle="nosotros tampoco"
    >
      <RateLimitBanner
        rateLimitError={rateLimitError}
        onRetryReady={() => {
          setRateLimitError(null);
          setError('');
        }}
      />

      <AnimatePresence>
        {error && !isBlocked && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 text-sm"
          >
            <p>{error}</p>
            {errorAction === 'verify_email' && !resendSent && (
              <button
                type="button"
                onClick={handleResendVerification}
                className="mt-2 text-[#8d6e63] font-medium underline hover:no-underline text-xs"
              >
                Reenviar correo de verificación
              </button>
            )}
            {resendSent && (
              <p className="mt-2 text-green-600 text-xs font-medium">
                Correo reenviado. Revisa tu bandeja de entrada.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <InputField
            label="Email"
            name="email"
            type="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="correo@ejemplo.com"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-1"
        >
          <InputField
            label="Contraseña"
            name="password"
            type="password"
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            showPasswordToggle
          />
          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-sm text-[#8d6e63] hover:underline font-medium">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </motion.div>
        <motion.div
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={isLoading || isBlocked}>
            Iniciar Sesión
          </Button>
        </motion.div>
        {isLoading && (
          <div className="mt-4 flex justify-center">
            <Loader text="Iniciando sesión..." />
          </div>
        )}

      </form>
      <Divider text="OR" />

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button variant="google" onClick={handleGoogleLogin}>
          <GoogleIcon />
          Google
        </Button>
      </motion.div>
      <p className="mt-8 text-center text-gray-600">
        ¿No tienes cuenta?{' '}
        <Link href="/auth/register" className="text-[#8d6e63] font-bold hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </AuthPageLayout>
  );
}
