import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { copyToClipboard } from '@/lib/clipboard';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Video,
  Edit,
  Save,
  X,
  Copy,
  Check,
  Key,
  AlertCircle,
  Shield,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import type { Ticket } from '@/types';

interface ZoomAccount {
  id: string;
  name: string;
  email: string;
  hostKey: string;
  planType: string;
  isActive: boolean;
  description: string;
  maxParticipants: number;
  color: string;
}

interface ZoomAccountManagementProps {
  tickets: Ticket[];
}

export const ZoomAccountManagement: React.FC<ZoomAccountManagementProps> = ({ tickets }) => {
  const [accounts, setAccounts] = useState<ZoomAccount[]>([]);

  const [editingAccount, setEditingAccount] = useState<ZoomAccount | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<ZoomAccount | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ hostKey?: string; planType?: string }>({});

  // Load zoom accounts from backend on mount
  useEffect(() => {
    loadAccountsFromApi();
  }, []);

  const loadAccountsFromApi = async () => {
    try {
      const data = await api.get<any[]>('zoom/accounts');
      // Normalize snake_case from API to camelCase for frontend
      const normalizedAccounts = data.map((acc: any) => ({
        id: acc.account_id || acc.id,
        name: acc.name,
        email: acc.email,
        hostKey: acc.host_key || acc.hostKey,
        planType: acc.plan_type || acc.planType,
        isActive: acc.is_active ?? acc.isActive ?? false,
        description: acc.description,
        maxParticipants: acc.max_participants || acc.maxParticipants,
        color: acc.color,
      }));
      setAccounts(normalizedAccounts);
    } catch (err) {
      console.error('Failed to load accounts:', err);
      toast.error('Gagal memuat slot zoom');
    }
  };


  const handleAddNew = () => {
    const colors = ['blue', 'purple', 'green', 'orange', 'red', 'teal', 'indigo', 'pink'];
    const newSlotNumber = accounts.length + 1;
    const colorIndex = (accounts.length) % colors.length;

    const newAccount: ZoomAccount = {
      id: `zoom${Date.now()}`,
      name: `Slot Zoom ${newSlotNumber}`,
      email: `zoom${newSlotNumber}@bps-ntb.go.id`,
      hostKey: '',
      planType: 'Pro',
      isActive: false,
      description: 'Slot baru - silakan atur kredensial akun Zoom yang sudah ada',
      maxParticipants: 100,
      color: colors[colorIndex],
    };

    setEditingAccount(newAccount);
    setIsDialogOpen(true);
  };

  const handleEdit = (account: ZoomAccount) => {
    setEditingAccount({ ...account });
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingAccount) return;

    // Validasi Host Key
    const hostKeyRegex = /^\d{6}$/;
    const hostKeyValid = hostKeyRegex.test(editingAccount.hostKey);

    // Validasi Plan Type
    const validPlanTypes = ['Pro', 'Business', 'Enterprise'];
    const planTypeValid = validPlanTypes.includes(editingAccount.planType);

    // Set validation errors
    const errors: { hostKey?: string; planType?: string } = {};
    if (!hostKeyValid) {
      errors.hostKey = 'Host Key harus 6 digit angka';
    }
    if (!planTypeValid) {
      errors.planType = `Harus salah satu: ${validPlanTypes.join(', ')}`;
    }

    setValidationErrors(errors);

    // If ada error, stop
    if (!hostKeyValid || !planTypeValid) {
      toast.error('Validasi gagal', {
        description: 'Silakan periksa kembali data yang Anda input',
      });
      return;
    }

    // Check if this is a new account (not in the list yet)
    const isNewAccount = !accounts.find(acc => acc.id === editingAccount.id);

    const saveToApi = async () => {
      try {
        if (isNewAccount) {
          // POST for new account
          await api.post('zoom/accounts', {
            account_id: editingAccount.id,
            name: editingAccount.name,
            email: editingAccount.email,
            host_key: editingAccount.hostKey,
            plan_type: editingAccount.planType,
            max_participants: editingAccount.maxParticipants,
            description: editingAccount.description,
            color: editingAccount.color,
            is_active: editingAccount.isActive,
          });
          toast.success('Slot berhasil ditambahkan', {
            description: `${editingAccount.name} telah didaftarkan`,
          });
        } else {
          // PUT for existing account - use account_id as the lookup parameter
          await api.put(`zoom/accounts/${editingAccount.id}`, {
            name: editingAccount.name,
            email: editingAccount.email,
            host_key: editingAccount.hostKey,
            plan_type: editingAccount.planType,
            max_participants: editingAccount.maxParticipants,
            description: editingAccount.description,
            color: editingAccount.color,
            is_active: editingAccount.isActive,
          });
          toast.success('Slot berhasil diperbarui', {
            description: `${editingAccount.name} telah diupdate`,
          });
        }
        setAccounts(isNewAccount ? [...accounts, editingAccount] : accounts.map(acc =>
          acc.id === editingAccount.id ? editingAccount : acc
        ));
        setIsDialogOpen(false);
        setEditingAccount(null);
        setValidationErrors({});
      } catch (err) {
        console.error('Failed to save account:', err);
        toast.error('Gagal menyimpan slot');
      }
    };

    saveToApi();
  };

  const handleToggleActive = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    const newStatus = !account.isActive;

    // Save to API individually
    const saveToggle = async () => {
      try {
        // Send full account data with updated is_active flag
        await api.put(`zoom/accounts/${accountId}`, {
          name: account.name,
          email: account.email,
          host_key: account.hostKey,
          plan_type: account.planType,
          max_participants: account.maxParticipants,
          description: account.description,
          color: account.color,
          is_active: newStatus,
        });

        // Reload accounts from API to get fresh data from database
        await loadAccountsFromApi();

        if (newStatus) {
          toast.success(`${account.name} diaktifkan`, {
            description: 'Slot sekarang tersedia untuk booking',
          });
        } else {
          toast.warning(`${account.name} dinonaktifkan`, {
            description: 'Slot tidak tersedia untuk booking',
          });
        }
      } catch (err) {
        console.error('Failed to update account:', err);
        toast.error('Gagal mengupdate status slot');
      }
    };
    saveToggle();
  };

  const handleCopy = async (text: string, fieldName: string) => {
    const success = await copyToClipboard(text);

    if (success) {
      setCopiedField(fieldName);
      toast.success('Berhasil disalin!', {
        description: `${fieldName} telah disalin ke clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.error('Gagal menyalin', {
        description: 'Silakan salin secara manual',
      });
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;

    try {
      await api.delete(`zoom/accounts/${accountToDelete.id}`);

      // Reload accounts from API after successful delete
      await loadAccountsFromApi();

      toast.success('Slot berhasil dihapus', {
        description: `${accountToDelete.name} telah dihapus dari sistem`,
      });
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete account:', err);

      // Handle specific error cases
      if (err.response?.status === 422) {
        const activeBookings = err.response?.data?.active_bookings || 0;
        toast.error('Tidak dapat menghapus slot', {
          description: `Slot masih memiliki ${activeBookings} booking aktif. Hapus semua booking terlebih dahulu.`,
        });
      } else {
        toast.error('Gagal menghapus slot', {
          description: 'Silakan coba lagi nanti',
        });
      }
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
    }
  };



  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; light: string }> = {
      blue: {
        bg: 'bg-blue-500',
        border: 'border-blue-300',
        text: 'text-blue-600',
        light: 'bg-blue-50'
      },
      purple: {
        bg: 'bg-purple-500',
        border: 'border-purple-300',
        text: 'text-purple-600',
        light: 'bg-purple-50'
      },
      green: {
        bg: 'bg-green-500',
        border: 'border-green-300',
        text: 'text-green-600',
        light: 'bg-green-50'
      },
      orange: {
        bg: 'bg-orange-500',
        border: 'border-orange-300',
        text: 'text-orange-600',
        light: 'bg-orange-50'
      },
      red: {
        bg: 'bg-red-500',
        border: 'border-red-300',
        text: 'text-red-600',
        light: 'bg-red-50'
      },
      teal: {
        bg: 'bg-teal-500',
        border: 'border-teal-300',
        text: 'text-teal-600',
        light: 'bg-teal-50'
      },
      indigo: {
        bg: 'bg-indigo-500',
        border: 'border-indigo-300',
        text: 'text-indigo-600',
        light: 'bg-indigo-50'
      },
      pink: {
        bg: 'bg-pink-500',
        border: 'border-pink-300',
        text: 'text-pink-600',
        light: 'bg-pink-50'
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            Manajemen Slot Zoom
          </h1>
          <p className="text-sm text-muted-foreground">Kelola slot dan kredensial Zoom untuk booking meeting</p>
        </div>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Slot
        </Button>
      </div>

      {/* Info Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Tentang Slot Zoom</p>
              <p className="text-sm text-blue-700 mt-1">
                Slot Zoom adalah representasi akun Zoom yang sudah ada di organisasi Anda. 
                Menambah slot di sini <strong>tidak</strong> membuat akun Zoom baru, 
                melainkan mendaftarkan kredensial akun Zoom yang sudah ada agar dapat digunakan untuk booking meeting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((account, index) => {
          const colorClasses = getColorClasses(account.color);

          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`pb-4 gap-0 border-2 ${account.isActive ? colorClasses.border : 'border-gray-300'}`}>
                <CardHeader className="p-4 !pb-0 m-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`h-10 w-10 ${colorClasses.bg} rounded-lg flex items-center justify-center flex-shrink-0 ${!account.isActive && 'opacity-50'}`}>
                        <Video className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{account.name}</CardTitle>
                          <Badge variant={account.isActive ? 'default' : 'secondary'} className="text-xs">
                            {account.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1 text-xs truncate">{account.email}</CardDescription>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">{account.description}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <Switch
                          checked={account.isActive}
                          onCheckedChange={() => handleToggleActive(account.id)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  {/* Account Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" />
                      Spesifikasi & Keamanan
                    </h4>

                      {/* Plan Type & Max Participants */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Tipe Akun</Label>
                        <div className="p-2.5 bg-gray-50 rounded-md border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Zoom {account.planType}</p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                Maks. {account.maxParticipants} peserta
                              </p>
                            </div>
                            <Badge variant="outline" className={`text-xs ${colorClasses.text}`}>
                              {account.planType}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Host Key */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500 flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          Host Key
                        </Label>
                        {!account.hostKey || account.hostKey.trim() === '' ? (
                          <div className="p-2.5 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2 text-red-700">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <p className="text-xs font-semibold">Isi Host Key</p>
                            </div>
                            <p className="text-xs text-red-600 mt-0.5">
                              Host Key belum diatur
                            </p>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value="••••••"
                              readOnly
                              className="font-mono bg-gray-50 text-sm h-9"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => handleCopy(account.hostKey, 'Host Key')}
                            >
                              {copiedField === 'Host Key' ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Klik salin untuk menyalin Host Key
                        </p>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Slot Zoom</DialogTitle>
            <DialogDescription>
              Perbarui kredensial dan pengaturan slot Zoom
            </DialogDescription>
          </DialogHeader>

          {editingAccount && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nama Slot</Label>
                  <Input
                    id="edit-name"
                    value={editingAccount.name}
                    onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingAccount.email}
                    onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-host-key">Host Key</Label>
                  <Input
                    id="edit-host-key"
                    value={editingAccount.hostKey}
                    onChange={(e) => setEditingAccount({ ...editingAccount, hostKey: e.target.value })}
                    className={`font-mono ${validationErrors.hostKey ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Masukkan Host Key"
                  />
                  {validationErrors.hostKey ? (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.hostKey}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">6 digit kode untuk host meeting</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-plan-type">Tipe Plan</Label>
                  <Input
                    id="edit-plan-type"
                    value={editingAccount.planType}
                    onChange={(e) => setEditingAccount({ ...editingAccount, planType: e.target.value })}
                    className={`${validationErrors.planType ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Pro, Business, Enterprise"
                  />
                  {validationErrors.planType ? (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.planType}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Pro, Business, Enterprise</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Deskripsi</Label>
                <Textarea
                  id="edit-description"
                  value={editingAccount.description}
                  onChange={(e) => setEditingAccount({ ...editingAccount, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-max-participants">Kapasitas Maksimal</Label>
                <Input
                  id="edit-max-participants"
                  type="number"
                  value={editingAccount.maxParticipants}
                  onChange={(e) => setEditingAccount({ ...editingAccount, maxParticipants: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {/* Delete button on the left (only for existing accounts) */}
            {editingAccount && accounts.find(acc => acc.id === editingAccount.id) && (
              <div className="flex-1">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setAccountToDelete(editingAccount);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Slot
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Simpan
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Konfirmasi Hapus Slot
            </DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Slot akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>

          {accountToDelete && (
            <div className="space-y-4 py-4">
              {/* Warning Box */}
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Peringatan!</p>
                    <p className="text-sm text-red-700 mt-1">
                      Anda akan menghapus slot <span className="font-semibold">{accountToDelete.name}</span>.
                      Semua data slot ini akan hilang.
                    </p>
                  </div>
                </div>
              </div>

              {/* Slot Details */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Nama Slot</p>
                  <p className="font-semibold">{accountToDelete.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-mono text-sm">{accountToDelete.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipe Plan</p>
                  <p>Zoom {accountToDelete.planType}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setAccountToDelete(null);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Ya, Hapus Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};