import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Eye, EyeOff, Building, UserPlus, AlertCircle, Check } from 'lucide-react';
import { toast } from "sonner";
import { motion, AnimatePresence } from 'motion/react';
import { getUsers, saveUsers, addAuditLog, addNotification } from '@/lib/storage';
import type { User } from '../types';

interface RegisterPageProps {
  onRegister: (user: User) => void;
  onBackToLogin: () => void;
}

const passwordRequirements = [
  { label: 'Minimal 8 karakter', test: (pwd: string) => pwd.length >= 8 },
  { label: 'Mengandung huruf besar', test: (pwd: string) => /[A-Z]/.test(pwd) },
  { label: 'Mengandung huruf kecil', test: (pwd: string) => /[a-z]/.test(pwd) },
  { label: 'Mengandung angka', test: (pwd: string) => /[0-9]/.test(pwd) },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    nip: '',
    jabatan: '',
    email: '',
    password: '',
    confirmPassword: '',
    unitKerja: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (): boolean => {
    return passwordRequirements.every(req => req.test(formData.password));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Nama lengkap harus diisi');
      return false;
    }
    
    if (formData.name.trim().length < 3) {
      setError('Nama lengkap minimal 3 karakter');
      return false;
    }
    
    if (!formData.nip.trim()) {
      setError('NIP harus diisi');
      return false;
    }
    
    if (formData.nip.length !== 18) {
      setError('NIP harus 18 digit');
      return false;
    }
    
    if (!/^\d+$/.test(formData.nip)) {
      setError('NIP harus berupa angka');
      return false;
    }
    
    if (!formData.jabatan.trim()) {
      setError('Jabatan harus diisi');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email harus diisi');
      return false;
    }
    
    if (!validateEmail(formData.email)) {
      setError('Format email tidak valid');
      return false;
    }
    
    if (!formData.email.toLowerCase().includes('@bps')) {
      setError('Email harus menggunakan domain BPS (@bps.go.id atau @bps-ntb.go.id)');
      return false;
    }
    
    if (!formData.unitKerja.trim()) {
      setError('Unit Kerja harus dipilih');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setError('Nomor telepon harus diisi');
      return false;
    }
    
    if (formData.phone.length < 10) {
      setError('Nomor telepon tidak valid');
      return false;
    }
    
    if (!validatePassword()) {
      setError('Password tidak memenuhi persyaratan keamanan');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return false;
    }
    
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const users = await getUsers();
      
      // Check if email already exists
      const userExists = users.some(user => 
        user.email.toLowerCase() === formData.email.toLowerCase()
      );
      
      if (userExists) {
        setError('Email sudah terdaftar dalam sistem');
        setIsLoading(false);
        return;
      }

      // Create new user with default 'pegawai' role
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: formData.email.toLowerCase(),
        password: formData.password, // In production, this should be hashed
        name: formData.name,
        nip: formData.nip,
        jabatan: formData.jabatan,
        roles: ['pegawai'],
        role: 'pegawai', // Default role for self-registration
        unitKerja: formData.unitKerja,
        phone: formData.phone,
        createdAt: new Date().toISOString(),
        isActive: true,
        failedLoginAttempts: 0,
      };

      // Save to storage
      const updatedUsers = [...users, newUser];
      saveUsers(updatedUsers);

      // Log the action
      addAuditLog({
        userId: newUser.id,
        action: 'USER_REGISTERED',
        details: `New user registered: ${newUser.email}`,
      });

      // Send welcome notification
      addNotification({
        userId: newUser.id,
        title: 'Selamat Datang!',
        message: 'Akun Anda telah berhasil dibuat. Silakan login untuk menggunakan sistem.',
        type: 'success',
        read: false,
      });

      // Notify super admin
      const superAdmins = users.filter(u => u.role === 'super_admin');
      superAdmins.forEach(admin => {
        addNotification({
          userId: admin.id,
          title: 'User Baru Terdaftar',
          message: `${newUser.name} (${newUser.email}) telah mendaftar dan menunggu verifikasi.`,
          type: 'info',
          read: false,
        });
      });

      toast.success('Registrasi berhasil! Silakan login dengan akun Anda.');
      onRegister(newUser);
    } catch (error) {
      setError('Terjadi kesalahan saat registrasi. Silakan coba lagi.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-green-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <motion.div 
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <UserPlus className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl">Daftar Akun Baru</CardTitle>
              <CardDescription className="mt-2">
                Buat akun untuk mengakses Sistem Layanan Internal BPS NTB
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleRegister}>
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
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nip">NIP *</Label>
                    <Input
                      id="nip"
                      name="nip"
                      value={formData.nip}
                      onChange={handleInputChange}
                      placeholder="18 digit NIP"
                      maxLength={18}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jabatan">Jabatan *</Label>
                    <Input
                      id="jabatan"
                      name="jabatan"
                      value={formData.jabatan}
                      onChange={handleInputChange}
                      placeholder="Jabatan"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="nama@bps-ntb.go.id"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitKerja">Unit Kerja *</Label>
                  <Select value={formData.unitKerja} onValueChange={(value) => setFormData(prev => ({ ...prev, unitKerja: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bagian Umum">Bagian Umum</SelectItem>
                      <SelectItem value="Subbag Tata Usaha">Subbag Tata Usaha</SelectItem>
                      <SelectItem value="Subbag Kepegawaian">Subbag Kepegawaian</SelectItem>
                      <SelectItem value="Bidang Statistik Sosial">Bidang Statistik Sosial</SelectItem>
                      <SelectItem value="Bidang Statistik Produksi">Bidang Statistik Produksi</SelectItem>
                      <SelectItem value="Bidang Statistik Distribusi">Bidang Statistik Distribusi</SelectItem>
                      <SelectItem value="Bidang IPDS">Bidang IPDS</SelectItem>
                      <SelectItem value="Bidang Neraca Wilayah">Bidang Neraca Wilayah</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="08123456789"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="Masukkan password"
                      required
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
                  
                  {(passwordFocused || formData.password) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 p-3 bg-gray-50 rounded-lg border"
                    >
                      <p className="text-xs text-gray-600 mb-2">Persyaratan password:</p>
                      <div className="space-y-1">
                        {passwordRequirements.map((req, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            {req.test(formData.password) ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border-2 border-gray-300" />
                            )}
                            <span className={req.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Ulangi password"
                      required
                    />
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" 
                disabled={isLoading}
              >
                {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
              </Button>
              <Button 
                type="button" 
                variant="link" 
                className="w-full"
                onClick={onBackToLogin}
              >
                Sudah punya akun? Masuk di sini
              </Button>
            </CardFooter>
          </form>
          
          <CardFooter className="pt-0">
            <div className="w-full">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">Informasi Registrasi</span>
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  <div>• Akun baru akan memiliki role "Pegawai" secara default</div>
                  <div>• Hubungi Super Admin untuk upgrade permission</div>
                  <div>• Gunakan email resmi BPS untuk registrasi</div>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 BPS Provinsi Nusa Tenggara Barat
        </p>
      </motion.div>
    </div>
  );
};
