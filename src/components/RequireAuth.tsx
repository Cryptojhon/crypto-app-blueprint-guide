
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const RequireAuth = ({ children, adminOnly = false }: RequireAuthProps) => {
  const { session, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!session) {
      navigate('/auth');
    } else if (adminOnly && !isAdmin) {
      navigate('/');
    } else if (isAdmin && location.pathname === '/') {
      // Redirect admins to admin dashboard when they access the root URL
      navigate('/admin/dashboard');
    }
  }, [session, isAdmin, navigate, adminOnly, location.pathname]);

  if (!session || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
