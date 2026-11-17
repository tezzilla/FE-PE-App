import { createContext, use, type PropsWithChildren } from 'react';

import { api } from '@/lib/api';
import { useStorageState } from '@/lib/storage';

interface Session {
  token: string | null;
  isLoading: boolean;
  signIn: (mode: 'login' | 'signup', email: string, password: string, name?: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<Session | null>(null);

export function useSession() {
  const value = use(AuthContext);
  if (!value) throw new Error('useSession must be wrapped in a <SessionProvider />');
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, token], setToken] = useStorageState('civilprep.session');
  return (
    <AuthContext.Provider
      value={{
        token,
        isLoading,
        // Throws ApiError with a user-readable message on failure.
        signIn: async (mode, email, password, name) => {
          const r = await api.auth(mode, email, password, name);
          setToken(r.token);
        },
        signOut: () => setToken(null),
      }}>
      {children}
    </AuthContext.Provider>
  );
}
