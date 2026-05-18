'use client'; 

import { useState, FormEvent } from 'react'; 
import Link from 'next/link';
import InputField from '@/components/ui/InputField'; 
import Button from '@/components/ui/Button'; 
import Loader from '@/components/ui/Loader'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import AuthPageLayout from '@/components/layout/AuthPageLayout';
import { forgotPassword, AuthApiError, RateLimitError } from '@/app/lib/api';
import { useRateLimit } from '@/hooks/useRateLimit';
import RateLimitBanner from '@/components/ui/RateLimitBanner';

export default function ForgotPasswordPage() 
{
  //estados email/loader/error/success
  const [email, setEmail] = useState(''); 
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); 
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const { isBlocked } = useRateLimit();

  //funcion principal
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); //evita que la página se recargue

        //validar email
        if (!email) 
        {
            setError('Por favor, introduce tu email');
            return;
        }

        if (!email.includes('@')) 
        {
            setError('Por favor, introduce un email válido');
            return;
        }

        setIsLoading(true); 
        setError(''); //limpiar errores

        try 
        {
            await forgotPassword(email);
            setSuccess(true);
        } 
        catch (err) 
        {
            if (err instanceof RateLimitError) {
                setError(err.message);
                setRateLimitError(err.message);
            } else if (err instanceof AuthApiError) {
                setError(err.message);
            } else {
                console.error('Error en forgot password:', err);
                setError('Error al conectar con el servidor. Intenta de nuevo.');
            }
        } 
        finally 
        {
            setIsLoading(false); //dando igual lo q ocurra dejamos de cargar
        }
  };

  return (
    <AuthPageLayout
      title={success ? '¡Email enviado!' : '¿Olvidaste tu contraseña?'}
      subtitle={success ? `Si el email ${email} está registrado, recibirás un link para recuperar tu contraseña.` : 'Introduce tu email y te enviaremos un link para recuperar la contraseña.'}
      variant="card"
      backHref="/auth/login"
    >
      {!success && (
        <>
          <RateLimitBanner
            rateLimitError={rateLimitError}
            onRetryReady={() => {
              setRateLimitError(null);
              setError('');
            }}
          />

          {/* MENSAJE DE ERROR DINÁMICO */}
          <AnimatePresence>
            {error && !isBlocked && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <InputField
                label="Email"
                name="email"
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(''); // Limpia el error mientras el usuario corrige
                }}
                placeholder="correo@ejemplo.com"
              />
            </motion.div>

            <motion.div whileTap={{ scale: 0.98 }}> {/* Pequeño efecto al pulsar*/}
              <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={isLoading || isBlocked}>
                Enviar link de recuperación
              </Button>
            </motion.div>

            {/* LOADER d q se esta enviando*/}
            {isLoading && (
              <div className="mt-4 flex justify-center">
                <Loader text="Enviando email..." />
              </div>
            )}
          </form>
        </>
      )}

      {success && (
        <div className="text-center space-y-6">
          {/* Icono de sobre de carta confirmando envío */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <Link
            href="/auth/login"
            className="inline-block w-full px-6 py-3 bg-[#8d6e63] text-white rounded-lg hover:bg-[#795548] transition-colors text-center"
          >
            Volver al Login
          </Link>
        </div>
      )}
    </AuthPageLayout>
  );
}