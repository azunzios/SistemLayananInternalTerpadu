import React, { useState } from 'react';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User as Key, CheckCircle, Eye, EyeOff, Camera } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { api, API_BASE_URL } from '@/lib/api';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';

interface ProfileSettingsProps {
  currentUser: User;
  onUserUpdate: (user: User) => void;
  onNavigate: (view: ViewType) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  currentUser,
  onUserUpdate,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    nip: currentUser.nip,
    jabatan: currentUser.jabatan,
    email: currentUser.email,
    phone: currentUser.phone,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarUrl = React.useMemo(() => {
    if (!currentUser.avatar) return null;
    if (currentUser.avatar.startsWith('http')) return currentUser.avatar;
    const rawPath = currentUser.avatar.replace(/^\/?/, '');
    const cleanPath = rawPath.startsWith('storage/') ? rawPath : `storage/${rawPath}`;
    // Use API base without trailing /api for file access
    const fileBase = (API_BASE_URL || '').replace(/\/api$/i, '');
    return fileBase ? `${fileBase}/${cleanPath}` : `/${cleanPath}`;
  }, [currentUser.avatar]);

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      setIsUploadingAvatar(true);
      // Do NOT set Content-Type manually; let browser set boundary
      const response = await api.post<User>('/upload-avatar', formData);
      const updatedUser = (response as any)?.data ?? response;
      onUserUpdate(updatedUser);
      sessionStorage.setItem('bps_current_user', JSON.stringify(updatedUser));
      toast.success('Avatar berhasil diupload');
    } catch (err: any) {
      console.error('Failed to upload avatar', err);
      const message = err?.body?.message || 'Gagal mengupload avatar';
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const response = await api.put<{ message: string; user: User }>('/profile', profileData);
      
      if (response && response.user) {
        onUserUpdate(response.user);
        toast.success('Profil berhasil diperbarui');
        // persist latest profile (including potential avatar updates from server)
        sessionStorage.setItem('bps_current_user', JSON.stringify(response.user));
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const message = error?.body?.message || 'Gagal memperbarui profil';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const validatePassword = (password: string): boolean => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    };

    return Object.values(requirements).every(req => req);
  };

  const handleChangePassword = async () => {
    // Validate new password
    if (!validatePassword(passwordData.newPassword)) {
      toast.error('Password baru tidak memenuhi persyaratan keamanan');
      return;
    }

    // Validate confirmation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    // Check if new password is different
    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.error('Password baru harus berbeda dengan password lama');
      return;
    }

    setIsUpdating(true);
    try {
      await api.post('/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword,
      });

      toast.success('Password berhasil diubah');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      const message = error?.body?.message || error?.body?.errors?.current_password?.[0] || 'Gagal mengubah password';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      super_admin: 'Super Administrator',
      admin_layanan: 'Admin Layanan',
      admin_penyedia: 'Admin Penyedia',
      teknisi: 'Teknisi',
      pegawai: 'Pegawai',
      user: 'Pegawai',
    };
    return labels[role] || role;
  };
  const userRoles = React.useMemo(() => {
    const roles = Array.isArray(currentUser.roles) && currentUser.roles.length > 0
      ? currentUser.roles
      : [currentUser.role];
    // Remove duplicates and falsy values
    const unique = Array.from(new Set(roles.filter(Boolean)));
    return unique.length > 0 ? unique : ['pegawai'];
  }, [currentUser.roles, currentUser.role]);

  const passwordRequirements = [
    { label: 'Minimal 8 karakter', test: (pwd: string) => pwd.length >= 8 },
    { label: 'Mengandung huruf besar dan kecil', test: (pwd: string) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) },
    { label: 'Mengandung angka', test: (pwd: string) => /[0-9]/.test(pwd) },
    { label: 'Mengandung karakter khusus (!@#$%^&*)', test: (pwd: string) => /[!@#$%^&*]/.test(pwd) },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl">Profil Pengguna</h1>
        <p className="text-gray-500 mt-1">Kelola informasi profil dan keamanan akun Anda</p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Profile Card */}
        <div className="lg:col-span-1">
          <Card className="pb-4 bg-transparent border-none">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Avatar with Camera Button */}
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    {avatarUrl && (
                      <AvatarImage
                        src={avatarUrl}
                        alt={currentUser.name}
                      />
                    )}
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    className="absolute bottom-0 right-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error('Ukuran file maksimal 2MB');
                        return;
                      }
                      handleAvatarUpload(file);
                    }}
                  />
                </div>

                {/* Name and Role */}
                <div className="space-y-2 w-full">
                  <h2 className="text-xl">{currentUser.name}</h2>
                  <p className="text-gray-600 text-sm">{currentUser.unitKerja}</p>
                </div>

                <Separator />

                {/* Contact Info */}
                <div className="w-full space-y-3 text-left">
                  <div>
                    <p className="text-xs text-gray-500">NIP</p>
                    <p className="font-mono text-sm">{currentUser.nip}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm">{currentUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telepon</p>
                    <p className="text-sm">{currentUser.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Content */}
        <div className="lg:col-span-2">
          <Card className="pb-4">
            <CardContent className="pt-6">
              {/* Toggle Buttons */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={activeTab === 'profile' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setActiveTab('profile')}
                >
                  Data Profil
                </Button>
                <Button
                  variant={activeTab === 'password' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setActiveTab('password')}
                >
                  Ubah Password
                </Button>
              </div>

              {/* Data Profil Content */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap *</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nip">NIP *</Label>
                      <Input
                        id="nip"
                        value={profileData.nip}
                        onChange={(e) => setProfileData({ ...profileData, nip: e.target.value })}
                        placeholder="18 digit NIP"
                        maxLength={18}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jabatan">Jabatan *</Label>
                      <Input
                        id="jabatan"
                        value={profileData.jabatan}
                        onChange={(e) => setProfileData({ ...profileData, jabatan: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Nomor Telepon *</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unitKerja">Unit Kerja *</Label>
                      <Input
                        id="unitKerja"
                        value={currentUser.unitKerja}
                        disabled
                      />
                      <p className="text-xs text-gray-500">
                        Hubungi administrator untuk mengubah unit kerja
                      </p>
                    </div>
                  </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {userRoles.map(role => (
                        <Badge key={role} variant="default">
                          {getRoleLabel(role)}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Hubungi Super Admin untuk upgrade role
                    </p>
                  </div>
                </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Ubah Password Content */}
              {activeTab === 'password' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Password Saat Ini *</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          placeholder="Masukkan password saat ini"
                        />
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Password Baru *</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          placeholder="Masukkan password baru"
                        />
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Konfirmasi Password Baru *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          placeholder="Ulangi password baru"
                        />
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {passwordData.confirmPassword &&
                        passwordData.newPassword !== passwordData.confirmPassword && (
                          <p className="text-xs text-red-600">Password tidak cocok</p>
                        )}
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 mb-3">Persyaratan Password:</p>
                    <ul className="space-y-2">
                      {passwordRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span
                            className={
                              passwordData.newPassword && req.test(passwordData.newPassword)
                                ? 'text-green-600'
                                : 'text-gray-700'
                            }
                          >
                            {req.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        })
                      }
                    >
                      Reset
                    </Button>
                    <Button onClick={handleChangePassword} disabled={isUpdating}>
                      <Key className="h-4 w-4 mr-2" />
                      {isUpdating ? 'Mengubah...' : 'Ubah Password'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
