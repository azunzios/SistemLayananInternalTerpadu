import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { copyToClipboard } from '../lib/clipboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Video,
  Edit,
  Save,
  X,
  Copy,
  Check,
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  Settings,
  Key,
  Link2,
  BarChart3,
  AlertCircle,
  Shield,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import type { Ticket } from '../types';

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

const DEFAULT_ACCOUNTS: ZoomAccount[] = [
  {
    id: 'zoom1',
    name: 'Akun Zoom 1',
    email: 'zoom1@bps-ntb.go.id',
    hostKey: '123456',
    planType: 'Pro',
    isActive: true,
    description: 'Akun utama untuk meeting rutin dan keperluan umum',
    maxParticipants: 100,
    color: 'blue',
  },
  {
    id: 'zoom2',
    name: 'Akun Zoom 2',
    email: 'zoom2@bps-ntb.go.id',
    hostKey: '234567',
    planType: 'Pro',
    isActive: true,
    description: 'Akun cadangan untuk meeting simultan',
    maxParticipants: 100,
    color: 'purple',
  },
  {
    id: 'zoom3',
    name: 'Akun Zoom 3',
    email: 'zoom3@bps-ntb.go.id',
    hostKey: '345678',
    planType: 'Business',
    isActive: true,
    description: 'Akun untuk webinar dan meeting besar',
    maxParticipants: 300,
    color: 'green',
  },
];

export const ZoomAccountManagement: React.FC<ZoomAccountManagementProps> = ({ tickets }) => {
  const [accounts, setAccounts] = useState<ZoomAccount[]>(() => {
    const stored = localStorage.getItem('bps_ntb_zoom_accounts');
    if (stored) {
      const parsedAccounts = JSON.parse(stored);
      // Migrate old accounts format to new format
      return parsedAccounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        email: acc.email,
        hostKey: acc.hostKey || '', // Use existing hostKey or empty string
        planType: acc.planType || 'Pro', // Default to Pro if not specified
        isActive: acc.isActive,
        description: acc.description,
        maxParticipants: acc.maxParticipants,
        color: acc.color,
      }));
    }
    return DEFAULT_ACCOUNTS;
  });

  const [editingAccount, setEditingAccount] = useState<ZoomAccount | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<ZoomAccount | null>(null);

  // Save to localStorage whenever accounts change
  useEffect(() => {
    localStorage.setItem('bps_ntb_zoom_accounts', JSON.stringify(accounts));
    // Trigger custom event for same-window updates
    window.dispatchEvent(new Event('localStorageUpdate'));
  }, [accounts]);

  const handleAddNew = () => {
    const colors = ['blue', 'purple', 'green', 'orange', 'red', 'teal', 'indigo', 'pink'];
    const newAccountNumber = accounts.length + 1;
    const colorIndex = (accounts.length) % colors.length;
    
    const newAccount: ZoomAccount = {
      id: `zoom${Date.now()}`,
      name: `Akun Zoom ${newAccountNumber}`,
      email: `zoom${newAccountNumber}@bps-ntb.go.id`,
      hostKey: '',
      planType: 'Pro',
      isActive: false,
      description: 'Akun baru - silakan atur kredensial',
      maxParticipants: 100,
      color: colors[colorIndex],
    };
    
    setEditingAccount(newAccount);
    setIsDialogOpen(true);
  };

  const handleEdit = (account: ZoomAccount) => {
    setEditingAccount({ ...account });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingAccount) return;

    // Check if this is a new account (not in the list yet)
    const isNewAccount = !accounts.find(acc => acc.id === editingAccount.id);
    
    let updatedAccounts;
    if (isNewAccount) {
      updatedAccounts = [...accounts, editingAccount];
      toast.success('Akun berhasil ditambahkan', {
        description: `${editingAccount.name} telah dibuat`,
      });
    } else {
      updatedAccounts = accounts.map(acc => 
        acc.id === editingAccount.id ? editingAccount : acc
      );
      toast.success('Akun berhasil diperbarui', {
        description: `${editingAccount.name} telah diupdate`,
      });
    }
    
    setAccounts(updatedAccounts);
    setIsDialogOpen(false);
    setEditingAccount(null);
  };

  const handleToggleActive = (accountId: string) => {
    const updatedAccounts = accounts.map(acc =>
      acc.id === accountId ? { ...acc, isActive: !acc.isActive } : acc
    );
    setAccounts(updatedAccounts);
    
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      if (account.isActive) {
        toast.warning(`${account.name} dinonaktifkan`, {
          description: 'Akun tidak tersedia untuk booking',
        });
      } else {
        toast.success(`${account.name} diaktifkan`, {
          description: 'Akun sekarang tersedia untuk booking',
        });
      }
    }
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

  const handleDelete = () => {
    if (!accountToDelete) return;
    const updatedAccounts = accounts.filter(acc => acc.id !== accountToDelete.id);
    setAccounts(updatedAccounts);
    toast.success('Akun berhasil dihapus', {
      description: `${accountToDelete.name} telah dihapus`,
    });
    setShowDeleteConfirm(false);
    setAccountToDelete(null);
  };

  // Get statistics for each account
  const getAccountStats = (accountId: string) => {
    const accountBookings = tickets.filter(t => t.data?.zoomAccount === accountId);
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: accountBookings.length,
      approved: accountBookings.filter(t => t.status === 'approved').length,
      pending: accountBookings.filter(t => 
        t.status === 'menunggu_review' || t.status === 'pending_approval'
      ).length,
      todayBookings: accountBookings.filter(t => t.data?.meetingDate === today).length,
    };
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
          <h2 className="text-2xl flex items-center gap-3">
            <Settings className="h-6 w-6 text-blue-600" />
            Manajemen Akun Zoom
          </h2>
          <p className="text-gray-500 mt-1">
            Kelola kredensial dan pengaturan akun Zoom
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Akun
        </Button>
      </div>

      {/* Accounts Grid */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {accounts.map((account, index) => {
          const stats = getAccountStats(account.id);
          const colorClasses = getColorClasses(account.color);

          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border-2 ${account.isActive ? colorClasses.border : 'border-gray-300'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 ${colorClasses.bg} rounded-lg flex items-center justify-center ${!account.isActive && 'opacity-50'}`}>
                        <Video className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle>{account.name}</CardTitle>
                          <Badge variant={account.isActive ? 'default' : 'secondary'}>
                            {account.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">{account.email}</CardDescription>
                        <p className="text-sm text-gray-600 mt-1">{account.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <p className="text-xs text-gray-500">Status Akun</p>
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
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Account Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Spesifikasi & Credentials Section */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Spesifikasi & Keamanan
                      </h4>
                      
                      {/* Plan Type & Max Participants */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Tipe Akun</Label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">Zoom {account.planType}</p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                Maksimal {account.maxParticipants} peserta
                              </p>
                            </div>
                            <Badge variant="outline" className={colorClasses.text}>
                              {account.planType}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Host Key */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500 flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          Host Key
                        </Label>
                        {!account.hostKey || account.hostKey.trim() === '' ? (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                              <AlertCircle className="h-4 w-4" />
                              <p className="text-sm font-semibold">Isi Host Key</p>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                              Host Key belum diatur untuk akun ini
                            </p>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input 
                              value="••••••" 
                              readOnly 
                              className="font-mono bg-gray-50"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCopy(account.hostKey, 'Host Key')}
                            >
                              {copiedField === 'Host Key' ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Klik salin untuk menyalin Host Key asli
                        </p>
                      </div>
                    </div>

                    {/* Statistics Section */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Statistik Penggunaan
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Card className={colorClasses.light}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className={`h-4 w-4 ${colorClasses.text}`} />
                              <p className="text-xs text-gray-600">Total Booking</p>
                            </div>
                            <p className={`text-2xl ${colorClasses.text}`}>
                              {stats.total}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-green-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Check className="h-4 w-4 text-green-600" />
                              <p className="text-xs text-gray-600">Disetujui</p>
                            </div>
                            <p className="text-2xl text-green-600">
                              {stats.approved}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-yellow-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-yellow-600" />
                              <p className="text-xs text-gray-600">Pending</p>
                            </div>
                            <p className="text-2xl text-yellow-600">
                              {stats.pending}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-blue-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <p className="text-xs text-gray-600">Hari Ini</p>
                            </div>
                            <p className="text-2xl text-blue-600">
                              {stats.todayBookings}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
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
            <DialogTitle>Edit Akun Zoom</DialogTitle>
            <DialogDescription>
              Perbarui kredensial dan pengaturan akun Zoom
            </DialogDescription>
          </DialogHeader>
          
          {editingAccount && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nama Akun</Label>
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
                    className="font-mono"
                    placeholder="Masukkan Host Key"
                  />
                  <p className="text-xs text-gray-500">6 digit kode untuk host meeting</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-plan-type">Tipe Plan</Label>
                  <Input
                    id="edit-plan-type"
                    value={editingAccount.planType}
                    onChange={(e) => setEditingAccount({ ...editingAccount, planType: e.target.value })}
                    placeholder="Pro, Business, Enterprise"
                  />
                  <p className="text-xs text-gray-500">Contoh: Pro, Business</p>
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
                  Hapus Akun
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
              Konfirmasi Hapus Akun
            </DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Akun akan dihapus secara permanen.
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
                      Anda akan menghapus akun <span className="font-semibold">{accountToDelete.name}</span>.
                      Semua data akun ini akan hilang.
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Nama Akun</p>
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
              Ya, Hapus Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};