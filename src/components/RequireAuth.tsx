
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const RequireAuth = ({ children, adminOnly = false }: RequireAuthProps) => {
  const { session, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate('/auth');
    } else if (adminOnly && !isAdmin) {
      navigate('/');
    }
  }, [session, isAdmin, navigate, adminOnly]);

  if (!session || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
