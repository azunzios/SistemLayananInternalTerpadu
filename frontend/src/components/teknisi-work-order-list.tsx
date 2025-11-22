import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Separator } from './ui/separator';
import { Package, Truck, Search, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getWorkOrders, getTickets } from '../lib/storage';
import type { User, WorkOrder, WorkOrderStatus } from '../types';
import { motion } from 'motion/react';

interface TeknisiWorkOrderListProps {
  currentUser: User;
  onViewDetail?: (workOrderId: string) => void;
}

const statusConfig: Record<WorkOrderStatus, { label: string; color: string; icon: any }> = {
  requested: { label: 'Diminta', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_procurement: { label: 'Dalam Pengadaan', color: 'bg-blue-100 text-blue-800', icon: Package },
  delivered: { label: 'Sudah Dikirim', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completed: { label: 'Selesai', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  failed: { label: 'Gagal', color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

export const TeknisiWorkOrderList: React.FC<TeknisiWorkOrderListProps> = ({
  currentUser,
  onViewDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const tickets = getTickets();
  const allWorkOrders = getWorkOrders();

  // Filter work orders created by current user
  const myWorkOrders = useMemo(() => {
    return allWorkOrders.filter(wo => wo.createdBy === currentUser.id);
  }, [allWorkOrders, currentUser.id]);

  // Apply filters
  const filteredWorkOrders = useMemo(() => {
    return myWorkOrders.filter(wo => {
      // Status filter
      if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
      
      // Type filter
      if (typeFilter !== 'all' && wo.type !== typeFilter) return false;
      
      // Search filter
      if (searchQuery) {
        const ticket = tickets.find(t => t.id === wo.ticketId);
        const searchLower = searchQuery.toLowerCase();
        
        const matchesTicket = ticket?.ticketNumber.toLowerCase().includes(searchLower) ||
                             ticket?.title.toLowerCase().includes(searchLower);
        
        const matchesSparepart = wo.spareparts?.some(sp => 
          sp.name.toLowerCase().includes(searchLower)
        );
        
        const matchesVendor = wo.vendorInfo?.name?.toLowerCase().includes(searchLower) ||
                             wo.vendorInfo?.description?.toLowerCase().includes(searchLower);
        
        if (!matchesTicket && !matchesSparepart && !matchesVendor) return false;
      }
      
      return true;
    });
  }, [myWorkOrders, statusFilter, typeFilter, searchQuery, tickets]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: myWorkOrders.length,
      requested: myWorkOrders.filter(wo => wo.status === 'requested').length,
      in_procurement: myWorkOrders.filter(wo => wo.status === 'in_procurement').length,
      completed: myWorkOrders.filter(wo => wo.status === 'completed').length,
    };
  }, [myWorkOrders]);

  const getTicketInfo = (ticketId: string) => {
    return tickets.find(t => t.id === ticketId);
  };

  const handleViewDetail = (woId: string) => {
    const wo = allWorkOrders.find(w => w.id === woId);
    if (wo) {
      setSelectedWO(wo);
      setShowDetailDialog(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          Work Order Saya
          <Package className="h-8 w-8 text-blue-600" />
        </h1>
        <p className="text-gray-500 mt-1">
          Daftar semua work order yang telah Anda request
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-gray-600">Selesai</p>
                <p className="text-2xl mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="pb-6">
        <CardHeader>
          <CardTitle>Filter Work Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari tiket, sparepart, vendor..."
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
            Klik pada baris untuk melihat detail work order
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
                    <TableHead>Jenis</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((wo, index) => {
                    const ticket = getTicketInfo(wo.ticketId);
                    const StatusIcon = statusConfig[wo.status].icon;
                    const TypeIcon = wo.type === 'sparepart' ? Package : Truck;

                    return (
                      <motion.tr
                        key={wo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewDetail(wo.id)}
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
                                <span>{wo.spareparts[0]?.name}</span>
                              )}
                            </div>
                          )}
                          {wo.type === 'vendor' && wo.vendorInfo && (
                            <div className="text-sm max-w-[200px] truncate">
                              {wo.vendorInfo.name || wo.vendorInfo.description}
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
                            variant="link"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetail(wo.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Work Order</DialogTitle>
            <DialogDescription>
              Informasi lengkap work order yang Anda request
            </DialogDescription>
          </DialogHeader>

          {selectedWO && (
            <div className="space-y-6">
              {/* Status & Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedWO.type === 'sparepart' ? (
                    <Package className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Truck className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="font-medium">
                    {selectedWO.type === 'sparepart' ? 'Work Order Sparepart' : 'Work Order Vendor'}
                  </span>
                </div>
                <Badge className={statusConfig[selectedWO.status].color}>
                  {statusConfig[selectedWO.status].label}
                </Badge>
              </div>

              <Separator />

              {/* Ticket Info */}
              <div>
                <h4 className="font-semibold mb-3">Informasi Tiket</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Nomor Tiket:</span>
                    <span className="font-mono">{getTicketInfo(selectedWO.ticketId)?.ticketNumber}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Judul:</span>
                    <span>{getTicketInfo(selectedWO.ticketId)?.title}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sparepart Details */}
              {selectedWO.type === 'sparepart' && selectedWO.spareparts && (
                <div>
                  <h4 className="font-semibold mb-3">Daftar Sparepart</h4>
                  <div className="space-y-2">
                    {selectedWO.spareparts.map((sp, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{sp.name}</p>
                            {sp.specifications && (
                              <p className="text-sm text-gray-600 mt-1">{sp.specifications}</p>
                            )}
                          </div>
                          <span className="text-sm font-medium">Qty: {sp.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor Details */}
              {selectedWO.type === 'vendor' && selectedWO.vendorInfo && (
                <div>
                  <h4 className="font-semibold mb-3">Informasi Vendor</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {selectedWO.vendorInfo.name && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-600">Nama Vendor:</span>
                        <span>{selectedWO.vendorInfo.name}</span>
                      </div>
                    )}
                    {selectedWO.vendorInfo.description && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-600">Deskripsi:</span>
                        <span>{selectedWO.vendorInfo.description}</span>
                      </div>
                    )}
                    {selectedWO.vendorInfo.estimatedCost && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-600">Estimasi Biaya:</span>
                        <span className="font-medium">
                          Rp {selectedWO.vendorInfo.estimatedCost.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Timeline */}
              <div>
                <h4 className="font-semibold mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-gray-600">Dibuat:</span>{' '}
                    <span>
                      {new Date(selectedWO.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Terakhir Diupdate:</span>{' '}
                    <span>
                      {new Date(selectedWO.updatedAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};