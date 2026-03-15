// Para ver si ya inició sesión en algún momento para que no tenga que volver a iniciar sesión.
// Esto se usará en el /home: si no está logueado no pasa nada, pero si sí está
// logueado, arriba a la derecha aparecerán sus datos, carrito, me gustas, etc.

import { useEffect, useState } from 'react';
// Importamos refreshAccessToken de api.ts para no repetir la misma lógica en dos sitios
import { refreshAccessToken } from '@/app/lib/api';

// Borra todos los datos de sesión del navegador (se usa cuando algo falla o el token caduca)
function limpiarSesion() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token_expires_at');
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    // Guardamos la referencia al timer para poder cancelarlo cuando el componente se desmonte.
    // Usamos un objeto para poder mutarlo dentro de la función sin problemas de closures.
    const timerRef = { current: null as ReturnType<typeof setTimeout> | null };

    // Programa UN ÚNICO timeout que se dispara 5 minutos antes de que expire el token.
    // Si el token dura 60 min → el timer se dispara a los 55 min (solo 1 petición).
    // Si el token dura 24h → el timer se dispara a las 23h55min (solo 1 petición).
    // Tras cada renovación exitosa, se vuelve a llamar a sí misma para el siguiente ciclo.
    function programarRefresh() {
      // Cancelamos cualquier timer anterior antes de crear uno nuevo
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const expiresAt = localStorage.getItem('token_expires_at');
      if (!expiresAt) return;

      const expiracion = new Date(expiresAt).getTime();
      const margenMs = 5 * 60 * 1000; // 5 minutos antes de que expire
      const msHastaRefresh = expiracion - Date.now() - margenMs;

      if (msHastaRefresh <= 0) {
        // El token ya está por expirar o ya expiró → renovamos ahora mismo
        refreshAccessToken().then((renovado) => {
          if (!renovado) {
            limpiarSesion();
            setIsAuthenticated(false);
          } else {
            // Renovado con éxito → programamos el siguiente ciclo
            programarRefresh();
          }
        });
        return;
      }

      console.log(`[Auth] Próximo refresh en ${Math.round(msHastaRefresh / 60000)} minutos.`);

      // Programamos el timer para el momento exacto en que debemos renovar
      timerRef.current = setTimeout(async () => {
        const renovado = await refreshAccessToken();

        if (!renovado) {
          limpiarSesion();
          setIsAuthenticated(false);
        } else {
          // Renovado con éxito → programamos el siguiente ciclo
          programarRefresh();
        }
      }, msHastaRefresh);
    }

    // Función async separada porque useEffect no puede ser async directamente
    async function comprobarSesion() {

      // Recuperamos el token y su fecha de expiración del localStorage
      const token = localStorage.getItem('access_token');
      const expiresAt = localStorage.getItem('token_expires_at');

      // Si ni siquiera hay un token guardado, 100% no está autenticado
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Si hay token pero NO hay fecha de expiración, algo está mal
      if (!expiresAt) {
        console.warn('[Auth] Token sin fecha de expiración, limpiando sesión.');
        limpiarSesion();
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const expiration = new Date(expiresAt);

      // ¿El token sigue siendo válido?
      if (expiration > new Date()) {
        setIsAuthenticated(true);
        setIsLoading(false);
        // Token válido → programamos el refresh automático para cuando corresponda
        programarRefresh();
        return;
      }

      // El token ha caducado. Antes de cerrar sesión intentamos renovarlo
      // con el refreshToken para que el usuario no note nada.
      console.log('[Auth] Token expirado, intentando renovar...');
      const renovado = await refreshAccessToken();

      if (renovado) {
        // Renovación exitosa → el usuario sigue logueado sin enterarse
        console.log('[Auth] Token renovado, sesión recuperada.');
        setIsAuthenticated(true);
        // Programamos el refresh automático para el nuevo token
        programarRefresh();
      } else {
        // No se pudo renovar → limpiamos todo rastro de sesión por seguridad
        console.log('[Auth] No se pudo renovar el token, cerrando sesión.');
        limpiarSesion();
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    }

    comprobarSesion();

    // Cuando el componente se desmonta, cancelamos el timer para no dejar
    // procesos corriendo en segundo plano (memoria leak)
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };

  }, []); // [] = solo se ejecuta una vez al montar el componente

  return { isAuthenticated, isLoading };
}