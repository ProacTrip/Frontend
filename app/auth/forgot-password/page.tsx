'use client'; 

import Image from "next/image";
import { useState, FormEvent } from 'react'; 
import Link from 'next/link';
import InputField from '@/components/ui/InputField'; 
import Button from '@/components/ui/Button'; 
import Loader from '@/components/ui/Loader'; 
import { motion, AnimatePresence } from 'framer-motion'; 

export default function ForgotPasswordPage() 
{
  //estados email/loader/error/success
  const [email, setEmail] = useState(''); 
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); 

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
            // Llamada a la API de recuperación de contraseña
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/forgot-password`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email }) //pasamos el objeto texto a json
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const data = await response.json().catch(() => ({}));
                setError(data.detail || data.title || 'Error al procesar la solicitud. Intenta de nuevo.');
            }
        } 
        catch (err) 
        {
            console.error('Error en forgot password:', err);
            setError('Error al conectar con el servidor. Intenta de nuevo.');
        } 
        finally 
        {
            setIsLoading(false); //dando igual lo q ocurra dejamos de cargar
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
          priority //cargamos esta imagen con prioridad , ya q es el fondo principal
        />
      </div>

      {/*TARJETA ANIMADA */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }} // Empieza abajo, invisible y pequeño
        animate={{ opacity: 1, y: 0, scale: 1 }} // Sube, se hace visible y tamaño normal
        transition={{ duration: 0.8, ease: "easeOut" }} // Animación suave de entrada
        className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-12"
      >
        {/* BOTON VOLVER A LOGIN*/}
        <Link
          href="/auth/login"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-8" //al pulsar l metemos cambio d color
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al login
        </Link>

        {/*animamos cuando los elemenos desaparecen del DOM*/}
        <AnimatePresence mode="wait">

          {/* VISTA 1: FORMULARIO (Se muestra si success es false) */}
          {!success && (
            <motion.div
              key="form" // Clave única necesaria para AnimatePresence
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-black mb-3">¿Olvidaste tu contraseña?</h1>
                <p className="text-gray-800">Introduce tu email y te enviaremos un link para recuperar la contraseña.</p>
              </div>

              {/* MENSAJE DE ERROR DINÁMICO */}
              <AnimatePresence>
                {error && (
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
                  <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={isLoading}>
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
            </motion.div>
          )}

          {/* VISTA 2: MENSAJE DE ÉXITO (Se muestra si success es true) */}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              {/* Icono de sobre de carta confirmando envío */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-800">¡Email enviado!</h1>
              <p className="text-gray-600">
                Si el email <span className="font-semibold text-gray-800">{email}</span> está registrado, recibirás un link para recuperar tu contraseña.
              </p>

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