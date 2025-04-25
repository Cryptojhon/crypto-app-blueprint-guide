
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const RequireAuth = ({ children, adminOnly = false }: RequireAuthProps) => {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect after auth status is confirmed
    if (!loading) {
      // Always redirect to auth page if not authenticated
      if (!session) {
        navigate('/auth');
        return;
      }
      
      // If admin-only route but not an admin
      if (adminOnly && !isAdmin) {
        navigate('/');
        return;
      }
      
      // Redirect admins to admin dashboard when they access the root URL
      if (isAdmin && location.pathname === '/') {
        navigate('/admin/dashboard');
        return;
      }
    }
  }, [session, isAdmin, navigate, adminOnly, location.pathname, loading]);

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  // Don't render protected content if not authenticated
  if (!session || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
