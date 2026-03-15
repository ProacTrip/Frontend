'use client'; 

import Image from "next/image";
import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';

//dejo de poner tantos comentarios en router , searchParams etc pq en las otras page ps ya s sabe lo q es
function ResetPasswordForm() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  //estados
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    if (formData.newPassword.length < 6) 
    {
      setError('La contraseña debe tener al menos 6 caracteres');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          new_password: formData.newPassword
        })
      });

      //Convierte la respuesta del backend (que viene en formato JSON) en un objeto de JavaScript para poder usarlo.
      const data = await response.json();

      if (response.ok) 
        {
            setSuccess(true);
            setTimeout(() => {
            router.push('/auth/login');
            // 👆 Redirigimos a la página login
            }, 3000);
        } 
        else 
        {
            setError(data.error || 'Token inválido o expirado. Solicita un nuevo link.');
        }

    } 
    catch (err) 
    {
      //Aquí entramos si hay fallo de red o backend apagado

      console.error('Error en reset password:', err);
      //Lo mostramos en consola para debug

      setError('Error al conectar con el servidor. Intenta de nuevo.');
      //Mensaje para el usuario

    } 
    finally 
    {
      //Esto se ejecuta SIEMPRE (haya error o no)
      setIsLoading(false);
      //Quitamos el loader
    }
  };

  //si no tiene token la url, mostramos directamente error
  //Aparte los svg q se vean dentro no los metemos en components pq son muy simples y ps seria hacer archivos extra q se usaran poco.
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
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">
                    Nueva contraseña
                    </h1>
                    <p className="text-gray-500">
                    Introduce tu nueva contraseña. Debe tener al menos 6 caracteres.
                    </p>
                </div>
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
                            disabled={isLoading}
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
//pagina principal
export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gray-900">
      <div className="absolute inset-0 z-0">
        {/*inset-0 hace q ocupe toda la pantalla */}

        <Image
          src="/assets/loginRegister/background-travel.png"
          alt="Background"
          fill //q ocupe todo el contenedor
          sizes="100vw"
          className="object-cover brightness-[0.7]"
          priority
        />
      </div>

      {/* TARJETA PRINCIPAL */}
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {/* icono flecha */}
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al login
            </Link>

            {/* SUSPENSE PARA QUE useSearchParams funcione bien*/}
            <Suspense
                fallback={
                    // mientras carga ResetPasswordForm mostramos un loader
                    <div className="flex justify-center">
                        <Loader text="Cargando..." />
                    </div>
                }
            >
                <ResetPasswordForm />
                {/*Aquí se renderiza el formulario*/}
            </Suspense>

      </motion.div>
    </main>
  );
}
