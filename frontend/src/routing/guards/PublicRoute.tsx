import { Navigate } from 'react-router-dom';
import { ROUTES, buildRoute } from '../constants';
import type { User } from '../../types';

interface PublicRouteProps {
  user: User | null;
  children: React.ReactNode;
}

// Route yang hanya bisa diakses kalau belum login (redirect ke dashboard kalau sudah login)
export const PublicRoute: React.FC<PublicRouteProps> = ({ user, children }) => {
  if (user) {
    // Redirect ke dashboard dengan role yang sesuai
    return <Navigate to={buildRoute(ROUTES.DASHBOARD, user.role)} replace />;
  }

  return <>{children}</>;
};
