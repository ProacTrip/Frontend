// Hook de autenticación cookie-based (v2).
// Usa AuthContext que consulta /v1/auth/current-user al montar.
// El backend maneja el refresco de tokens transparentemente.

import { useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { user, isLoading, isAuthenticated, error, logout, refreshUser } = useAuthContext();
  return { isAuthenticated, isLoading, user, error, logout, refreshUser };
}
