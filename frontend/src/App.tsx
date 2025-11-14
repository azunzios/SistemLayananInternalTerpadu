import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/login-page';
import { MainLayout } from './components/main-layout';
import { Wireframe } from './components/wireframe';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { initializeDefaultData, getCurrentUser, setCurrentUser as saveCurrentUser, getRememberToken, clearRememberToken, getUsers } from './lib/storage';
import { FileText, ArrowLeft } from 'lucide-react';
import type { User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);

  // Initialize app on load
  useEffect(() => {
    // Initialize default data (creates super admin if not exists)
    initializeDefaultData();

    // Check for current user session
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsLoading(false);
      return;
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

    setIsLoading(false);
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  // Show wireframe mode
  if (showWireframe) {
    return (
      <>
        <div className="min-h-screen">
          <div className="fixed top-4 left-4 z-50">
            <Button 
              onClick={() => setShowWireframe(false)}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Aplikasi
            </Button>
          </div>
          <Wireframe />
        </div>
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {!currentUser ? (
          <div className="relative">
            <div className="fixed top-4 right-4 z-50">
              <Button 
                onClick={() => setShowWireframe(true)}
                variant="outline"
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Lihat Wireframe
              </Button>
            </div>
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
