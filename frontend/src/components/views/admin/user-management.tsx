import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Users, Search, Edit, Trash2, Plus, Shield, UserCheck, UserX } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getUsers, getUsersSync, addAuditLog, addNotification, api } from '@/lib/storage';
import type { User, UserRole } from '@/types';

interface UserManagementProps {
  currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  // Permission check - only Super Admin can access User Management
  if (currentUser.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Akses Ditolak
            </CardTitle>
            <CardDescription>
              Hanya Super Admin yang dapat mengakses User Management
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const [users, setUsers] = useState<User[]>(getUsersSync());
    useEffect(() => {
      getUsers()
        .then(fetched => setUsers(fetched))
        .catch(err => {
          console.warn('⚠️ Failed to fetch users for management view', err);
        });
    }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    nip: '',
    jabatan: '',
    email: '',
    roles: ['pegawai'] as UserRole[],
    unitKerja: '',
    phone: '',
    isActive: true,
  });
  const [createFormData, setCreateFormData] = useState({
    name: '',
    nip: '',
    jabatan: '',
    email: '',
    password: '',
    roles: ['pegawai'] as UserRole[],
    unitKerja: '',
    phone: '',
  });
  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin_layanan', label: 'Admin Layanan' },
    { value: 'admin_penyedia', label: 'Admin Penyedia' },
    { value: 'teknisi', label: 'Teknisi' },
    { value: 'pegawai', label: 'Pegawai' },
  ];

  // Filter users
  const filteredUsers = users.filter(user => {
    const primaryRole = user.role || user.roles?.[0] || 'pegawai';
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.unitKerja.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || primaryRole === filterRole || (user.roles ?? []).includes(filterRole as UserRole);
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      nip: user.nip,
      jabatan: user.jabatan,
      email: user.email,
      roles: user.roles ?? [user.role],
      unitKerja: user.unitKerja,
      phone: user.phone,
      isActive: user.isActive,
    });
    setShowEditDialog(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const payload: any = {
        name: editFormData.name,
        nip: editFormData.nip,
        jabatan: editFormData.jabatan,
        email: editFormData.email,
        unit_kerja: editFormData.unitKerja,
        phone: editFormData.phone,
        roles: editFormData.roles,
        is_active: editFormData.isActive,
      };

      const updated = await api.put<User>(`users/${selectedUser.id}`, payload);
      const normalized: User = { 
        ...selectedUser, 
        ...updated, 
        jabatan: updated.jabatan ?? selectedUser.jabatan, 
        role: updated.role, 
        roles: updated.roles 
      };
      const updatedUsers = users.map(u => (u.id === selectedUser.id ? normalized : u));
      setUsers(updatedUsers);

      addAuditLog({
        userId: currentUser.id,
        action: 'USER_UPDATED',
        details: `Updated user ${selectedUser.email}`,
      });

      if (selectedUser.id !== currentUser.id) {
        addNotification({
          userId: selectedUser.id,
          title: 'Profil Diperbarui',
          message: 'Profil Anda telah diperbarui oleh administrator',
          type: 'info',
          read: false,
        });
      }

      toast.success('User berhasil diperbarui');
      setShowEditDialog(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Failed to update user', err);
      toast.error('Gagal memperbarui user');
    }
  };

  const handleToggleStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = !user.isActive;

    // Optimistic UI update
    const updatedUsers = users.map(u => (u.id === userId ? { ...u, isActive: newStatus } : u));
    setUsers(updatedUsers);

    api
      .put(`users/${userId}`, { is_active: newStatus, roles: user.roles || [user.role] })
      .then(() => {
        addAuditLog({
          userId: currentUser.id,
          action: newStatus ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          details: `${newStatus ? 'Activated' : 'Deactivated'} user ${user.email}`,
        });
        toast.success(`User ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      })
      .catch(err => {
        console.error('Failed to toggle status', err);
        // revert
        setUsers(users);
        toast.error('Gagal mengubah status user');
      });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;

    api
      .delete(`users/${selectedUser.id}`)
      .then(() => {
        // Refresh list from server to keep cache in sync
        return getUsers().then(fetched => setUsers(fetched));
      })
      .then(() => {
        addAuditLog({
          userId: currentUser.id,
          action: 'USER_DELETED',
          details: `Deleted user ${selectedUser.email}`,
        });
        toast.success('User berhasil dihapus');
      })
      .catch(err => {
        console.error('Failed to delete user', err);
        toast.error('Gagal menghapus user');
      })
      .finally(() => {
        setShowDeleteDialog(false);
        setSelectedUser(null);
      });
  };

  const toggleCreateRole = (role: UserRole) => {
    setCreateFormData(prev => {
      const exists = prev.roles.includes(role);
      const roles = exists ? prev.roles.filter(r => r !== role) : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const toggleEditRole = (role: UserRole) => {
    setEditFormData(prev => {
      const exists = prev.roles.includes(role);
      const roles = exists ? prev.roles.filter(r => r !== role) : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const handleCreateUser = async () => {
    // Validate
    if (!createFormData.name || !createFormData.nip || !createFormData.jabatan || !createFormData.email || !createFormData.password) {
      toast.error('Semua field harus diisi');
      return;
    }

    // Validate NIP
    if (createFormData.nip.length !== 18 || !/^\d+$/.test(createFormData.nip)) {
      toast.error('NIP harus 18 digit angka');
      return;
    }

    // Check if email already exists
    if (users.some(u => u.email === createFormData.email.toLowerCase())) {
      toast.error('Email sudah terdaftar');
      return;
    }

    // Check if NIP already exists
    if (users.some(u => u.nip === createFormData.nip)) {
      toast.error('NIP sudah terdaftar');
      return;
    }

    if (createFormData.roles.length === 0) {
      toast.error('Pilih minimal satu role');
      return;
    }

    try {
      const payload = {
        name: createFormData.name,
        nip: createFormData.nip,
        jabatan: createFormData.jabatan,
        email: createFormData.email.toLowerCase(),
        password: createFormData.password,
        unit_kerja: createFormData.unitKerja,
        phone: createFormData.phone,
        roles: createFormData.roles,
        is_active: true,
      };

      const created = await api.post<User>('users', payload);
      const newUser: User = {
        ...created,
        jabatan: created.jabatan ?? '',
        role: created.role || created.roles?.[0] || 'pegawai',
        roles: created.roles || [created.role],
      };

      setUsers([...users, newUser]);

      addAuditLog({
        userId: currentUser.id,
        action: 'USER_CREATED',
        details: `Created new user ${newUser.email} with roles ${newUser.roles.join(', ')}`,
      });

      addNotification({
        userId: newUser.id,
        title: 'Akun Dibuat',
        message: `Selamat datang di Sistem Layanan Internal BPS NTB! Akun Anda telah dibuat oleh administrator.`,
        type: 'info',
        read: false,
      });

      toast.success('User baru berhasil dibuat');
      setShowCreateDialog(false);
      setCreateFormData({
        name: '',
        nip: '',
        jabatan: '',
        email: '',
        password: '',
        roles: ['pegawai'],
        unitKerja: '',
        phone: '',
      });
    } catch (err: any) {
      console.error('Failed to create user', err);
      toast.error('Gagal membuat user');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const config: Record<UserRole, { variant: any; label: string }> = {
      super_admin: { variant: 'destructive', label: 'Super Admin' },
      admin_layanan: { variant: 'default', label: 'Admin Layanan' },
      admin_penyedia: { variant: 'default', label: 'Admin Penyedia' },
      teknisi: { variant: 'secondary', label: 'Teknisi' },
      pegawai: { variant: 'outline', label: 'Pegawai' },
    };

    const roleConfig = config[role];
    if (!roleConfig) {
      return <Badge variant="outline">{role || 'Unknown'}</Badge>;
    }
    return <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">User Management</h1>
          <p className="text-gray-500 mt-1">Kelola pengguna dan permission</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            {users.length} Total Users
          </Badge>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah User Baru
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="!pb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Cari User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nama, email, atau unit kerja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin_layanan">Admin Layanan</SelectItem>
                  <SelectItem value="admin_penyedia">Admin Penyedia</SelectItem>
                  <SelectItem value="teknisi">Teknisi</SelectItem>
                  <SelectItem value="pegawai">Pegawai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Unit Kerja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Tidak ada user ditemukan</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          {user.id === currentUser.id && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.email}</TableCell>
                    <TableCell className="space-y-1">
                      {Array.isArray(user.roles) && user.roles.length > 0
                        ? user.roles.map(r => <div key={`${user.id}-${r}`}>{getRoleBadge(r)}</div>)
                        : getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell className="text-sm">{user.unitKerja}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <Badge variant="default" className="gap-1">
                            <UserCheck className="h-3 w-3" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <UserX className="h-3 w-3" />
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {currentUser.role === 'super_admin' && user.id !== currentUser.id && (
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleToggleStatus(user.id)}
                          />
                        )}
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {currentUser.role === 'super_admin' && user.id !== currentUser.id && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>Buat akun user baru untuk sistem</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                placeholder="Nama lengkap user"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIP</Label>
                <Input
                  placeholder="18 digit NIP"
                  maxLength={18}
                  value={createFormData.nip}
                  onChange={(e) => setCreateFormData({ ...createFormData, nip: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Jabatan</Label>
                <Input
                  placeholder="Jabatan"
                  value={createFormData.jabatan}
                  onChange={(e) => setCreateFormData({ ...createFormData, jabatan: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="nama@bps-ntb.go.id"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Password untuk user"
                value={createFormData.password}
                onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
              />
              <p className="text-xs text-gray-500">Password minimal 8 karakter</p>
            </div>

            <div className="space-y-2">
              <Label>Roles (pilih satu atau lebih)</Label>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map(opt => {
                  const checked = createFormData.roles.includes(opt.value);
                  return (
                    <label key={opt.value} className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCreateRole(opt.value)}
                        className="h-4 w-4"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unit Kerja</Label>
              <Input
                placeholder="Contoh: Bagian TI"
                value={createFormData.unitKerja}
                onChange={(e) => setCreateFormData({ ...createFormData, unitKerja: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                placeholder="Contoh: 081234567890"
                value={createFormData.phone}
                onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateUser}>Buat User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Perbarui informasi user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIP</Label>
                <Input
                  placeholder="18 digit NIP"
                  maxLength={18}
                  value={editFormData.nip}
                  onChange={(e) => setEditFormData({ ...editFormData, nip: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Jabatan</Label>
                <Input
                  placeholder="Jabatan"
                  value={editFormData.jabatan}
                  onChange={(e) => setEditFormData({ ...editFormData, jabatan: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>

            {currentUser.role === 'super_admin' && (
              <div className="space-y-2">
                <Label>Roles (pilih satu atau lebih)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map(opt => {
                    const checked = editFormData.roles.includes(opt.value);
                    return (
                      <label key={opt.value} className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEditRole(opt.value)}
                          className="h-4 w-4"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Unit Kerja</Label>
              <Input
                value={editFormData.unitKerja}
                onChange={(e) => setEditFormData({ ...editFormData, unitKerja: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleEditUser}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus user "{selectedUser?.name}"? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
