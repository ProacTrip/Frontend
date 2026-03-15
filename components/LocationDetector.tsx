'use client';

import { useEffect, useState } from 'react';
import { getUserLocation } from '@/app/lib/utils/location';

/*
 Detecta ubicación SOLO para usuarios ANÓNIMOS (sin login)
 despues guarda en localStorage para rellenar el register
*/
export function LocationDetector() {
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    async function detectAndSaveLocation() {
        if (hasChecked) return;

        try 
        {
            const token = localStorage.getItem('access_token');

            // Solo para usuarios ANÓNIMOS
            if (!token) 
            {
                const savedLocation = localStorage.getItem('user_location');
                if (!savedLocation) 
                {
                    const location = await getUserLocation();
                    localStorage.setItem('user_location', JSON.stringify(location));
                    console.log('[Anónimo] Ubicación guardada en localStorage');
                } 
                else 
                {
                    console.log('ℹ[Anónimo] Ya tiene ubicación guardada');
                }
            }

            setHasChecked(true);
        } 
        catch (error) 
        {
            console.warn('[LocationDetector] Error:', error);
            setHasChecked(true);
        }
    }

    detectAndSaveLocation();
  }, [hasChecked]);

  return null;
}