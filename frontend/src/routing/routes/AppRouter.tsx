// @ts-nocheck
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../../components/login-page';
import { RegisterPage } from '../../components/register-page';
import { MainLayout } from '../../components/main-layout';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { PublicRoute } from '../guards/PublicRoute';
import { ROUTES, buildRoute, isValidRole } from '../constants';
import type { User } from '../../types';
import {ResetPasswordPage} from '@/components/reset-password-page';

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
        {/* Public Routes - Auth */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute user={currentUser}>
              <LoginPage onLogin={onLogin} />
            </PublicRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicRoute user={currentUser}>
              <RegisterPage onLogin={onLogin} />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute user={currentUser}>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes - All menu views under MainLayout with role param */}
        <Route
          path="/:role/*"
          element={
            currentUser && isValidRole(currentUser.role) ? (
              <ProtectedRoute user={currentUser}>
                <MainLayout
                  currentUser={currentUser!}
                  onLogout={onLogout}
                  onUserUpdate={onUserUpdate}
                />
              </ProtectedRoute>
            ) : (
              <Navigate to={ROUTES.LOGIN} replace />
            )
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate
                to={buildRoute(ROUTES.DASHBOARD, currentUser.role)}
                replace
              />
            ) : (
              <Navigate to={ROUTES.LOGIN} replace />
            )
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};