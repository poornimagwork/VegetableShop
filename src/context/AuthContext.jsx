import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gb_token');
    if (!token) {
      setReady(true);
      return undefined;
    }

    let active = true;
    api('/auth/me')
      .then((data) => {
        if (active) {
          setUser(data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem('gb_token');
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      async login(body) {
        const data = await api('/auth/login', { method: 'POST', body });
        localStorage.setItem('gb_token', data.token);
        setUser(data.user);
        return data.user;
      },
      async register(body) {
        const data = await api('/auth/register', { method: 'POST', body });
        localStorage.setItem('gb_token', data.token);
        setUser(data.user);
        return data.user;
      },
      logout() {
        localStorage.removeItem('gb_token');
        setUser(null);
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
