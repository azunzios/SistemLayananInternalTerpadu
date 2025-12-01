import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, Truck, Search, Clock, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { getWorkOrders, getTickets, getUsersSync, updateWorkOrder, addNotification } from '@/lib/storage';
import type { User, WorkOrder, WorkOrderStatus } from '@/types';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface AdminPenyediaWorkOrderListProps {
  currentUser: User;
}

const statusConfig: Record<WorkOrderStatus, { label: string; color: string; icon: any }> = {
  requested: { label: 'Diminta', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_procurement: { label: 'Dalam Pengadaan', color: 'bg-blue-100 text-blue-800', icon: Package },
  completed: { label: 'Selesai', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  unsuccessful: { label: 'Gagal', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const AdminPenyediaWorkOrderList: React.FC<AdminPenyediaWorkOrderListProps> = ({
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<WorkOrderStatus>('in_procurement');
  const [updateNotes, setUpdateNotes] = useState('');

  const tickets = getTickets();
  const users = getUsersSync();
  const allWorkOrders = getWorkOrders();

  // Apply filters
  const filteredWorkOrders = useMemo(() => {
    return allWorkOrders.filter(wo => {
      // Status filter
      if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
      
      // Type filter
      if (typeFilter !== 'all' && wo.type !== typeFilter) return false;
      
      // Search filter
      if (searchQuery) {
        const ticket = tickets.find(t => t.id === wo.ticketId);
        const teknisi = users.find(u => u.id === wo.createdBy);
        const searchLower = searchQuery.toLowerCase();
        
        const matchesTicket = ticket?.ticketNumber.toLowerCase().includes(searchLower) ||
                             ticket?.title.toLowerCase().includes(searchLower);
        
        const matchesTeknisi = teknisi?.name.toLowerCase().includes(searchLower);
        
        const matchesSparepart = wo.spareparts?.some(sp => 
          sp.name.toLowerCase().includes(searchLower)
        );
        
        const matchesVendor = wo.vendorInfo?.name?.toLowerCase().includes(searchLower) ||
                             wo.vendorInfo?.description?.toLowerCase().includes(searchLower);
        
        if (!matchesTicket && !matchesTeknisi && !matchesSparepart && !matchesVendor) return false;
      }
      
      return true;
    });
  }, [allWorkOrders, statusFilter, typeFilter, searchQuery, tickets, users]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: allWorkOrders.length,
      requested: allWorkOrders.filter(wo => wo.status === 'requested').length,
      in_procurement: allWorkOrders.filter(wo => wo.status === 'in_procurement').length,
      completed: allWorkOrders.filter(wo => wo.status === 'completed').length,
      unsuccessful: allWorkOrders.filter(wo => wo.status === 'unsuccessful').length,
    };
  }, [allWorkOrders]);

  const getTicketInfo = (ticketId: string) => {
    return tickets.find(t => t.id === ticketId);
  };

  const getTeknisiInfo = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const handleOpenUpdateDialog = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setUpdateStatus(wo.status);
    setUpdateNotes('');
    setShowUpdateDialog(true);
  };

  const handleUpdateWorkOrder = () => {
    if (!selectedWO) return;

    const timeline = [
      ...selectedWO.timeline,
      {
        id: `timeline-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Status Updated',
        actor: currentUser.name,
        details: `Status diubah menjadi ${statusConfig[updateStatus].label}${updateNotes ? ': ' + updateNotes : ''}`,
      }
    ];

    const updates: Partial<WorkOrder> = {
      status: updateStatus,
      timeline,
    };

    // Add completion data if status is completed
    if (updateStatus === 'completed') {
      updates.completedAt = new Date().toISOString();
      if (updateNotes) {
        if (selectedWO.type === 'vendor') {
          updates.vendorInfo = {
            ...selectedWO.vendorInfo,
            completionNotes: updateNotes,
          };
        } else {
          updates.completionNotes = updateNotes;
        }
      }
    }

    // Add failure reason if status is unsuccessful
    if (updateStatus === 'unsuccessful' && updateNotes) {
      updates.failureReason = updateNotes;
    }

    updateWorkOrder(selectedWO.id, updates);

    // Notify teknisi
    const teknisi = getTeknisiInfo(selectedWO.createdBy);
    if (teknisi) {
      addNotification({
        userId: teknisi.id,
        title: 'Update Work Order',
        message: `Work Order ${selectedWO.type === 'sparepart' ? 'Sparepart' : 'Vendor'} telah diupdate: ${statusConfig[updateStatus].label}`,
        type: 'info',
        read: false,
      });
    }

    toast.success('Work order berhasil diupdate');
    setShowUpdateDialog(false);
    setSelectedWO(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl flex items-center gap-3">
          <FileText className="h-8 w-8 text-purple-600" />
          Kelola Work Order
        </h1>
        <p className="text-gray-500 mt-1">
          Kelola pengadaan sparepart dan vendor untuk perbaikan barang
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total WO</p>
                <p className="text-2xl mt-1">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Diminta</p>
                <p className="text-2xl mt-1">{stats.requested}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pengadaan</p>
                <p className="text-2xl mt-1">{stats.in_procurement}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gagal</p>
                <p className="text-2xl mt-1">{stats.unsuccessful}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selesai</p>
                <p className="text-2xl mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Work Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari tiket, teknisi, sparepart..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="sparepart">Sparepart</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="requested">Diminta</SelectItem>
                <SelectItem value="in_procurement">Dalam Pengadaan</SelectItem>
                <SelectItem value="delivered">Sudah Dikirim</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="failed">Gagal</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Work Order ({filteredWorkOrders.length})</CardTitle>
          <CardDescription>
            Kelola status dan progress work order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWorkOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada work order yang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tiket</TableHead>
                    <TableHead>Teknisi</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((wo, index) => {
                    const ticket = getTicketInfo(wo.ticketId);
                    const teknisi = getTeknisiInfo(wo.createdBy);
                    const StatusIcon = statusConfig[wo.status].icon;
                    const TypeIcon = wo.type === 'sparepart' ? Package : Truck;

                    return (
                      <motion.tr
                        key={wo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div className="text-sm">
                            {new Date(wo.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(wo.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-mono text-sm">{ticket?.ticketNumber}</div>
                          <div className="text-xs text-gray-500 max-w-[200px] truncate">
                            {ticket?.title}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">{teknisi?.name}</div>
                          <div className="text-xs text-gray-500">{teknisi?.nip}</div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <TypeIcon className="h-3 w-3" />
                            {wo.type === 'sparepart' ? 'Sparepart' : 'Vendor'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {wo.type === 'sparepart' && wo.spareparts && (
                            <div className="text-sm">
                              {wo.spareparts.length > 1 ? (
                                <span>{wo.spareparts.length} item sparepart</span>
                              ) : (
                                <div>
                                  <div>{wo.spareparts[0]?.name}</div>
                                  <div className="text-xs text-gray-500">
                                    Qty: {wo.spareparts[0]?.quantity} {wo.spareparts[0]?.unit}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {wo.type === 'vendor' && wo.vendorInfo && (
                            <div className="text-sm max-w-[250px]">
                              {wo.vendorInfo.name && (
                                <div className="font-medium">{wo.vendorInfo.name}</div>
                              )}
                              <div className="text-xs text-gray-500 truncate">
                                {wo.vendorInfo.description}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge className={statusConfig[wo.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[wo.status].label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenUpdateDialog(wo)}
                          >
                            Update
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Work Order Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Work Order</DialogTitle>
            <DialogDescription>
              Update status dan progress work order
            </DialogDescription>
          </DialogHeader>

          {selectedWO && (
            <div className="space-y-4">
              {/* WO Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tiket:</span>
                      <span className="ml-2 font-mono">{getTicketInfo(selectedWO.ticketId)?.ticketNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Teknisi:</span>
                      <span className="ml-2">{getTeknisiInfo(selectedWO.createdBy)?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Jenis:</span>
                      <span className="ml-2">{selectedWO.type === 'sparepart' ? 'Sparepart' : 'Vendor'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status Saat Ini:</span>
                      <Badge className={`ml-2 ${statusConfig[selectedWO.status].color}`}>
                        {statusConfig[selectedWO.status].label}
                      </Badge>
                    </div>
                  </div>

                  {selectedWO.type === 'sparepart' && selectedWO.spareparts && (
                    <div className="mt-4">
                      <Label className="text-sm">Daftar Sparepart:</Label>
                      <div className="mt-2 space-y-2">
                        {selectedWO.spareparts.map((sp, idx) => (
                          <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                            <div className="font-medium">{sp.name}</div>
                            <div className="text-xs text-gray-600">
                              Qty: {sp.quantity} {sp.unit}
                              {sp.remarks && ` • ${sp.remarks}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedWO.type === 'vendor' && selectedWO.vendorInfo && (
                    <div className="mt-4 space-y-2">
                      {selectedWO.vendorInfo.name && (
                        <div className="text-sm">
                          <span className="text-gray-600">Nama Vendor:</span>
                          <span className="ml-2">{selectedWO.vendorInfo.name}</span>
                        </div>
                      )}
                      {selectedWO.vendorInfo.contact && (
                        <div className="text-sm">
                          <span className="text-gray-600">Kontak:</span>
                          <span className="ml-2">{selectedWO.vendorInfo.contact}</span>
                        </div>
                      )}
                      {selectedWO.vendorInfo.description && (
                        <div className="text-sm">
                          <span className="text-gray-600">Deskripsi:</span>
                          <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{selectedWO.vendorInfo.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Update Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="update-status">Status Baru</Label>
                  <Select value={updateStatus} onValueChange={(v) => setUpdateStatus(v as WorkOrderStatus)}>
                    <SelectTrigger id="update-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requested">Diminta</SelectItem>
                      <SelectItem value="in_procurement">Dalam Pengadaan</SelectItem>
                      <SelectItem value="delivered">Sudah Dikirim</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="failed">Gagal</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="update-notes">Catatan</Label>
                  <Textarea
                    id="update-notes"
                    placeholder="Tambahkan catatan atau keterangan..."
                    rows={4}
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateWorkOrder}>
              Update Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
