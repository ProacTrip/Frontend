import { useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { user, isLoading, isAuthenticated, error, context, setUser, setContext, logout, profileLanguage, profileCurrency } = useAuthContext();
  return { isAuthenticated, isLoading, user, error, context, setUser, setContext, logout, profileLanguage, profileCurrency };
}
