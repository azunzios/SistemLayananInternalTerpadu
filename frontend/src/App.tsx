import React, { useState, useEffect } from 'react';
import { AppRouter } from '@/routing';
import { Toaster } from '@/components/ui/sonner';
import { Spinner } from '@/components/ui/spinner';
import { initializeDefaultData, getCurrentUser, setCurrentUser as saveCurrentUser, clearRememberToken, loadDataFromApiOnce, resetAllCaches } from '@/lib/storage';
import type { User } from '@/types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app on load
  useEffect(() => {
    // If mock mode, seed demo data
    initializeDefaultData();

    // Check for current user session
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Load API data only if user is already logged in
      loadDataFromApiOnce(user.role ?? 'pegawai')
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      // No user logged in yet
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (user: User) => {
    resetAllCaches();
    setCurrentUser(user);
    // Load API data after successful login
    loadDataFromApiOnce(user.role ?? 'pegawai').catch(() => {});
  };

  const handleLogout = () => {
    resetAllCaches();
    setCurrentUser(null);
    saveCurrentUser(null);
    clearRememberToken();
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    saveCurrentUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
          <Spinner/>
          <p className="text-gray-600 m-2">Memuat sistem ...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <AppRouter
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
        />
      </div>
      <Toaster position="top-right" />
    </>
  );
};
export default App;
