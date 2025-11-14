import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Building, Users, AlertCircle, Mail, Info, Shield, ClipboardCheck, Package, Wrench, UserCircle } from 'lucide-react';
import { toast } from "sonner@2.0.3";
import { motion, AnimatePresence } from 'motion/react';
import { getUsers, setCurrentUser, addAuditLog, setRememberToken } from '../lib/storage';
import type { User } from '../types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getUsers();
    const user = users.find(u => 
      (u.email === formData.login.toLowerCase()) && 
      u.password === formData.password
    );

    if (!user) {
      setError('Email atau password tidak valid');
      setIsLoading(false);
      
      // Log failed attempt
      addAuditLog({
        userId: 'unknown',
        action: 'LOGIN_FAILED',
        details: `Failed login attempt for: ${formData.login}`,
        ipAddress: 'N/A',
      });
      return;
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      setError(`Akun terkunci. Silakan coba lagi setelah ${new Date(user.lockedUntil).toLocaleTimeString('id-ID')}`);
      setIsLoading(false);
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      setError('Akun Anda sedang dinonaktifkan. Hubungi administrator');
      setIsLoading(false);
      return;
    }

    // Reset failed attempts on successful login
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, failedLoginAttempts: 0, lockedUntil: undefined } : u
    );
    localStorage.setItem('bps_ntb_users', JSON.stringify(updatedUsers));

    // Set remember me token
    if (formData.rememberMe) {
      setRememberToken(user.id, 30);
    }

    // Set current user
    setCurrentUser(user);

    // Log successful login
    addAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      details: `User logged in successfully`,
      ipAddress: 'N/A',
    });

    toast.success(`Selamat datang, ${user.name}!`);
    onLogin(user);
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const users = getUsers();
    const userExists = users.find(u => u.email === forgotPasswordEmail.toLowerCase());
    
    if (userExists) {
      // In production, this would send an actual email
      const resetToken = Math.random().toString(36).substring(2, 15);
      const resetTokens = JSON.parse(localStorage.getItem('bps_ntb_reset_tokens') || '{}');
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 1); // 1 hour expiry
      
      resetTokens[forgotPasswordEmail] = {
        token: resetToken,
        expiry: expiryTime.toISOString(),
      };
      
      localStorage.setItem('bps_ntb_reset_tokens', JSON.stringify(resetTokens));
      
      // Log the action
      addAuditLog({
        userId: userExists.id,
        action: 'PASSWORD_RESET_REQUESTED',
        details: `Password reset requested for ${forgotPasswordEmail}`,
      });

      toast.success('Link reset password telah dikirim ke email Anda (Check console for demo)');
      console.log(`Reset Password Link (Demo): /reset-password?token=${resetToken}&email=${forgotPasswordEmail}`);
      setResetSuccess(true);
    } else {
      toast.error('Email tidak ditemukan dalam sistem');
    }

    setIsLoading(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center space-y-4">
              <motion.div 
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Mail className="h-10 w-10 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription className="mt-2">
                  {resetSuccess 
                    ? 'Link reset password telah dikirim' 
                    : 'Masukkan email terdaftar untuk reset password'}
                </CardDescription>
              </div>
            </CardHeader>

            {!resetSuccess ? (
              <form onSubmit={handleForgotPassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="nama@bps-ntb.go.id"
                      required
                    />
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Link reset password akan dikirim ke email Anda dan berlaku selama 1 jam
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSuccess(false);
                      setForgotPasswordEmail('');
                    }}
                  >
                    Kembali ke Login
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800">
                    Email reset password telah dikirim ke <strong>{forgotPasswordEmail}</strong>
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    Silakan cek inbox Anda dan klik link yang diberikan
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSuccess(false);
                    setForgotPasswordEmail('');
                  }}
                >
                  Kembali ke Login
                </Button>
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <motion.div 
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Building className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl">Sistem Layanan Internal</CardTitle>
              <CardDescription className="mt-2">
                BPS Provinsi Nusa Tenggara Barat
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="space-y-2">
                <Label htmlFor="login">Email</Label>
                <Input
                  id="login"
                  name="login"
                  type="email"
                  value={formData.login}
                  onChange={handleInputChange}
                  placeholder="nama@bps-ntb.go.id"
                  required
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Masukkan password"
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, rememberMe: !!checked }))
                    }
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    Ingat Saya (30 hari)
                  </Label>
                </div>
                
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Lupa Password?
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" 
                disabled={isLoading}
              >
                {isLoading ? 'Memverifikasi...' : 'Masuk'}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Belum punya akun? Hubungi administrator untuk pendaftaran
              </p>
            </CardFooter>
          </form>
          
          {/* Demo Accounts Info */}
          <CardFooter className="pt-0">
            <div className="w-full">
              <Collapsible open={showDemoAccounts} onOpenChange={setShowDemoAccounts}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm p-3 hover:bg-blue-50">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800">Lihat Akun Demo</span>
                    </div>
                    <span className="text-xs text-gray-500">{showDemoAccounts ? '▲' : '▼'}</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 space-y-4">
                    <div className="text-center mb-3">
                      <p className="text-sm font-semibold text-blue-900">🔑 Password untuk semua: <code className="bg-blue-100 px-2 py-1 rounded">demo123</code></p>
                    </div>
                    
                    <div className="grid gap-3">
                      {/* Super Admin */}
                      <div className="bg-white p-3 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-900">Super Admin</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ login: 'superadmin@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                            setShowDemoAccounts(false);
                          }}
                          className="text-xs font-mono bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 w-full text-left"
                        >
                          superadmin@bps-ntb.go.id
                        </button>
                      </div>

                      {/* Admin Layanan */}
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardCheck className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">Admin Layanan</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ login: 'adminlayanan@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                            setShowDemoAccounts(false);
                          }}
                          className="text-xs font-mono bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 w-full text-left"
                        >
                          adminlayanan@bps-ntb.go.id
                        </button>
                      </div>

                      {/* Admin Penyedia */}
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-900">Admin Penyedia</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ login: 'adminpenyedia@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                            setShowDemoAccounts(false);
                          }}
                          className="text-xs font-mono bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 w-full text-left"
                        >
                          adminpenyedia@bps-ntb.go.id
                        </button>
                      </div>

                      {/* Teknisi */}
                      <div className="bg-white p-3 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-semibold text-orange-900">Teknisi</span>
                        </div>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ login: 'teknisi1@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                              setShowDemoAccounts(false);
                            }}
                            className="text-xs font-mono bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 w-full text-left"
                          >
                            teknisi1@bps-ntb.go.id
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ login: 'teknisi2@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                              setShowDemoAccounts(false);
                            }}
                            className="text-xs font-mono bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 w-full text-left"
                          >
                            teknisi2@bps-ntb.go.id
                          </button>
                        </div>
                      </div>

                      {/* User */}
                      <div className="bg-white p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCircle className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-900">Pegawai</span>
                        </div>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ login: 'user1@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                              setShowDemoAccounts(false);
                            }}
                            className="text-xs font-mono bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 w-full text-left"
                          >
                            user1@bps-ntb.go.id
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ login: 'user2@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                              setShowDemoAccounts(false);
                            }}
                            className="text-xs font-mono bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 w-full text-left"
                          >
                            user2@bps-ntb.go.id
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ login: 'user3@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                              setShowDemoAccounts(false);
                            }}
                            className="text-xs font-mono bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 w-full text-left"
                          >
                            user3@bps-ntb.go.id
                          </button>
                        </div>
                      </div>

                      {/* Multi-Role Accounts */}
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-3 rounded-lg border-2 border-amber-300">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">🌟</span>
                          <span className="text-sm font-semibold text-amber-900">Multi-Role</span>
                        </div>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ login: 'multirole1@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                              setShowDemoAccounts(false);
                            }}
                            className="text-xs font-mono bg-white px-2 py-1 rounded hover:bg-gray-50 w-full text-left"
                          >
                            multirole1@bps-ntb.go.id <span className="text-[10px] text-gray-500">• Admin Layanan + Teknisi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ login: 'multirole2@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                              setShowDemoAccounts(false);
                            }}
                            className="text-xs font-mono bg-white px-2 py-1 rounded hover:bg-gray-50 w-full text-left"
                          >
                            multirole2@bps-ntb.go.id <span className="text-[10px] text-gray-500">• Pegawai + Admin Penyedia</span>
                          </button>
                        </div>
                      </div>

                      {/* Master Account */}
                      <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-lg border-2 border-purple-400 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">⭐</span>
                          <span className="text-sm font-semibold text-purple-900">MASTER ACCOUNT</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ login: 'master@bps-ntb.go.id', password: 'demo123', rememberMe: false });
                            setShowDemoAccounts(false);
                          }}
                          className="text-xs font-mono bg-white px-2 py-1 rounded hover:bg-gray-50 w-full text-left font-semibold"
                        >
                          master@bps-ntb.go.id <span className="text-[10px] text-purple-600">• ALL ROLES</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-center text-xs text-gray-600 pt-2 border-t">
                      💡 Klik email untuk auto-fill login form
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 BPS Provinsi Nusa Tenggara Barat
        </p>
        
        {/* Debug: Force Reload Data Button */}
        <div className="text-center mt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={() => {
              if (window.confirm('Reset semua data ke default? Ini akan menghapus semua perubahan yang Anda buat.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
          >
            🔄 Reset Data ke Default
          </Button>
        </div>
      </motion.div>
    </div>
  );
};