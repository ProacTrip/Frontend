'use client';

import Image from "next/image";
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InputField from '@/components/ui/InputField';
import Button from '@/components/ui/Button';
import Divider from '@/components/ui/Divider';
import GoogleIcon from '@/components/iconos/GoogleIcon';

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

  ///////////////SEPARADOR PA Q NO SEA UN LIO DE COSAS//////////////////////////////////////////////////////////////////////////////

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

      //Vamos a intentar hacer login
      try {
          // 3. Petición al Backend
          // Login normal
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {

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
            //Si todod fue bien

            //guardamos el token para mas adelante
            if (data.token) {
              localStorage.setItem('authToken', data.token);
            }
            
            //Nos vamos a la página principal
            router.push('/home');
          } 
          else 
          {
            //Error por contraseña incorrecta 
            setError(data.message || 'Email o contraseña incorrectos');
          }
      }
      catch (err) 
      {
        //Error servidor apagado
        console.error('Error en login:', err);
        setError('Error al conectar con el servidor. Intenta de nuevo.');
      } 
      finally 
      {
        //Pase lo que pase, quitamos el cargador
        setIsLoading(false);
      }
  };
  ///////////////SEPARADOR A PARTIR DE AQUI ENTENDER//////////////////////////////////////////////////////////////////////////////
  
  // Google login
  const handleGoogleLogin = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`;
  };

























//mirar y aprender Y ARREGLAR IR POCO A POCO DECIRLE A GEMINI Q NOS AYUDE A HACERLO BIEN HECHO DE POCO A POCO pa qno haya problemas 

  return (
    // 2. USAMOS TAILWIND EN LUGAR DE INLINE STYLES
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gray-900">
      
      {/* FONDO */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/loginRegister/background-travel.png" 
          alt="Background"
          fill
          className="object-cover brightness-[0.7]" 
          priority
        />
      </div>

      {/* TARJETA */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* IZQUIERDA: IMAGEN */}
        <div className="relative w-full md:w-1/2 min-h-[300px] md:min-h-full">
          <Image
            src="/assets/loginRegister/login-side.png"
            alt="Travel"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12">
            <h2 className="text-white text-3xl font-bold leading-tight">
              Tu viaje no se detiene,<br />
              <span className="font-light text-white/80">nosotros tampoco</span>
            </h2>
          </div>
        </div>

        {/* DERECHA: FORMULARIO */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Bienvenido</h1>
            <p className="text-gray-500 text-lg">Inicia sesión para continuar</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Email"
              name="email"
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="correo@ejemplo.com"
            />
            <div className="space-y-1">
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
                <button type="button" className="text-sm text-[#8d6e63] hover:underline font-medium">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full py-4 text-lg">
              {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <Divider text="OR" />

          <Button variant="google" onClick={handleGoogleLogin}>
            <GoogleIcon />
            Google
          </Button>

          <p className="mt-8 text-center text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="text-[#8d6e63] font-bold hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}