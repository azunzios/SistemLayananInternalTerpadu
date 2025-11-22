import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../../components/login-page';
import { MainLayout } from '../../components/main-layout';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { PublicRoute } from '../guards/PublicRoute';
import { ROUTES } from '../constants';
import type { User } from '../../types';

interface AppRouterProps {
  currentUser: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  currentUser,
  onLogin,
  onLogout,
  onUserUpdate,
}) => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route - Login */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute user={currentUser}>
              <LoginPage onLogin={onLogin} />
            </PublicRoute>
          }
        />

        {/* Protected Routes - All menu views under MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute user={currentUser}>
              <MainLayout
                currentUser={currentUser!}
                onLogout={onLogout}
                onUserUpdate={onUserUpdate}
              />
            </ProtectedRoute>
          }
        >
          {/* Dashboard and menu routes */}
          <Route path="dashboard" />
          <Route path="my-tickets" />
          <Route path="create-ticket-perbaikan" />
          <Route path="create-ticket-zoom" />
          <Route path="tickets" />
          <Route path="ticket-detail/:id" />
          <Route path="zoom-booking" />
          <Route path="zoom-management" />
          <Route path="work-orders" />
          <Route path="users" />
          <Route path="reports" />
          <Route path="profile" />
          <Route path="settings" />
        </Route>

        {/* Default redirect */}
        <Route
          path={ROUTES.HOME}
          element={
            currentUser ? (
              <Navigate to={ROUTES.DASHBOARD} replace />
            ) : (
              <Navigate to={ROUTES.LOGIN} replace />
            )
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
