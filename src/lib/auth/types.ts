/**
 * Auth types — shared interfaces for AuthProvider and auth API.
 */

export interface UserInfo {
  id: string;
  email: string;
  email_verified: boolean;
  role_name: string;
}

export interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: UserInfo | null) => void;
}
