'use client';

import Image from "next/image";
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResendVerificationPage() {

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); 
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 

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
    setError('');

    try 
    {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }) 
      });

      const data = await response.json();

        if (response.ok) 
        {
            setSuccess(true);
        } 
        else 
        {
            setError(data.error || 'Error al reenviar el email. Intenta de nuevo.');
        }
    }
    catch (err) 
    {
        console.error('Error en resend verification:', err); 
        setError('Error al conectar con el servidor. Intenta de nuevo.'); 
    } 
    finally 
    {
        setIsLoading(false); //Desactivamos el loader
    }
  };

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

      {/*TARJETA BLANCA*/}
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }} 
            className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-12"
        >
            <Link
            href="/auth/login"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-8"
            >
                {/* Icono de flecha SVG */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al login
            </Link>

            {/*Anima elementos cuando desaparecen del DOM */}
            <AnimatePresence mode="wait">

                {/* VISTA 1 (!success)*/}
                {!success && (
                    <motion.div
                    key="form" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    >
                        <div className="mb-10">
                            <h1 className="text-3xl font-bold text-gray-800 mb-3">
                                Reenviar verificación
                            </h1>
                            <p className="text-gray-500">
                                Introduce tu email y te enviaremos un nuevo link de verificación.
                            </p>
                        </div>

                        {/* BLOQUE DE ERROR (Solo aparece si la variable "error" tiene texto) */}
                        <AnimatePresence>
                            {error && (
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
                            
                            {/*Email animado */}
                            <motion.div
                            initial={{ opacity: 0, x: -20 }} // Entra desde la izquierda
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }} // Espera un poco antes de aparecer
                            >
                                <InputField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    id="email"
                                    value={email} 
                                    onChange={(e) => {
                                        setEmail(e.target.value); 
                                        if (error) setError(''); 
                                    }}
                                    placeholder="correo@ejemplo.com"
                                />
                            </motion.div>

                            {/* Botón animado */}
                            <motion.div
                            whileTap={{ scale: 0.98 }} //Efecto al pulsar
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            >
                                <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={isLoading}>
                                    Reenviar Email de Verificación
                                </Button>
                            </motion.div>

                            {/* Loader(Solo aparece si isLoading es true) */}
                            {isLoading && (
                                <div className="mt-4 flex justify-center">
                                    <Loader text="Reenviando email..." />
                                </div>
                            )}
                        </form>

                        {/* Footer con enlac al login */}
                        <p className="mt-6 text-center text-sm text-gray-500">
                            ¿Ya verificaste tu email?{' '} {/* Esto {' '} sirve para crear un espacio en blanco y q no quede pegado el Link q s ve feo*/}
                            <Link href="/auth/login" className="text-[#8d6e63] font-bold hover:underline">
                            Inicia sesión
                            </Link>
                        </p>
                    </motion.div>
                )}

                {/* VISTA 2: EXITO (success) */}
                {success && (
                    <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                    >
                        {/* Icono SVG Check Verde */}
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">¡Email reenviado!</h1>
                        <p className="text-gray-600">
                            Hemos enviado un nuevo email de verificación a{' '}
                            <span className="font-semibold text-gray-800">{email}</span>
                        </p>
                        <div className="space-y-3 pt-4">
                            <p className="text-sm text-gray-500">
                                Revisa tu bandeja de entrada y también la carpeta de spam.
                            </p>

                            <p className="text-sm text-gray-500">
                                El link de verificación expira en 24 horas.
                            </p>
                        </div>

                        <Link
                            href="/auth/login"
                            className="inline-block w-full px-6 py-3 bg-[#8d6e63] text-white rounded-lg hover:bg-[#795548] transition-colors text-center"
                        >
                            Volver al Login
                        </Link>
                    </motion.div>
                )}

            </AnimatePresence>
      </motion.div>
    </main>
  );
}