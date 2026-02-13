// hooks/useAuth.ts
//para ver si ya inicio sesion en algun momento para q no tenga q volver a iniciar sesion
//esto se usara en el /home Por rematar pues si no esta logueado ps no pasa nada , pero si sí esta
//logueado arriba a la derecha su perfil pues reapareceran sus ultimso datos y toda la informacion q haya añadido en
//carito , me gustas, etc 

import { useEffect, useState } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Comprueba si hay un token guardado de una sesión anterior
    const token = localStorage.getItem('authToken');

    if (token) {
      // Si hay token, el usuario ya está logueado
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  return { isAuthenticated, isLoading };
}



//SUPUESTAMENTE TIENE ERROR Y ENTRA AUNQ EL TOKEN ESTE EXPIRADO ///////////////////////////////////////////////////////////
//SE USA EN HOME (EN LAYOUT)