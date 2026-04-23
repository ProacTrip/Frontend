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
import { motion , AnimatePresence} from 'framer-motion';


export default function LoginPage() {

  //para navegar entre paginas
  const router = useRouter();

  //estados contraseña + email
  const [formData, setFormData] = useState({email: '', password: ''});

  //estados para el proceso del login
  const [isLoading, setIsLoading] = useState(false); // Cuando está enviando datos
  const [error, setError] = useState(''); // Para mostrar mensajes de error

  //vamos a cambiar un input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => 
  {
    //vamos a sacr datos del input (e.target es el input q estamos tocando)
    const {name , value} = e.target;

    //Aqui actualizamos el estado donde guardamos los datos del formulario.
    setFormData(previo => ({
      //...previo lo q hace es tipo "copia todo lo q hay y lo guardas como name value"
      ...previo,
      [name]: value
    }));
    // Si el usuario vuelve a escribir, quitamos el mensaje de error rojo
    if (error) setError('');
  }

  //Funcion Enviar formulario
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault(); //Evita que la página se recargue sola
      
      //Si no esta relleno email o password ps error 
      if (!formData.email || !formData.password) 
      {
        setError('Por favor, completa todos los campos');
        return;
      }
      //q lleve @ el gmail si no, no vale
      if (!formData.email.includes('@')) 
      {
        setError('Por favor, introduce un email válido');
        return;
      }

      setIsLoading(true); // Ponemos el spinner dando vueltas (el cargador)
      setError(''); //nos aseguramos (aunq repitamos) q no esta el mensaje de error

      try {
          // Petición al Backend
          // Login normal
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, 
          {
            method: 'POST',
            headers: { //mandamos json al backend y le pasamos email y password
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password
            })
          });

          //convertimos la informacion q nos pase el backend en JS , await lo q hace es epserar a q termine
          const data = await response.json();

          if (response.ok) 
          {
            //verificamos en consola por si acaso
            console.log('Login exitoso :D');

            //Comprobamos si el servidor nos ha enviado el 'access_token'
            if (data.access_token) 
            {
              //guardamos esa llave en el 'LocalStorage' del navegador con el nombre 'access_token'. 
              //permite que el usuario siga logueado aunque refresque la página.
              localStorage.setItem('access_token', data.access_token);
              
              if (data.expires_in) {
                //creamos obejto con la fecha actual y lo sumamos junto a la fecha de expiracion
                const expiresAt = new Date(Date.now() + data.expires_in * 1000);
                
                //lo guardamos como texto "string" para q se pueda borrar
                localStorage.setItem('token_expires_at', expiresAt.toISOString());
              }
            }

            //si el servidor nos envía también una llave de repuesto ('refresh_token'), la guardamos para pedir un nuevo token
            if (data.refresh_token) 
            {
              localStorage.setItem('refreshToken', data.refresh_token);
            }

            if (data.role) {
              localStorage.setItem('user_role', data.role);
              console.log(`[Auth] Rol guardado: ${data.role}`);
            }

            //Ponemos q tarde un poco aposta para cargar nuestro Loader
            setTimeout(() => {
              //setIsLoading(false);
              router.push('/home');
            }, 800);
          } 
          else 
          {
            setError(data.message || 'Email o contraseña incorrectos');
            setIsLoading(false); // Solo apagamos el spinner si falla la contraseña
          }
          
      } 
      catch (err) 
      {
        console.error('Error en login:', err);
        setError('Error al conectar con el servidor. Intenta de nuevo.');
        setIsLoading(false); // Apagamos el spinner si se cae el servidor
      } 
    
    };

      // Google login
    const handleGoogleLogin = () => {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`;
    };

  return (
    /* CONTENEDOR PRINCIPAL: Ocupa toda la pantalla, centra el contenido y pone fondo oscuro */
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gray-900">
      
      {/* SECCIÓN DEL FONDO: Una imagen q llena toda la pantalla detrás de la tarjeta */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/loginRegister/background-travel.png" 
          alt="Background"
          fill // Hace que la imagen se estire para llenar el div
          className="object-cover brightness-[0.7]" // 'object-cover' para q no se deforme, 'brightness' para oscurecerla
          priority //decimos q esta imagen tenga prioridad sobre el resto (pq es lo primero q se ve)
        />
      </div>

      {/* TARJETA BLANCA (donde se encontrar el formulario + imagen*/}
      {/* motion -> efecto chulo, de invisible a visible*/}
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
      > 
        {/* COLUMNA IZQUIERDA: Imagen decorativa con efecto de zoom al pasar el ratón (gracias a whileHover) */}
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
                <span className="font-serif">Tu viaje no se detiene,<br/>
                <span className="font-light text-white/80">nosotros tampoco</span></span>
            </motion.h2>
          </div>
        </div>

        {/* COLUMNA DERECHA: El formulario de Login real */}
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
              {/* MENSAJE DE ERROR: Solo aparece si el estado 'error' tiene texto */}
            {error && (
              <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }} //aparece desde arriba
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }} //desaparece suavemente
                  transition={{ duration: 0.3 }} 
                  className="mb-6 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORMULARIO: Donde el usuario escribe sus datos */}
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
              onChange={handleInputChange}  // Función que guarda lo que se escribe
              placeholder="correo@ejemplo.com"
            />
            </motion.div>
            {/* Input de Contraseña y enlace de Olvidar Contraseña */}
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
                showPasswordToggle // Permite ver/ocultar la contraseña
              />
              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-sm text-[#8d6e63] hover:underline font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </motion.div>
            {/* BOTÓN DE ENVIAR: Se desactiva si está cargando */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
            <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={isLoading} >
              Iniciar Sesión
            </Button>
            </motion.div>
            {isLoading && ( 
              <div className="mt-4 flex justify-center">
                <Loader text="Iniciando sesión..." />
              </div>
            )}

          </form>
            {/* SEPARADOR "OR"*/}
          <Divider text="OR" />
            
          <motion.div
          whileTap={{ scale: 0.98 }}
          >
            {/* BOTÓN DE GOOGLE */}
          <Button variant="google" onClick={handleGoogleLogin}>
            <GoogleIcon />
            Google
          </Button>
          </motion.div>
            {/* ENLACE AL REGISTRO: Por si no tienes cuenta todavía */}
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