import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/login-page';
import { MainLayout } from './components/main-layout';
import { Toaster } from './components/ui/sonner';
import { Spinner } from '@/components/ui/spinner'
import { initializeDefaultData, getCurrentUser, setCurrentUser as saveCurrentUser, getRememberToken, clearRememberToken, getUsers, loadDataFromApiOnce } from './lib/storage';
import type { User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app on load
  useEffect(() => {
    // If mock mode, seed demo data. Otherwise, load initial data from API into cache
    initializeDefaultData();

    // Check for current user session
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }

    // Check for remember me token
    const rememberToken = getRememberToken();
    if (rememberToken) {
      const users = getUsers();
      const rememberedUser = users.find(u => u.id === rememberToken);
      if (rememberedUser) {
        setCurrentUser(rememberedUser);
        saveCurrentUser(rememberedUser);
      }
    }
    // Always attempt to warm caches from API (no-op in mock mode)
    loadDataFromApiOnce()
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
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
        <div className="text-center">
          <Spinner/>
          <p className="text-gray-600">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {!currentUser ? (
          <div className="relative">
            <LoginPage onLogin={handleLogin} />
          </div>
        ) : (
          <MainLayout 
            currentUser={currentUser}
            onLogout={handleLogout}
            onUserUpdate={handleUserUpdate}
          />
        )}
      </div>
      <Toaster position="top-right" />
    </>
  );
};
export default App;
