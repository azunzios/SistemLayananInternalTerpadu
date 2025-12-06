import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Edit, 
  Trash2, 
  Briefcase,
  ShieldAlert // Ditambahkan untuk ikon saat disabled (akun sendiri)
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { User, UserRole } from '@/types';

interface UserManagementTableProps {
  users: User[];
  currentUser: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (userId: string) => void;
  getRoleBadge: (role: UserRole) => React.ReactNode;
}

// Helper untuk inisial nama
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users,
  currentUser,
  onEdit,
  onDelete,
  onToggleStatus,
  getRoleBadge,
}) => {
  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="w-[250px] border-r border-b font-semibold text-gray-900 whitespace-nowrap text-center pl-4">User Profile</TableHead>
            <TableHead className="w-[200px] border-r border-b font-semibold text-gray-900 whitespace-nowrap text-center">Email</TableHead>
            <TableHead className="w-[180px] border-r border-b font-semibold text-gray-900 whitespace-nowrap text-center">Role & Unit</TableHead>
            <TableHead className="w-[120px] border-r border-b font-semibold text-gray-900 whitespace-nowrap text-center">Status</TableHead>
            <TableHead className="w-[150px] border-r border-b font-semibold text-gray-900 whitespace-nowrap text-center">Terdaftar</TableHead>
            <TableHead className="w-[1%] border-b font-semibold text-gray-900 whitespace-nowrap text-center text-center px-4">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-[400px] text-center border-b">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Tidak ada user</h3>
                  <p className="text-sm text-gray-400 mt-1">Belum ada data user yang tersedia.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user, index) => {
              // Cek apakah user baris ini adalah user yang sedang login
              const isCurrentUser = user.id === currentUser.id;

              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-blue-50/50 transition-colors group"
                >
                  {/* Kolom Nama */}
                  <TableCell className="border-r border-b py-3 pl-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold ring-1 ring-blue-200">
                        {getInitials(user.name)}
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{user.name}</span>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                              You
                            </Badge>
                          )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Kolom Email */}
                  <TableCell className="border-r border-b py-3 align-middle whitespace-nowrap">
                     <span className="text-sm text-gray-600">{user.email}</span>
                  </TableCell>

                  {/* Kolom Role & Unit Kerja */}
                  <TableCell className="border-r border-b py-3 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {/* Role Badge */}
                      <div className="flex-shrink-0">
                        {Array.isArray(user.roles) && user.roles.length > 0
                          ? user.roles.map((r) => (
                              <div key={`${user.id}-${r}`} className="scale-90 origin-left inline-block mr-1">
                                {getRoleBadge(r)}
                              </div>
                            ))
                          : <div className="scale-90 origin-left">{getRoleBadge(user.role)}</div>
                        }
                      </div>
                      {/* Unit Kerja */}
                      <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>
                      <div className="flex items-center text-xs text-gray-600 gap-1 truncate max-w-[120px]" title={user.unitKerja}>
                        <Briefcase className="h-3 w-3 text-gray-400" />
                        <span>{user.unitKerja || '-'}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Kolom Status */}
                  <TableCell className="border-r border-b py-3 align-middle text-center whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.isActive 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                        user.isActive ? 'bg-green-600' : 'bg-red-600'
                      }`} />
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </div>
                  </TableCell>

                  {/* Kolom Tanggal */}
                  <TableCell className="border-r border-b py-3 align-middle text-sm text-gray-500 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>

                  {/* Kolom Aksi */}
                  <TableCell className="border-b py-3 px-4 align-middle text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      
                      {/* SWITCH STATUS */}
                      {currentUser.role === 'super_admin' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* Div pembungkus agar tooltip jalan meski disabled */}
                              <div className="flex items-center"> 
                                <Switch
                                  checked={user.isActive}
                                  onCheckedChange={() => onToggleStatus(user.id)}
                                  disabled={isCurrentUser} // Disabled jika diri sendiri
                                  className="data-[state=checked]:bg-green-600 scale-75 origin-center data-[disabled]:opacity-50"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {isCurrentUser 
                                  ? 'Anda tidak dapat menonaktifkan akun sendiri' 
                                  : (user.isActive ? 'Nonaktifkan User' : 'Aktifkan User')
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {/* TOMBOL EDIT (Selalu muncul) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => onEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* TOMBOL DELETE */}
                      {currentUser.role === 'super_admin' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* Span pembungkus agar tooltip jalan meski disabled */}
                              <span className="inline-block"> 
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isCurrentUser} // Disabled jika diri sendiri
                                  className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:text-gray-300 disabled:hover:bg-transparent"
                                  onClick={() => onDelete(user)}
                                >
                                  {isCurrentUser ? (
                                    <ShieldAlert className="h-4 w-4" /> // Ikon beda jika disabled
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {isCurrentUser && (
                              <TooltipContent>
                                <p>Anda tidak dapat menghapus akun sendiri</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};