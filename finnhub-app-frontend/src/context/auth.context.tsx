import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { authApi, LoginPayload, RegisterPayload } from '@/services/api';
import { secureStorage } from '@/services/secure-storage';
import { stockSocket } from '@/services/socket';

const TOKEN_KEY = 'finnhub_auth_token';

type AuthState = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    secureStorage.getItem(TOKEN_KEY).then((token) => {
      setState({ token, isAuthenticated: !!token, isLoading: false });
    });
  }, []);

  const persistToken = useCallback(async (token: string) => {
    await secureStorage.setItem(TOKEN_KEY, token);
    setState({ token, isAuthenticated: true, isLoading: false });
  }, []);

  const login = useCallback(
    async (data: LoginPayload) => {
      const { token } = await authApi.login(data);
      await persistToken(token);
    },
    [persistToken],
  );

  const register = useCallback(
    async (data: RegisterPayload) => {
      const { token } = await authApi.register(data);
      await persistToken(token);
    },
    [persistToken],
  );

  const logout = useCallback(async () => {
    stockSocket.disconnect();
    await secureStorage.deleteItem(TOKEN_KEY);
    setState({ token: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
