import { Navigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import type { User } from '../../types';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
}

// Route yang hanya bisa diakses kalau sudah login
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};
