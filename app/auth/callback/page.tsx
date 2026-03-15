'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import { motion } from 'framer-motion';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');

      // Validación del token
      if (!token) {
        setError('No se recibió el token de autenticación de Google');
        setStatus('error');
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      console.log('✅ Token de Google recibido');

      try {
        // Guardar access_token
        localStorage.setItem('access_token', token);

        // Calcular expiración (1 hora)
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + 3600);
        localStorage.setItem('token_expires_at', expiresAt.toISOString());

        console.log('💾 Token guardado correctamente');
        
        // ⚠️ IMPORTANTE: No tenemos refresh_token por el bug del backend
        // Cuando Aurelio lo arregle, el código ya está preparado para recibirlo
        const refreshToken = searchParams.get('refresh_token');
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
          console.log('✅ Refresh token guardado');
        } else {
          console.warn('⚠️ Login con Google sin refresh_token (bug del backend)');
        }

        setStatus('success');

        // Redirigir al home después de 1 segundo
        setTimeout(() => {
          router.push('/home');
        }, 1000);

      } catch (err) {
        console.error('❌ Error procesando callback:', err);
        setError('Error al procesar la autenticación');
        setStatus('error');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    processCallback();
  }, [searchParams, router]);

  // Estado de error
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md"
        >
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error de autenticación
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirigiendo al login...</p>
        </motion.div>
      </div>
    );
  }

  // Estado de éxito
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-lg shadow-xl text-center"
        >
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            ¡Autenticación exitosa!
          </h2>
          <p className="text-gray-600">Redirigiendo al home...</p>
        </motion.div>
      </div>
    );
  }

  // Estado de procesando
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-lg shadow-xl text-center"
      >
        <div className="text-6xl mb-6">🔐</div>
        <div className="mb-6">
          <Loader text="Completando autenticación con Google..." />
        </div>
        <p className="text-gray-600 text-sm">Iniciando tu sesión...</p>
      </motion.div>
    </div>
  );
}




//ESTE CODIGO SOLO DURARA 1 HORA PARA INICIAR SESION POR GOOGLE
//aparte hay errores en el backend q si ya se creo la cuenta o sale duplicate keys pues no deja entrar 
//no lo tocaremos aun mucho hasta q el backend lo arregle adecuadamente
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
