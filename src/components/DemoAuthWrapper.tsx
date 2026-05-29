import { ReactNode, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ⚠️  CE COMPOSANT NE DOIT JAMAIS ÊTRE ACTIF EN PRODUCTION
// Il utilise VITE_DEMO_* pour auto-login. Le guard import.meta.env.PROD
// garantit qu'il est court-circuité en prod.

interface DemoAuthWrapperProps {
  children: ReactNode;
}

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? 'demo@pessora.mq';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? 'demo123';

const DemoAuthWrapper = ({ children }: DemoAuthWrapperProps) => {
  // Ne jamais activer le demo auth en production
  if (import.meta.env.PROD) {
    if (typeof window !== 'undefined') {
      console.warn('[DemoAuth] Demo auth is disabled in production')
    }
    return <>{children}</>
  }

  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) return;
    login(DEMO_EMAIL, DEMO_PASSWORD).catch((err) => {
      if (import.meta.env.DEV) console.error('[DemoAuthWrapper] demo login failed:', err);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
};

export default DemoAuthWrapper;
