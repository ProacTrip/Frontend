'use client';

import Image from "next/image";
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import Divider from '@/components/ui/Divider';
import GoogleIcon from '@/components/iconos/GoogleIcon';
import Loader from '@/components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/app/lib/utils/errors';
import type { LoginSuccessResponse, LoginMfaResponse, AuthError } from '@/app/lib/types/auth';


export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuthContext();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorAction, setErrorAction] = useState<'verify_email' | 'none'>('none');
  const [resendSent, setResendSent] = useState(false);

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

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.mfa_required) {
          const mfaData = data as LoginMfaResponse;
          console.log('[Login] MFA requerido, métodos:', mfaData.mfa_methods);
          // TODO: Redirigir a página de MFA cuando esté implementada
          setError('MFA no está implementado aún en el frontend');
          setIsLoading(false);
          return;
        }

        console.log('Login exitoso :D');

        // Refrescamos el contexto de auth para que el Navbar se actualice
        await refreshUser();

        setTimeout(() => {
          router.push('/home');
        }, 800);
      } else {
        const errData = data as AuthError;
        const { message, action } = getErrorMessage(errData, response.status);
        setError(message);
        setErrorAction(action);
        setIsLoading(false);
      }

    } catch (err) {
      console.error('Error en login:', err);
      setError('Error al conectar con el servidor. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendSent(false);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      setResendSent(true);
    } catch {
      setError('Error al reenviar el correo. Intenta de nuevo.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/google`;
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gray-900">
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/loginRegister/background-travel.png"
          alt="Background"
          fill
          className="object-cover brightness-[0.7]"
          priority
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
      >
        <div className="relative w-full md:w-1/2 min-h-[300px] md:min-h-full overflow-hidden">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.6 }} className="relative w-full h-full">
            <Image
              src="/assets/loginRegister/login-side.png"
              alt="Travel"
              fill
              className="object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12 pointer-events-none">
            <motion.h2
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white text-3xl font-bold leading-tight"
            >
              <span className="font-serif">Tu viaje no se detiene,<br />
                <span className="font-light text-white/80">nosotros tampoco</span></span>
            </motion.h2>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Bienvenido</h1>
            <p className="text-gray-500 text-lg">Inicia sesión para continuar</p>
          </motion.div>

          <AnimatePresence>
            {error && (
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
              <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={isLoading}>
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
        </div>
      </motion.div>
    </main>
  );
}
