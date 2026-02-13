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

export default function RegisterPage() {
  const router = useRouter(); //para movernos entre rutas

  //estados para ver contraseñas,emails,loading,error,etc,etc
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Función q se activa cada vez que escribes en un input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Actualiza el objeto formData manteniendo lo que ya había (...previo)
    setFormData(previo => ({ ...previo, [name]: value }));
    // Si el usuario empieza a escribir de nuevo, borramos el mensaje de error
    if (error) setError('');
  };

  // Función principal: Se activa al darle al botón "Crear Cuenta"
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Evita q la página se refresque

    // VALIDACIONES
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Por favor, introduce un email válido');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true); // Encendemos el cargador
    setError(''); // Limpiamos errores previos

    try {
      // Petición al backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      //Convierte la respuesta del backend (que viene en formato JSON) en un objeto de JavaScript para poder usarlo.
      const data = await response.json();

      if (response.ok) {
        setSuccess(true); // Mostramos el mensaje verde de éxito
        setFormData({ email: '', password: '', confirmPassword: '' }); // Limpiamos el formulario
        
        // Tarda 2 segundos para q el usuario lea el mensaje y lo mandamos al login
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(data.error || 'Error al crear la cuenta');
      }
    } catch (err) {
      console.error('Error en registro:', err);
      setError('Error al conectar con el servidor. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`;
  };

  return (
    /* CONTENEDOR PRINCIPAL: Fondo oscuro y centrado total */
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gray-900">
      
      {/* IMAGEN DE FONDO (Igual que en Login para coherencia) */}
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

      {/* TARJETA PRINCIPAL CON ANIMACIÓN */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
      >
        {/* LADO IZQUIERDO: Imagen decorativa*/}
        <div className="relative w-full md:w-1/2 min-h-[300px] md:min-h-full overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="relative w-full h-full"
          >
              <Image
                src="/assets/loginRegister/login-side.png"
                alt="Travel"
                fill
                sizes="50vw"
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
                  Comienza tu aventura,<br />
                  <span className="font-light text-white/80">regístrate hoy</span>
              </motion.h2>
          </div>
        </div>

        {/* LADO DERECHO: El Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Crear cuenta</h1>
            <p className="text-gray-500 text-lg">Regístrate para empezar</p>
          </motion.div>

          {/* ÁREA DE MENSAJES: Rojo para errores, Verde para éxito */}
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

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 p-4 bg-green-50 text-green-600 border-l-4 border-green-500 text-sm"
              >
                ¡Cuenta creada! Revisa tu email para verificarla. Redirigiendo al login...
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
               {/* Input Email */}
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
            >
              {/* Input Password */}
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              {/* Input Confirmar Password (Campo extra respecto al Login) */}
              <InputField
                label="Confirmar Contraseña"
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
              transition={{ delay: 0.7 }}
            >
              {/* Botón de Registro */}
              <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={isLoading}>
                Crear Cuenta
              </Button>
            </motion.div>

            {/* Loader de carga */}
            {isLoading && (
              <div className="mt-4 flex justify-center">
                <Loader text="Creando cuenta..." />
              </div>
            )}
          </form>

          <Divider text="OR" />

          <motion.div
            whileTap={{ scale: 0.98 }}
          >
            {/* Botón Google (Llama a la misma función que en Login) */}
            <Button variant="google" onClick={handleGoogleLogin}>
              <GoogleIcon />
              Google
            </Button>
          </motion.div>

            {/* Enlace para volver si ya tienes cuenta */}
          <p className="mt-8 text-center text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-[#8d6e63] font-bold hover:underline">
                Inicia sesión
              </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}