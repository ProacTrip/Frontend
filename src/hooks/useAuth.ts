import { useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { user, isLoading, isAuthenticated, error, setUser, logout, profileLanguage, profileCurrency, profileFirstName } = useAuthContext();
  return { isAuthenticated, isLoading, user, error, setUser, logout, profileLanguage, profileCurrency, profileFirstName };
}
