'use client'; 

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import AuthPageLayout from '@/components/layout/AuthPageLayout';
import { resetPassword, AuthApiError, RateLimitError } from '@/app/lib/api';
import { validatePassword } from '@/app/lib/utils/validation';
import { useRateLimit } from '@/hooks/useRateLimit';
import RateLimitBanner from '@/components/ui/RateLimitBanner';

function ResetPasswordForm() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  //estados
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const { isBlocked } = useRateLimit();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(previo => ({ ...previo, [name]: value }));
    if (error) setError('');
  };

  //funcion cuando el usuario envia el formulario
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmPassword) 
    {
      setError('Por favor, completa todos los campos');
      return; 
    }
    const passwordCheck = validatePassword(formData.newPassword);
    if (!passwordCheck.valid) 
    {
      setError(passwordCheck.errors[0]);
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) 
    {
      setError('Las contraseñas no coinciden');
      return;
    }
    //Si no existe token en la URL, no podemos hacer reset
    if (!token) 
    {
      setError('Token de recuperación no encontrado. Solicita un nuevo link.');
      return;
    }
    setIsLoading(true);
    setError('');

    //peticion al backend para cambiar contraseña
    try 
    {
      await resetPassword(token, formData.newPassword);
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } 
    catch (err) 
    {
      if (err instanceof RateLimitError) {
        setError(err.message);
        setRateLimitError(err.message);
      } else if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        console.error('Error en reset password:', err);
        setError('Error al conectar con el servidor. Intenta de nuevo.');
      }
    } 
    finally 
    {
      //Esto se ejecuta SIEMPRE (haya error o no)
      setIsLoading(false);
      //Quitamos el loader
    }
  };

  //si no tiene token la url, mostramos directamente error
  if (!token) 
    {
        return (
        <div className="text-center space-y-6">

            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-800">
                Link inválido
            </h1>
            <p className="text-gray-600">
                Este link no es válido o ha expirado. Solicita uno nuevo.
            </p>
            <Link
            href="/auth/forgot-password"
            className="inline-block w-full px-6 py-3 bg-[#8d6e63] text-white rounded-lg hover:bg-[#795548] transition-colors text-center"
            >
                Solicitar nuevo link
            </Link>
        </div>
        );
    }

    //esto ocurrira si tiene token
  return (
    <AnimatePresence mode="wait">

            {/*Si no se reseteo la contraseña*/}
        {!success && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                        {error}
                    </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    >
                        <InputField
                            label="Nueva Contraseña"
                            name="newPassword"
                            type="password"
                            id="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            showPasswordToggle
                        />
                    </motion.div>

                    <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    >
                        <InputField
                            label="Confirmar Nueva Contraseña"
                            name="confirmPassword"
                            type="password"
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            showPasswordToggle
                        />
                    </motion.div>

                    <motion.div
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    >
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-4 text-lg"
                            disabled={isLoading || isBlocked}
                        >
                            Cambiar Contraseña
                        </Button>
                    </motion.div>

                    {isLoading && (
                        <div className="mt-4 flex justify-center">
                            <Loader text="Cambiando contraseña..." />
                        </div>
                    )}
                </form>
            </motion.div>
        )}

        {/*Si se reseteo la contraseña*/}
        {success && (
            <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
            >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    {/* ICONO VERDE */}
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-800">
                    ¡Contraseña cambiada!
                </h1>
                <p className="text-gray-600">
                    Tu contraseña se ha restablecido correctamente. Redirigiendo al login...
                </p>
                <p className="text-sm text-gray-500">
                    Redirigiendo en 3 segundos...
                </p>
                <Link
                    href="/auth/login"
                    className="inline-block w-full px-6 py-3 bg-[#8d6e63] text-white rounded-lg hover:bg-[#795548] transition-colors text-center"
                >
                    Ir al Login
                </Link>
            </motion.div>
        )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageLayout
      title="Nueva contraseña"
      subtitle="Introduce tu nueva contraseña. Debe tener al menos 6 caracteres."
      variant="card"
      backHref="/auth/login"
    >
      <Suspense
        fallback={
          <div className="flex justify-center">
            <Loader text="Cargando..." />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthPageLayout>
  );
}