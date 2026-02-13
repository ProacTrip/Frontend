'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Loader from '@/components/ui/Loader';

export default function VerifyEmailPage() {
  const router = useRouter(); // Nos permite redirigir a otras paginas

  //searchParams coge el token y se lo guarda
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  //status se encarga de decir q pantalla se va a mostrar si la de loading, success o error
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  //se carga automaticamente, y vemos si hay token o no
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    //llamamos al backend
    const verifyEmail = async () => {
      try {
        // Petición GET al backend enviando el token
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-email?token=${token}`
        );

        const data = await response.json();

        if (response.ok) {
            // CASO DE EXITO
          setStatus('success');
          setMessage(data.message || 'Email verificado exitosamente');
          
          // Redirigir al login después de 3 segundos
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else {
            // CASO DE ERROR
          setStatus('error');
          setMessage(data.error || 'Token inválido o expirado');
        }
      } catch (err) {
        // ERROR DE RED: Si se va internet o el servidor está apagado
        console.error('Error verificando email:', err);
        setStatus('error');
        setMessage('Error al verificar el email. Intenta de nuevo.');
      }
    };

    // Ejecutamos la función que acabamos de definir
    verifyEmail();
  }, [token, router]);

  return (
    // CONTENEDOR PRINCIPAL: Centrado y fondo oscuro
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gray-900">
      
      {/* IMAGEN DE FONDO: La misma q en Login/Register para mantener el estilo */}
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

      {/* LA TARJETA CENTRAL: Pequeña y centrada (max-w-md) */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center"
      >
            {/* ESCENARIO 1: CARGANDO (solo se ve si status es loading) */}
            {status === 'loading' && (
            <div className="space-y-6">
                <div className="flex justify-center">
                <Loader text="Verificando tu email..." />
                </div>
            </div>
            )}
            {/* ESCENARIO 2: ÉXITO (solo se ve si status es success) */}
            {status === 'success' && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
            >
                {/* Círculo verde con un Check (Icono SVG) */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800">¡Email Verificado!</h1>
                
                <p className="text-gray-600">{message}</p>
                
                <p className="text-sm text-gray-500">
                Redirigiendo al login en 3 segundos...
                </p>

                {/* Botón manual por si la redirección automática falla */}
                <Link 
                href="/auth/login"
                className="inline-block mt-4 px-6 py-3 bg-[#8d6e63] text-white rounded-lg hover:bg-[#795548] transition-colors"
                >
                Ir al Login
                </Link>
            </motion.div>
            )}
            {/* ESCENARIO 3: ERROR (si el token expiro o es falso */}
            {status === 'error' && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
            >
                {/* Círculo rojo con una X (Icono SVG) */}
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800">Error de Verificación</h1>
                
                <p className="text-gray-600">{message}</p>

                <div className="space-y-3">
                <Link 
                    href="/auth/login"
                    className="inline-block w-full px-6 py-3 bg-[#8d6e63] text-white rounded-lg hover:bg-[#795548] transition-colors"
                >
                    Volver al Login
                </Link>
                
                {/* Si el usuario pulsa aquí, irá a una página para pedir otro email */}
                <p className="text-sm text-gray-500">
                    ¿Necesitas un nuevo link?{' '}
                    <Link href="/auth/resend-verification" className="text-[#8d6e63] font-bold hover:underline">
                    Reenviar email
                    </Link>
                </p>
                </div>
            </motion.div>
            )}
        </motion.div>
    </main>
  );
}