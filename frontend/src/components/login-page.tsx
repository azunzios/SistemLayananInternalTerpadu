import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, AlertCircle, Mail } from 'lucide-react';
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'motion/react';
import { loginUser, setCurrentUser, addAuditLog, setRememberToken } from '../lib/storage';
import type { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  //INI NANTI DIUBAH
  const [formData, setFormData] = useState({
    login: 'pegawai@example.com',
    password: 'password',
    rememberMe: true,
  }); //nanti ini dubah ya
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await loginUser(formData.login.toLowerCase(), formData.password);
      const user = response.user;

      //Check if account is active
      if (!user.isActive) {
        setError('Akun Anda sedang dinonaktifkan. Hubungi administrator');
        setIsLoading(false);
        return;
      }

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

      // Get role label untuk toast
      const roleLabels: Record<string, string> = {
        super_admin: 'Super Administrator',
        admin_layanan: 'Admin Layanan',
        admin_penyedia: 'Admin Penyedia',
        teknisi: 'Teknisi',
        pegawai: 'Pegawai',
      };

      const roleLabel = roleLabels[user.role] || user.role;

      toast.success(`Selamat datang, ${user.name}!`, {
        description: (
          <div className="text-black">
            Anda login sebagai <span className="font-medium">{roleLabel}</span>
          </div>
        ),
        style: {
          background: "#ffffff",
          color: "#000000",
        },
      });


      onLogin(user);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.body?.message || err?.body?.errors?.email?.[0] || 'Email atau password tidak valid';
      setError(errorMessage);

      // Log failed attempt
      addAuditLog({
        userId: 'unknown',
        action: 'LOGIN_FAILED',
        details: `Failed login attempt for: ${formData.login}`,
        ipAddress: 'N/A',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In production, this would send an actual email via backend API
      // await api.post('auth/forgot-password', { email: forgotPasswordEmail });

      toast.success('Link reset password telah dikirim ke email Anda (Demo)');
      setResetSuccess(true);
    } catch (err) {
      toast.error('Gagal mengirim reset password');
      console.error('Forgot password error:', err);
      setResetSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen m-0 flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Toaster />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
              <motion.div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600"
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

                  <Alert className="mb-4">
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
                    variant="link"
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
    <div className="min-h-svh flex items-center justify-center p-4 bg-[#F8F9FA]">
      <Toaster />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="w-full max-w-4xl overflow-hidden shadow-lg">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="flex flex-col justify-center p-6 pb-0 !mb-0 sm:p-10">
              <CardHeader className="p-0 px-6 mb-4 text-center md:text-left max-w-full">
                {/* Logo */}
                <div className="flex justify-center md:justify-start">
                  <div className="h-20 w-20 flex items-center justify-center rounded-full">
                    <img
                      src="/logo.svg"
                      alt="Logo BPS Provinsi NTB"
                      className="w-auto h-auto object-contain"
                    />
                  </div>
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
                        <Alert variant="destructive" className="mt-4">
                          <AlertCircle className="h-3 w-3" />
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
                        variant="link"
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
                      <Label htmlFor="remember" className="text-sm cursor-pointer font-normal">
                        Ingat Saya (30 hari)
                      </Label>
                    </div>

                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm font-normal"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Lupa Password?
                    </Button>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 p-0 !pl-6 !pr-6 mt-4">
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
            </div>
            <div className="relative hidden h-full bg-muted md:block">
              <img
                src="/banner.jpg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <img
                src="/banner.svg"
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale z-10"
              />
              <div className="absolute inset-0 z-15 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-4 z-20 w-[100%] px-4 flex flex-col gap-0">
                <h2 className="text-white text-lg font-medium mb-1">SIGAP-TI</h2>
                <div className="flex items-start gap-1 text-white text-md font-normal">
                  <span>Sistem Layanan Internal Terpadu Badan Pusat Statistik Provinsi Nusa Tenggara Barat</span>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};