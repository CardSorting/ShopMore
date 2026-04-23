/**
 * [LAYER: UI]
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@domain/models';
import { useServices } from './useServices';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const services = useServices(); // ✅ Single memoized call - no memory leak
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading) { // Initial load
      setLoading(false); // Set to false once container is loaded
      return;
    }

    const unsub = services.authService.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    
    return unsub;
  }, [services.authService, loading]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const u = await services.authService.signIn(email, password);
      setUser(u);
    },
    [services.authService]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const u = await services.authService.signUp(email, password, displayName);
      setUser(u);
    },
    [services.authService]
  );

  const signOut = useCallback(
    async () => {
      await services.authService.signOut();
      setUser(null);
    },
    [services.authService]
  );

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}