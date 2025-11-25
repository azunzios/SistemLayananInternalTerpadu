import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, ShieldCheck, Wrench, Package, User, Check } from 'lucide-react';
import type { User as UserType, UserRole } from '@/types';

interface RoleSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserType;
  activeRole: UserRole;
  onRoleSwitch: (role: UserRole) => void;
}

export const RoleSwitcherDialog: React.FC<RoleSwitcherDialogProps> = ({
  open,
  onOpenChange,
  currentUser,
  activeRole,
  onRoleSwitch,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(activeRole);
  
  // Get available roles from currentUser
  const availableRoles = currentUser?.roles || [currentUser?.role];

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          icon: Shield,
          color: 'purple',
          description: 'Akses penuh ke semua fitur sistem',
        };
      case 'admin_layanan':
        return {
          label: 'Admin Layanan',
          icon: ShieldCheck,
          color: 'blue',
          description: 'Mengelola tiket perbaikan dan zoom',
        };
      case 'admin_penyedia':
        return {
          label: 'Admin Penyedia',
          icon: Package,
          color: 'green',
          description: 'Mengelola pengadaan dan work order',
        };
      case 'teknisi':
        return {
          label: 'Teknisi',
          icon: Wrench,
          color: 'orange',
          description: 'Menangani perbaikan barang',
        };
      case 'pegawai':
        return {
          label: 'Pegawai',
          icon: User,
          color: 'gray',
          description: 'Mengajukan tiket dan permintaan',
        };
      default:
        return {
          label: role,
          icon: User,
          color: 'gray',
          description: '',
        };
    }
  };

  const handleConfirm = () => {
    onRoleSwitch(selectedRole);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Pilih Peran Aktif</AlertDialogTitle>
          <AlertDialogDescription>
            Pilih peran yang ingin Anda gunakan. Dashboard akan berubah sesuai dengan peran yang dipilih.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-4">
          {availableRoles.map((role) => {
            const config = getRoleConfig(role);
            const Icon = config.icon;
            const isActive = selectedRole === role;
            const isCurrent = activeRole === role;

            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  isActive
                    ? `border-${config.color}-500 bg-${config.color}-50`
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive 
                        ? config.color === 'gray' ? 'bg-gray-800' : `bg-${config.color}-500`
                        : `bg-${config.color}-100`
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : `text-${config.color}-600`}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{config.label}</p>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          Aktif Sekarang
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                  </div>
                  {isActive && (
                    <div className={`flex-shrink-0`}>
                      <div className={`h-6 w-6 rounded-full bg-${config.color}-500 flex items-center justify-center`}>
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedRole === activeRole}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ganti ke {getRoleConfig(selectedRole).label}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};