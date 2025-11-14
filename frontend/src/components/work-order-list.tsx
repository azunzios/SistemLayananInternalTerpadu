import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Package,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { getWorkOrders, updateWorkOrder, getTickets, saveTickets, addNotification, getUsers } from '../lib/storage';
import type { WorkOrder, WorkOrderStatus, User } from '../types';

interface WorkOrderListProps {
  currentUser: User;
}

export const WorkOrderList: React.FC<WorkOrderListProps> = ({ currentUser }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(getWorkOrders());
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Form untuk update WO
  const [updateForm, setUpdateForm] = useState({
    status: '' as WorkOrderStatus,
    receivedQty: '',
    receivedRemarks: '',
    failureReason: '',
    vendorCompletionNotes: '',
    vendorName: '',
    vendorContact: '',
  });

  const loadWorkOrders = () => {
    const wos = getWorkOrders();
    setWorkOrders(wos);
  };

  const handleViewDetail = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setUpdateForm({
      status: wo.status,
      receivedQty: wo.receivedQty?.toString() || '',
      receivedRemarks: wo.receivedRemarks || '',
      failureReason: wo.failureReason || '',
      vendorCompletionNotes: wo.vendorInfo?.completionNotes || '',
      vendorName: wo.vendorInfo?.name || '',
      vendorContact: wo.vendorInfo?.contact || '',
    });
    setShowDetailDialog(true);
  };

  const handleUpdateWorkOrder = () => {
    if (!selectedWO) return;

    const updates: Partial<WorkOrder> = {
      status: updateForm.status,
      updatedAt: new Date().toISOString(),
    };

    // Add timeline entry
    const timelineEntry = {
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: `STATUS_CHANGED_${updateForm.status.toUpperCase()}`,
      actor: currentUser.name,
      details: `Status diubah menjadi ${getStatusLabel(updateForm.status)}`,
    };

    if (updateForm.status === 'delivered' && selectedWO.type === 'sparepart') {
      updates.receivedQty = parseInt(updateForm.receivedQty) || 0;
      updates.receivedRemarks = updateForm.receivedRemarks;
      timelineEntry.details = `Sparepart diterima. Qty: ${updateForm.receivedQty}. ${updateForm.receivedRemarks}`;
    }

    // Save vendor info when status is in_procurement or completed
    if (selectedWO.type === 'vendor' && (updateForm.status === 'in_procurement' || updateForm.status === 'completed')) {
      updates.vendorInfo = {
        ...selectedWO.vendorInfo,
        name: updateForm.vendorName,
        contact: updateForm.vendorContact,
      };
      
      if (updateForm.status === 'in_procurement') {
        timelineEntry.details = `Vendor ditambahkan: ${updateForm.vendorName}. Kontak: ${updateForm.vendorContact}`;
      }
    }

    if (updateForm.status === 'completed' && selectedWO.type === 'vendor') {
      updates.completedAt = new Date().toISOString();
      updates.vendorInfo = {
        ...updates.vendorInfo,
        ...selectedWO.vendorInfo,
        completionNotes: updateForm.vendorCompletionNotes,
        name: updateForm.vendorName,
        contact: updateForm.vendorContact,
      };
      timelineEntry.details = `Pekerjaan vendor selesai. ${updateForm.vendorCompletionNotes}`;
    }

    if (updateForm.status === 'failed') {
      updates.failureReason = updateForm.failureReason;
      timelineEntry.details = `Work order gagal. Alasan: ${updateForm.failureReason}`;
    }

    updates.timeline = [...selectedWO.timeline, timelineEntry];

    const updatedWO = updateWorkOrder(selectedWO.id, updates);

    if (updatedWO) {
      // Update ticket status if WO is completed/delivered
      if (updateForm.status === 'delivered' || updateForm.status === 'completed') {
        const tickets = getTickets();
        const updatedTickets = tickets.map(t => {
          if (t.id === selectedWO.ticketId) {
            return {
              ...t,
              status: 'in_progress' as any,
              updatedAt: new Date().toISOString(),
              timeline: [
                ...t.timeline,
                {
                  id: `tl-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  action: 'WORK_ORDER_COMPLETED',
                  actor: currentUser.name,
                  details: `Work order ${selectedWO.type === 'sparepart' ? 'sparepart' : 'vendor'} selesai. Teknisi dapat melanjutkan perbaikan.`,
                },
              ],
            };
          }
          return t;
        });
        saveTickets(updatedTickets);

        // Notify teknisi
        const users = getUsers();
        const ticket = tickets.find(t => t.id === selectedWO.ticketId);
        if (ticket && ticket.assignedTo) {
          addNotification({
            userId: ticket.assignedTo,
            title: 'Work Order Selesai',
            message: `Work order ${selectedWO.type === 'sparepart' ? 'sparepart' : 'vendor'} untuk tiket ${ticket.ticketNumber} telah selesai. Silakan lanjutkan perbaikan.`,
            type: 'success',
            read: false,
          });
        }
      }

      toast.success('Work order berhasil diupdate');
      loadWorkOrders();
      setShowDetailDialog(false);
    }
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    const variants: Record<WorkOrderStatus, { variant: string; label: string; icon: any }> = {
      requested: { variant: 'bg-blue-100 text-blue-800', label: 'Requested', icon: Clock },
      in_procurement: { variant: 'bg-yellow-100 text-yellow-800', label: 'Procurement', icon: Package },
      delivered: { variant: 'bg-green-100 text-green-800', label: 'Delivered', icon: Truck },
      completed: { variant: 'bg-emerald-100 text-emerald-800', label: 'Completed', icon: CheckCircle },
      failed: { variant: 'bg-red-100 text-red-800', label: 'Failed', icon: XCircle },
      cancelled: { variant: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: XCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.variant} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusLabel = (status: WorkOrderStatus) => {
    const labels: Record<WorkOrderStatus, string> = {
      requested: 'Diminta',
      in_procurement: 'Dalam Pengadaan',
      delivered: 'Diterima',
      completed: 'Selesai',
      failed: 'Gagal',
      cancelled: 'Dibatalkan',
    };
    return labels[status];
  };

  const getTypeBadge = (type: 'sparepart' | 'vendor') => {
    return type === 'sparepart' ? (
      <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
        <Package className="h-3 w-3" />
        Sparepart
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
        <Building className="h-3 w-3" />
        Vendor
      </Badge>
    );
  };

  const filteredWorkOrders = workOrders.filter(wo => {
    if (filterStatus !== 'all' && wo.status !== filterStatus) return false;
    if (filterType !== 'all' && wo.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2>Work Order Management</h2>
        <p className="text-gray-600">Kelola work order sparepart dan vendor untuk perbaikan</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="in_procurement">Procurement</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filter by Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="sparepart">Sparepart</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Order List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Work Order</CardTitle>
          <CardDescription>
            Total: {filteredWorkOrders.length} work order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tiket</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Tidak ada work order
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkOrders.map(wo => {
                  const tickets = getTickets();
                  const ticket = tickets.find(t => t.id === wo.ticketId);

                  return (
                    <TableRow key={wo.id}>
                      <TableCell className="font-mono text-sm">
                        {wo.id.split('-').pop()?.substring(0, 8)}
                      </TableCell>
                      <TableCell>{getTypeBadge(wo.type)}</TableCell>
                      <TableCell>{getStatusBadge(wo.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-mono text-sm">{ticket?.ticketNumber}</div>
                          <div className="text-xs text-gray-500">{ticket?.title}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(wo.createdAt).toLocaleDateString('id-ID', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(wo)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Work Order</DialogTitle>
            <DialogDescription>
              {selectedWO && `Work Order ${selectedWO.type === 'sparepart' ? 'Sparepart' : 'Vendor'}`}
            </DialogDescription>
          </DialogHeader>

          {selectedWO && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Tipe</Label>
                  <div className="mt-1">{getTypeBadge(selectedWO.type)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedWO.status)}</div>
                </div>
              </div>

              <Separator />

              {/* Sparepart Details */}
              {selectedWO.type === 'sparepart' && selectedWO.spareparts && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Daftar Sparepart</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead>Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedWO.spareparts.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {item.remarks || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Vendor Details */}
              {selectedWO.type === 'vendor' && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Informasi Vendor</h4>
                  
                  {selectedWO.vendorInfo && selectedWO.vendorInfo.name ? (
                    // Display vendor info if already filled
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Nama Vendor</Label>
                          <p>{selectedWO.vendorInfo.name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Kontak</Label>
                          <p>{selectedWO.vendorInfo.contact || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Deskripsi Pekerjaan</Label>
                        <p className="text-sm mt-1">{selectedWO.vendorInfo.description || '-'}</p>
                      </div>
                    </>
                  ) : (
                    // Show form to add vendor info if not yet filled
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-yellow-900 font-medium">
                            Informasi vendor belum ditambahkan
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Silakan tambahkan nama dan kontak vendor di form update di bawah
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Update Form */}
              <div className="space-y-4">
                <h4 className="font-semibold">Update Work Order</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={updateForm.status}
                    onValueChange={(value: WorkOrderStatus) =>
                      setUpdateForm({ ...updateForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="in_procurement">In Procurement</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional fields based on status and type */}
                {selectedWO.type === 'vendor' && (updateForm.status === 'in_procurement' || updateForm.status === 'completed') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="vendorName">Nama Vendor *</Label>
                      <Input
                        id="vendorName"
                        value={updateForm.vendorName}
                        onChange={e => setUpdateForm({ ...updateForm, vendorName: e.target.value })}
                        placeholder="Masukkan nama vendor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendorContact">Kontak Vendor *</Label>
                      <Input
                        id="vendorContact"
                        value={updateForm.vendorContact}
                        onChange={e => setUpdateForm({ ...updateForm, vendorContact: e.target.value })}
                        placeholder="No. telepon atau email vendor"
                      />
                    </div>
                  </>
                )}

                {updateForm.status === 'delivered' && selectedWO.type === 'sparepart' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="receivedQty">Qty Diterima</Label>
                      <Input
                        id="receivedQty"
                        type="number"
                        value={updateForm.receivedQty}
                        onChange={e => setUpdateForm({ ...updateForm, receivedQty: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receivedRemarks">Keterangan Penerimaan</Label>
                      <Textarea
                        id="receivedRemarks"
                        value={updateForm.receivedRemarks}
                        onChange={e => setUpdateForm({ ...updateForm, receivedRemarks: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {updateForm.status === 'completed' && selectedWO.type === 'vendor' && (
                  <div className="space-y-2">
                    <Label htmlFor="vendorCompletionNotes">Catatan Penyelesaian</Label>
                    <Textarea
                      id="vendorCompletionNotes"
                      value={updateForm.vendorCompletionNotes}
                      onChange={e => setUpdateForm({ ...updateForm, vendorCompletionNotes: e.target.value })}
                      rows={3}
                      placeholder="Catatan hasil pekerjaan vendor..."
                    />
                  </div>
                )}

                {updateForm.status === 'failed' && (
                  <div className="space-y-2">
                    <Label htmlFor="failureReason">Alasan Gagal *</Label>
                    <Textarea
                      id="failureReason"
                      value={updateForm.failureReason}
                      onChange={e => setUpdateForm({ ...updateForm, failureReason: e.target.value })}
                      rows={3}
                      placeholder="Jelaskan alasan work order gagal..."
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Timeline */}
              <div className="space-y-3">
                <h4 className="font-semibold">Timeline</h4>
                <div className="space-y-2">
                  {selectedWO.timeline.map((event, idx) => (
                    <div key={event.id} className="flex gap-3 text-sm">
                      <div className="text-gray-500 min-w-[140px]">
                        {new Date(event.timestamp).toLocaleDateString('id-ID', { 
                          day: '2-digit', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{event.action}</div>
                        <div className="text-gray-600">{event.details}</div>
                        <div className="text-xs text-gray-500">oleh {event.actor}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
            <Button onClick={handleUpdateWorkOrder}>
              Simpan Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};