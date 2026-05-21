import { useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { user, isLoading, isAuthenticated, error, context, setUser, setContext, logout, logoutAll, refreshUser } = useAuthContext();
  return { isAuthenticated, isLoading, user, error, context, setUser, setContext, logout, logoutAll, refreshUser };
}
