import { ReactNode, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DemoAuthWrapperProps {
  children: ReactNode;
}

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? 'demo@pessora.mq';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? 'demo123';

const DemoAuthWrapper = ({ children }: DemoAuthWrapperProps) => {
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
