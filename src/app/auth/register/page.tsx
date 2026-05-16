'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Compass, ArrowRight, Loader2, CheckCircle, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import * as authApi from '@/lib/api/auth';
const errorMessages: Record<string, string> = {
  INVALID_EMAIL: 'El formato del email no es válido',
  INVALID_INPUT: 'Faltan campos requeridos',
  VALIDATION_ERROR: 'Datos de registro inválidos',
  EMAIL_ALREADY_EXISTS: 'Este email ya está registrado. ¿Quieres iniciar sesión?',
};

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifiedExternally, setVerifiedExternally] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }
    if (!password) {
      setError('La contraseña es requerida');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const first = firstName.trim() || undefined;
      await authApi.register(email.trim().toLowerCase(), password, first);
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string; detail?: string };
      const msg = apiErr.code && errorMessages[apiErr.code]
        ? errorMessages[apiErr.code]
        : apiErr.message || 'Error al registrarse';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const data = await authApi.getOAuthUrl('google');
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        setError('Error al conectar con Google');
      }
    } catch {
      setError('Error al conectar con Google. Intenta de nuevo.');
    }
  };

  const router = useRouter();
  const { user, refreshSession } = useAuth();

  // Sync with email verification in other tabs
  useEffect(() => {
    if (!success) return;

    const handleVerified = () => {
      setVerifiedExternally(true);
      setSuccess(false);
      // Try to close this tab (only works if opened by script,
      // but the user wanted this tab to close)
      setTimeout(() => window.close(), 500);
    };

    // 1. Listen for verification signal from other tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'proactrip_email_verified') {
        handleVerified();
      }
    };
    window.addEventListener('storage', onStorage);

    // 2. Poll session state every 5s as fallback
    const interval = setInterval(async () => {
      try {
        await refreshSession();
      } catch {
        // Session not ready yet
      }
    }, 5000);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, [success, refreshSession]);

  // 3. If user becomes verified (polling caught it), close this tab
  useEffect(() => {
    if (success && user?.email_verified) {
      setVerifiedExternally(true);
      setSuccess(false);
      setTimeout(() => window.close(), 500);
    }
  }, [user, success]);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-paper-dim rounded-2xl shadow-lg p-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group mx-auto w-fit">
              <Compass size={22} className="text-coral" />
              <span className="font-black text-lg text-ink font-geist-sans">
                Proac<span className="text-coral">Trip</span>
              </span>
            </Link>
            <div className="w-16 h-16 rounded-full bg-success-container flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h1 suppressHydrationWarning className="text-2xl font-bold text-ink mb-2 font-geist-sans">
              ¡Cuenta creada!
            </h1>
            <p className="text-ink-muted text-sm mb-6">
              Revisa tu email para verificarla.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/auth/login"
                className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white bg-coral hover:bg-coral-hover transition-colors cursor-pointer"
              >
                Ir al login
              </Link>
              <Link
                href="/auth/resend-verification"
                className="text-sm text-ink-muted hover:text-coral transition-colors cursor-pointer"
              >
                ¿No recibiste el email? Reenviar verificación
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (verifiedExternally) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-paper-dim rounded-2xl shadow-lg p-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group mx-auto w-fit">
              <Compass size={22} className="text-coral" />
              <span className="font-black text-lg text-ink font-geist-sans">
                Proac<span className="text-coral">Trip</span>
              </span>
            </Link>
            <div className="w-16 h-16 rounded-full bg-success-container flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h1 suppressHydrationWarning className="text-2xl font-bold text-ink mb-2 font-geist-sans">
              ¡Email verificado!
            </h1>
            <p className="text-ink-muted text-sm">
              Ya podés cerrar esta pestaña.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-paper-dim rounded-2xl shadow-lg overflow-hidden">
          <div className="px-8 pt-8 pb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <Compass size={22} className="text-coral group-hover:rotate-12 transition-transform" />
              <span className="font-black text-lg text-ink font-geist-sans">
                Proac<span className="text-coral">Trip</span>
              </span>
            </Link>
            <h1 suppressHydrationWarning className="text-2xl font-bold text-ink font-geist-sans">Crear cuenta</h1>
            <p className="text-sm text-ink-muted mt-1">Regístrate para empezar tu aventura</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-error-container border border-error/20 text-sm text-error">
                {error}
              </div>
            )}

            <div className="relative">
              <label htmlFor="reg-first-name" className="sr-only">Nombre</label>
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                id="reg-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value.slice(0, 100))}
                placeholder="Nombre (opcional)"
                autoComplete="given-name"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-paper-outline text-sm bg-paper-container text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
              />
            </div>

            <div className="relative">
              <label htmlFor="reg-email" className="sr-only">Email</label>
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-paper-outline text-sm bg-paper-container text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
              />
            </div>

            <div className="relative">
              <label htmlFor="reg-password" className="sr-only">Contraseña</label>
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña (mín. 8 caracteres)"
                required
                autoComplete="new-password"
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-paper-outline text-sm bg-paper-container text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="reg-confirm" className="sr-only">Confirmar contraseña</label>
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                required
                autoComplete="new-password"
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-paper-outline text-sm bg-paper-container text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 bg-coral hover:bg-coral-hover active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Crear cuenta <ArrowRight size={15} /></>}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-paper-outline" />
              <span className="text-xs text-ink-muted font-medium">o continúa con</span>
              <div className="flex-1 h-px bg-paper-outline" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="w-full py-3 rounded-xl font-medium text-sm text-ink bg-paper-container border border-paper-outline flex items-center justify-center gap-2.5 hover:bg-paper transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <g transform="matrix(1,0,0,1,27.009001,-39.238998)">
                  <path fill="#4285F4" d="M-3.264 51.509C-3.264 50.719-3.334 49.969-3.454 49.239L-14.754 49.239V53.749H-8.284C-8.574 55.229-9.424 56.479-10.684 57.329V60.329H-6.824C-4.564 58.239-3.264 55.159-3.264 51.509Z"/>
                  <path fill="#34A853" d="M-14.754 63.239C-11.514 63.239-8.804 62.159-6.824 60.329L-10.684 57.329C-11.764 58.049-13.134 58.489-14.754 58.489C-17.884 58.489-20.534 56.379-21.484 53.529L-25.464 53.529V56.619C-23.494 60.539-19.444 63.239-14.754 63.239Z"/>
                  <path fill="#FBBC05" d="M-21.484 53.529C-21.734 52.809-21.864 52.039-21.864 51.239C-21.864 50.439-21.724 49.669-21.484 48.949V45.859H-25.464C-26.284 47.479-26.754 49.299-26.754 51.239C-26.754 53.179-26.284 54.999-25.464 56.619L-21.484 53.529Z"/>
                  <path fill="#EA4335" d="M-14.754 43.989C-12.984 43.989-11.404 44.599-10.154 45.789L-6.734 42.369C-8.804 40.429-11.514 39.239-14.754 39.239C-19.444 39.239-23.494 41.939-25.464 45.859L-21.484 48.949C-20.534 46.099-17.884 43.989-14.754 43.989Z"/>
                </g>
              </svg>
              Continuar con Google
            </button>
          </form>

          <div className="px-8 pb-7 text-center">
            <p className="text-sm text-ink-muted">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="font-semibold text-coral hover:underline cursor-pointer">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
