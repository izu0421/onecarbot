import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { touchUser, loadProfile } from './store';
import { detectLanguage } from './i18n';

const AuthContext = createContext({ user: null, profile: null, ready: false });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    detectLanguage();
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fire and forget — a failed lastSeen write must not block sign-in.
        touchUser(u).catch(() => {});
        try {
          setProfile(await loadProfile(u.uid));
        } catch (_) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setReady(true);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, ready, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
