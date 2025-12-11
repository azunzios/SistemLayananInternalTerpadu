import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, getUsersSync, addAuditLog, addNotification, api } from '@/lib/storage';
import type { User, UserRole } from '@/types';

import { UserManagementFilters } from './user-management-filters';
import { UserManagementTable } from './user-management-table';
import { UserManagementDialogs } from './user-management-dialogs';

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
      if (editFormData.roles.length === 0) {
        toast.error('User harus memiliki minimal satu role');
        return;
      }

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
        
        toast.error('Tidak dapat menghapus user', {
          description: 'Periksa: User ini memiliki data terkait di sistem (tiket, work order, notifikasi, dll) dan tidak dapat dihapus. Silakan nonaktifkan user sebagai gantinya.',
          descriptionClassName: '!text-black',
        });
      })
      .finally(() => {
        setShowDeleteDialog(false);
        setSelectedUser(null);
      });
  };

  const toggleCreateRole = (role: UserRole) => {
    setCreateFormData(prev => {
      const exists = prev.roles.includes(role);
      if (exists && prev.roles.length <= 1) {
        toast.warning('User harus memiliki minimal satu role');
        return prev;
      }
      const roles = exists ? prev.roles.filter(r => r !== role) : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const toggleEditRole = (role: UserRole) => {
    setEditFormData(prev => {
      const exists = prev.roles.includes(role);
      if (exists && prev.roles.length <= 1) {
        toast.warning('User harus memiliki minimal satu role');
        return prev;
      }
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
      <div className="flex items-start justify-between max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
          <h1 className="text-3xl font-bold max-md:text-2xl">User Management</h1>
          <p className="text-gray-500 mt-1 max-md:text-sm">Kelola pengguna dan permission</p>
        </div>
        <div className="flex items-center gap-3 max-md:flex-col max-md:items-stretch max-md:w-full">
          <Badge variant="outline" className="gap-2 justify-center py-2 md:py-1">
            <Users className="h-4 w-4" />
            {users.length} Total Users
          </Badge>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2 max-md:w-full">
            <Plus className="h-4 w-4" />
            Tambah User Baru
          </Button>
        </div>
      </div>

      {/* Filters */}
      <UserManagementFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterRole={filterRole}
        onRoleChange={setFilterRole}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
      />

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <UserManagementTable
            users={filteredUsers}
            currentUser={currentUser}
            onEdit={openEditDialog}
            onDelete={(user) => {
              setSelectedUser(user);
              setShowDeleteDialog(true);
            }}
            onToggleStatus={handleToggleStatus}
            getRoleBadge={getRoleBadge}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserManagementDialogs
        showCreateDialog={showCreateDialog}
        onCreateDialogChange={setShowCreateDialog}
        createFormData={createFormData}
        onCreateFormChange={setCreateFormData}
        onCreateToggleRole={toggleCreateRole}
        onCreateSubmit={handleCreateUser}
        showEditDialog={showEditDialog}
        onEditDialogChange={setShowEditDialog}
        editFormData={editFormData}
        onEditFormChange={setEditFormData}
        onEditToggleRole={toggleEditRole}
        onEditSubmit={handleEditUser}
        editingUser={selectedUser}
        showDeleteDialog={showDeleteDialog}
        onDeleteDialogChange={setShowDeleteDialog}
        deletingUser={selectedUser}
        onDeleteSubmit={handleDeleteUser}
        currentUserRole={currentUser.role}
      />

    </div>
  );
};
