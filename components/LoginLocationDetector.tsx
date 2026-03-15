'use client';

import { useEffect } from 'react';
import { getUserLocation } from '@/app/lib/utils/location';
import { apiFetch } from '@/app/lib/api';

/*
 Detecta ubicación ACTUAL cuando el usuario hace login
 (para recomendaciones de hoteles/vuelos cercanos)
*/
export function LoginLocationDetector() {
  useEffect(() => {
    async function updateCurrentLocation() {
        try 
        {
            const token = localStorage.getItem('access_token');
            if (!token) return; // Solo autenticados

            const location = await getUserLocation();

            // Enviar SOLO location actual al backend
            if (location.location) 
            {
                await apiFetch('/api/v1/user/current-location', {
                    method: 'POST',
                    body: JSON.stringify({
                    location: location.location,
                    }),
                });
                console.log('[Login] Ubicación actual enviada');
            }
        } 
        catch (error) 
        {
            console.warn('[LoginLocation] Error:', error);
        }
    }

    updateCurrentLocation();
  }, []);

  return null;
}