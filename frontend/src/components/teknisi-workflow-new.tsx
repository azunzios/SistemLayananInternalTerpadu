import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  ClipboardCheck,
  FileText,
  Package,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Building,
  Plus,
  Trash2,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getTickets, saveTickets, addNotification, getUsersSync, createWorkOrder } from '../lib/storage';
import type { Ticket, TicketStatus, User, WorkOrder, WorkOrderType, ProblemType } from '../types';

interface TeknisiWorkflowProps {
  ticket: Ticket;
  currentUser: User;
  onUpdate: () => void;
}

export const TeknisiWorkflow: React.FC<TeknisiWorkflowProps> = ({
  ticket,
  currentUser,
  onUpdate,
}) => {
  const users = getUsersSync();
  
  // Accept/Reject Dialog
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [estimatedSchedule, setEstimatedSchedule] = useState('');
  
  // Diagnosa Dialog (updated)
  const [showDiagnosaDialog, setShowDiagnosaDialog] = useState(false);
  const [diagnosaForm, setDiagnosaForm] = useState({
    deskripsiMasalah: '',
    kategoriMasalah: '' as ProblemType | '',
    pemeriksaanFisik: '',
    hasilTesting: '',
    komponenBermasalah: '',
    dapatDiperbaikiLangsung: '' as 'ya' | 'tidak' | '',
    opsiPerbaikan: '' as 'dengan_sparepart' | 'dengan_vendor' | 'tidak_bisa' | '', // jika dapatDiperbaikiLangsung = tidak
  });
  
  // Work Order Dialog
  const [showWorkOrderDialog, setShowWorkOrderDialog] = useState(false);
  const [workOrderType, setWorkOrderType] = useState<WorkOrderType>('sparepart');
  const [sparepartItems, setSparepartItems] = useState<{ name: string; qty: number; unit: string; remarks: string }[]>([
    { name: '', qty: 1, unit: 'pcs', remarks: '' }
  ]);
  const [vendorInfo, setVendorInfo] = useState({
    name: '',
    contact: '',
    description: '',
  });
  
  // Tidak Dapat Diperbaiki Dialog
  const [showCannotRepairDialog, setShowCannotRepairDialog] = useState(false);
  const [cannotRepairForm, setCannotRepairForm] = useState({
    alasanTidakBisa: '',
    rekomendasiSolusi: '',
    estimasiBiayaBaruJikaDibeli: '',
    catatanTambahan: '',
  });
  
  // Perbaikan Selesai Dialog
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    tindakanDilakukan: '',
    komponenDiganti: '',
    hasilPerbaikan: '',
    saranPerawatan: '',
    catatanTambahan: '',
    fotoBukti: '',
  });

  // ============== HANDLER FUNCTIONS ==============

  const handleAcceptTicket = () => {
    if (!estimatedSchedule) {
      toast.error('Estimasi jadwal harus diisi');
      return;
    }

    const updatedTickets = getTickets().map(t => {
      if (t.id === ticket.id) {
        return {
          ...t,
          status: 'in_progress' as TicketStatus,
          updatedAt: new Date().toISOString(),
          data: {
            ...t.data,
            estimatedSchedule,
            acceptedByTeknisi: currentUser.name,
            acceptedAt: new Date().toISOString(),
          },
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'ACCEPTED_BY_TECHNICIAN',
              actor: currentUser.name,
              details: `Tiket diterima teknisi. Estimasi jadwal: ${estimatedSchedule}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Tiket Diterima Teknisi',
      message: `Teknisi ${currentUser.name} telah menerima tiket Anda. Estimasi penyelesaian: ${estimatedSchedule}`,
      type: 'info',
      read: false,
    });

    toast.success('Tiket berhasil diterima');
    setShowAcceptDialog(false);
    setEstimatedSchedule('');
    onUpdate();
  };

  const handleRejectTicket = () => {
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    const updatedTickets = getTickets().map(t => {
      if (t.id === ticket.id) {
        return {
          ...t,
          status: 'submitted' as TicketStatus,
          assignedTo: undefined,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'REJECTED_BY_TECHNICIAN',
              actor: currentUser.name,
              details: `Tiket ditolak teknisi. Alasan: ${rejectReason}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify admin layanan for re-assignment
    const adminLayanan = users.filter(u => u.roles?.includes('admin_layanan') || u.role === 'admin_layanan');
    adminLayanan.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Tiket Ditolak Teknisi',
        message: `${currentUser.name} menolak tiket ${ticket.ticketNumber}. Perlu re-assign.`,
        type: 'warning',
        read: false,
      });
    });

    toast.success('Tiket telah ditolak. Admin Layanan akan melakukan re-assign.');
    setShowRejectDialog(false);
    setRejectReason('');
    onUpdate();
  };

  const handleSubmitDiagnosa = () => {
    if (!diagnosaForm.deskripsiMasalah || !diagnosaForm.kategoriMasalah || !diagnosaForm.pemeriksaanFisik || !diagnosaForm.dapatDiperbaikiLangsung) {
      toast.error('Semua field diagnosa wajib diisi');
      return;
    }

    // Jika tidak dapat diperbaiki langsung, perlu pilih opsi perbaikan
    if (diagnosaForm.dapatDiperbaikiLangsung === 'tidak') {
      if (!diagnosaForm.opsiPerbaikan) {
        toast.error('Pilih opsi perbaikan yang sesuai');
        return;
      }

      // Jika tidak bisa sama sekali
      if (diagnosaForm.opsiPerbaikan === 'tidak_bisa') {
        setShowDiagnosaDialog(false);
        setShowCannotRepairDialog(true);
        return;
      }

      // Jika dengan sparepart atau vendor, tampilkan form work order
      if (diagnosaForm.opsiPerbaikan === 'dengan_sparepart' || diagnosaForm.opsiPerbaikan === 'dengan_vendor') {
        setWorkOrderType(diagnosaForm.opsiPerbaikan === 'dengan_sparepart' ? 'sparepart' : 'vendor');
        setShowDiagnosaDialog(false);
        setShowWorkOrderDialog(true);
        return;
      }
    }

    // Jika dapat diperbaiki langsung
    if (diagnosaForm.dapatDiperbaikiLangsung === 'ya') {
      const updatedTickets = getTickets().map(t => {
        if (t.id === ticket.id) {
          return {
            ...t,
            status: 'in_progress' as TicketStatus,
            finalProblemType: diagnosaForm.kategoriMasalah as ProblemType,
            updatedAt: new Date().toISOString(),
            data: {
              ...t.data,
              diagnosa: diagnosaForm,
              diagnosedAt: new Date().toISOString(),
            },
            timeline: [
              ...t.timeline,
              {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                action: 'DIAGNOSIS_COMPLETED',
                actor: currentUser.name,
                details: `Diagnosa selesai. Masalah: ${diagnosaForm.kategoriMasalah}. Dapat diperbaiki langsung.`,
              },
            ],
          };
        }
        return t;
      });

      saveTickets(updatedTickets);
      setShowDiagnosaDialog(false);
      toast.success('Diagnosa berhasil disimpan. Silakan lanjutkan perbaikan.');
      onUpdate();
    }
  };

  const handleSubmitWorkOrder = () => {
    // Validation
    if (workOrderType === 'sparepart') {
      const hasInvalidItem = sparepartItems.some(item => !item.name || item.qty <= 0 || !item.unit);
      if (hasInvalidItem) {
        toast.error('Semua sparepart harus diisi dengan lengkap');
        return;
      }
    } else {
      if (!vendorInfo.name || !vendorInfo.contact || !vendorInfo.description) {
        toast.error('Informasi vendor harus diisi lengkap');
        return;
      }
    }

    // Create work order
    const workOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      ticketId: ticket.id,
      type: workOrderType,
      status: 'requested',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spareparts: workOrderType === 'sparepart' ? sparepartItems : undefined,
      vendorInfo: workOrderType === 'vendor' ? vendorInfo : undefined,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'WORK_ORDER_CREATED',
          actor: currentUser.name,
          details: `Work order ${workOrderType} dibuat oleh teknisi`,
        },
      ],
    };

    createWorkOrder(workOrder);

    // Update ticket
    const updatedTickets = getTickets().map(t => {
      if (t.id === ticket.id) {
        return {
          ...t,
          status: 'on_hold' as TicketStatus,
          finalProblemType: diagnosaForm.kategoriMasalah as ProblemType,
          workOrderId: workOrder.id,
          updatedAt: new Date().toISOString(),
          data: {
            ...t.data,
            diagnosa: diagnosaForm,
            diagnosedAt: new Date().toISOString(),
          },
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'DIAGNOSIS_COMPLETED',
              actor: currentUser.name,
              details: `Diagnosa selesai. Masalah: ${diagnosaForm.kategoriMasalah}. Membutuhkan ${workOrderType}.`,
            },
            {
              id: (Date.now() + 1).toString(),
              timestamp: new Date().toISOString(),
              action: 'WORK_ORDER_CREATED',
              actor: currentUser.name,
              details: `Work order ${workOrderType} dibuat. Status: On Hold - menunggu ${workOrderType}.`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify admin penyedia
    const adminPenyedia = users.filter(u => u.roles?.includes('admin_penyedia') || u.role === 'admin_penyedia');
    adminPenyedia.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: `Work Order ${workOrderType === 'sparepart' ? 'Sparepart' : 'Vendor'} Baru`,
        message: `Teknisi ${currentUser.name} membuat work order untuk tiket ${ticket.ticketNumber}`,
        type: 'info',
        read: false,
      });
    });

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Perbaikan Membutuhkan ' + (workOrderType === 'sparepart' ? 'Sparepart' : 'Vendor'),
      message: `Perbaikan ${ticket.data?.itemName || 'barang Anda'} membutuhkan ${workOrderType === 'sparepart' ? 'sparepart tambahan' : 'bantuan vendor'}. Admin sedang memproses.`,
      type: 'info',
      read: false,
    });

    toast.success(`Work order ${workOrderType} berhasil dibuat`);
    setShowWorkOrderDialog(false);
    onUpdate();
  };

  const handleCannotRepair = () => {
    if (!cannotRepairForm.alasanTidakBisa || !cannotRepairForm.rekomendasiSolusi) {
      toast.error('Alasan dan rekomendasi solusi harus diisi');
      return;
    }

    const updatedTickets = getTickets().map(t => {
      if (t.id === ticket.id) {
        return {
          ...t,
          status: 'closed_unrepairable' as TicketStatus,
          finalProblemType: diagnosaForm.kategoriMasalah as ProblemType,
          repairable: false,
          unrepairableReason: cannotRepairForm.alasanTidakBisa,
          updatedAt: new Date().toISOString(),
          data: {
            ...t.data,
            diagnosa: diagnosaForm,
            cannotRepairInfo: cannotRepairForm,
            completedAt: new Date().toISOString(),
          },
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'MARKED_CANNOT_REPAIR',
              actor: currentUser.name,
              details: `Barang tidak dapat diperbaiki. Alasan: ${cannotRepairForm.alasanTidakBisa}`,
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Barang Tidak Dapat Diperbaiki',
      message: `Teknisi menyatakan ${ticket.data?.itemName || 'barang'} tidak dapat diperbaiki. Saran: ${cannotRepairForm.rekomendasiSolusi}`,
      type: 'warning',
      read: false,
    });

    // Notify admin layanan
    const adminLayanan = users.filter(u => u.roles?.includes('admin_layanan') || u.role === 'admin_layanan');
    adminLayanan.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Barang Tidak Dapat Diperbaiki',
        message: `Tiket ${ticket.ticketNumber} - barang tidak dapat diperbaiki. Perlu tindakan lanjutan.`,
        type: 'warning',
        read: false,
      });
    });

    toast.success('Status diubah ke Tidak Dapat Diperbaiki');
    setShowCannotRepairDialog(false);
    onUpdate();
  };

  const handleCompleteRepair = () => {
    if (!completionForm.tindakanDilakukan || !completionForm.hasilPerbaikan) {
      toast.error('Tindakan yang dilakukan dan hasil perbaikan harus diisi');
      return;
    }

    const updatedTickets = getTickets().map(t => {
      if (t.id === ticket.id) {
        return {
          ...t,
          status: 'resolved' as TicketStatus,
          updatedAt: new Date().toISOString(),
          data: {
            ...t.data,
            completionInfo: completionForm,
            completedAt: new Date().toISOString(),
            completedBy: currentUser.name,
          },
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'REPAIR_COMPLETED',
              actor: currentUser.name,
              details: `Perbaikan selesai. ${completionForm.hasilPerbaikan}`,
            },
            {
              id: (Date.now() + 1).toString(),
              timestamp: new Date().toISOString(),
              action: 'RESOLVED',
              actor: currentUser.name,
              details: 'Tiket resolved - menunggu konfirmasi user',
            },
          ],
        };
      }
      return t;
    });

    saveTickets(updatedTickets);

    // Notify user
    addNotification({
      userId: ticket.userId,
      title: 'Perbaikan Selesai',
      message: `Teknisi ${currentUser.name} telah menyelesaikan perbaikan ${ticket.data?.itemName || 'barang Anda'}`,
      type: 'success',
      read: false,
    });

    // Notify admin layanan
    const adminLayanan = users.filter(u => u.roles?.includes('admin_layanan') || u.role === 'admin_layanan');
    adminLayanan.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Perbaikan Selesai',
        message: `Tiket ${ticket.ticketNumber} telah diselesaikan oleh ${currentUser.name}`,
        type: 'success',
        read: false,
      });
    });

    toast.success('Perbaikan selesai! Tiket telah ditutup.');
    setShowCompletionDialog(false);
    onUpdate();
  };

  // ============== HELPER FUNCTIONS ==============

  const addSparepartItem = () => {
    setSparepartItems([...sparepartItems, { name: '', qty: 1, unit: 'pcs', remarks: '' }]);
  };

  const removeSparepartItem = (index: number) => {
    if (sparepartItems.length > 1) {
      setSparepartItems(sparepartItems.filter((_, i) => i !== index));
    }
  };

  const updateSparepartItem = (index: number, field: string, value: any) => {
    const updated = [...sparepartItems];
    updated[index] = { ...updated[index], [field]: value };
    setSparepartItems(updated);
  };

  // ============== RENDER ==============

  const isAssignedToMe = ticket.assignedTo === currentUser.id;

  if (!isAssignedToMe) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* ============== ALERTS & NOTIFICATIONS (ALWAYS ON TOP) ============== */}
      
      {/* Alert: On Hold (menunggu work order) */}
      {ticket.status === 'on_hold' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">Menunggu Work Order</h3>
                <p className="text-sm text-amber-700">
                  Perbaikan menunggu {ticket.workOrderId ? 'penyelesaian work order' : 'proses pengadaan'}. Admin Penyedia sedang memproses.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============== ACTION BUTTONS ============== */}

      {/* Assigned: Show Accept/Reject */}
      {ticket.status === 'assigned' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Tiket Baru Ditugaskan</h3>
                  <p className="text-sm text-blue-700">
                    Tiket ini telah ditugaskan kepada Anda. Silakan terima atau tolak tiket ini.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak
                </Button>
                <Button
                  onClick={() => setShowAcceptDialog(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Terima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress: Show Diagnosa & Complete Buttons */}
      {ticket.status === 'in_progress' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Tiket Sedang Dikerjakan</h3>
                <p className="text-sm text-gray-600">
                  {ticket.data?.diagnosa ? 'Diagnosa sudah selesai. Silakan selesaikan perbaikan.' : 'Lakukan diagnosa untuk memulai perbaikan.'}
                </p>
              </div>
              <div className="flex gap-2">
                {!ticket.data?.diagnosa && (
                  <Button onClick={() => setShowDiagnosaDialog(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Diagnosa
                  </Button>
                )}
                <Button
                  onClick={() => setShowCompletionDialog(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Selesaikan Perbaikan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============== DIALOGS ============== */}

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terima Tiket Perbaikan</DialogTitle>
            <DialogDescription>
              Konfirmasi bahwa Anda menerima tugas perbaikan ini dan berikan estimasi jadwal penyelesaian
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedSchedule">Estimasi Jadwal Penyelesaian *</Label>
              <Input
                id="estimatedSchedule"
                placeholder="Contoh: 2-3 hari kerja"
                value={estimatedSchedule}
                onChange={(e) => setEstimatedSchedule(e.target.value)}
              />
              <p className="text-xs text-gray-500">User akan menerima notifikasi dengan estimasi ini</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAcceptTicket}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Terima Tiket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Tiket Perbaikan</AlertDialogTitle>
            <AlertDialogDescription>
              Tiket ini akan dikembalikan ke Admin Layanan untuk di-assign ke teknisi lain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="rejectReason">Alasan Penolakan *</Label>
            <Textarea
              id="rejectReason"
              placeholder="Jelaskan mengapa Anda menolak tiket ini..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectTicket}>
              Tolak Tiket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diagnosa Dialog (UPDATED) */}
      <Dialog open={showDiagnosaDialog} onOpenChange={setShowDiagnosaDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Diagnosa Barang</DialogTitle>
            <DialogDescription>
              Isi hasil pemeriksaan dan diagnosa untuk menentukan kondisi barang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Deskripsi Masalah */}
            <div className="space-y-2">
              <Label htmlFor="deskripsiMasalah">Deskripsi Masalah Barang *</Label>
              <Textarea
                id="deskripsiMasalah"
                placeholder="Jelaskan masalah yang ditemukan pada barang..."
                value={diagnosaForm.deskripsiMasalah}
                onChange={(e) => setDiagnosaForm({ ...diagnosaForm, deskripsiMasalah: e.target.value })}
                rows={3}
              />
            </div>

            {/* Kategori Masalah */}
            <div className="space-y-2">
              <Label>Kategori Masalah *</Label>
              <RadioGroup
                value={diagnosaForm.kategoriMasalah}
                onValueChange={(value: ProblemType) => setDiagnosaForm({ ...diagnosaForm, kategoriMasalah: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hardware" id="hw" />
                  <Label htmlFor="hw" className="font-normal cursor-pointer">
                    Hardware - Kerusakan fisik/komponen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="software" id="sw" />
                  <Label htmlFor="sw" className="font-normal cursor-pointer">
                    Software - Masalah sistem/aplikasi
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lainnya" id="ln" />
                  <Label htmlFor="ln" className="font-normal cursor-pointer">
                    Lainnya - Masalah lain
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Pemeriksaan Fisik */}
            <div className="space-y-2">
              <Label htmlFor="pemeriksaanFisik">Hasil Pemeriksaan Fisik *</Label>
              <Textarea
                id="pemeriksaanFisik"
                placeholder="Kondisi fisik barang, kerusakan yang terlihat, dll..."
                value={diagnosaForm.pemeriksaanFisik}
                onChange={(e) => setDiagnosaForm({ ...diagnosaForm, pemeriksaanFisik: e.target.value })}
                rows={3}
              />
            </div>

            {/* Hasil Testing */}
            <div className="space-y-2">
              <Label htmlFor="hasilTesting">Hasil Testing/Pengujian</Label>
              <Textarea
                id="hasilTesting"
                placeholder="Hasil pengujian fungsi, performa, error yang muncul, dll..."
                value={diagnosaForm.hasilTesting}
                onChange={(e) => setDiagnosaForm({ ...diagnosaForm, hasilTesting: e.target.value })}
                rows={3}
              />
            </div>

            {/* Komponen Bermasalah */}
            <div className="space-y-2">
              <Label htmlFor="komponenBermasalah">Komponen yang Bermasalah</Label>
              <Input
                id="komponenBermasalah"
                placeholder="Contoh: Motherboard, Hard Drive, Power Supply..."
                value={diagnosaForm.komponenBermasalah}
                onChange={(e) => setDiagnosaForm({ ...diagnosaForm, komponenBermasalah: e.target.value })}
              />
            </div>

            <Separator />

            {/* Dapat Diperbaiki Langsung? */}
            <div className="space-y-2">
              <Label>Apakah Dapat Diperbaiki Langsung? *</Label>
              <RadioGroup
                value={diagnosaForm.dapatDiperbaikiLangsung}
                onValueChange={(value: 'ya' | 'tidak') => {
                  setDiagnosaForm({ ...diagnosaForm, dapatDiperbaikiLangsung: value, opsiPerbaikan: '' });
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ya" id="direct-ya" />
                  <Label htmlFor="direct-ya" className="font-normal cursor-pointer">
                    <span className="text-green-600">✓ Ya, dapat diperbaiki langsung</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tidak" id="direct-tidak" />
                  <Label htmlFor="direct-tidak" className="font-normal cursor-pointer">
                    <span className="text-amber-600">⚠ Tidak dapat diperbaiki langsung</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Opsi Perbaikan (jika tidak dapat diperbaiki langsung) */}
            {diagnosaForm.dapatDiperbaikiLangsung === 'tidak' && (
              <div className="space-y-2 pl-6 border-l-4 border-amber-300">
                <Label>Pilih Opsi Perbaikan *</Label>
                <RadioGroup
                  value={diagnosaForm.opsiPerbaikan}
                  onValueChange={(value: any) => setDiagnosaForm({ ...diagnosaForm, opsiPerbaikan: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dengan_sparepart" id="opt-sparepart" />
                    <Label htmlFor="opt-sparepart" className="font-normal cursor-pointer flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      Bisa diperbaiki dengan sparepart
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dengan_vendor" id="opt-vendor" />
                    <Label htmlFor="opt-vendor" className="font-normal cursor-pointer flex items-center gap-2">
                      <Building className="h-4 w-4 text-orange-600" />
                      Bisa diperbaiki dengan bantuan vendor
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tidak_bisa" id="opt-tidak" />
                    <Label htmlFor="opt-tidak" className="font-normal cursor-pointer flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Tidak bisa diperbaiki sama sekali
                    </Label>
                  </div>
                </RadioGroup>

                {(diagnosaForm.opsiPerbaikan === 'dengan_sparepart' || diagnosaForm.opsiPerbaikan === 'dengan_vendor') && (
                  <Alert className="border-blue-200 bg-blue-50 mt-3">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Setelah submit diagnosa, Anda akan diarahkan ke form work order untuk 
                      {diagnosaForm.opsiPerbaikan === 'dengan_sparepart' ? ' mengisi sparepart yang dibutuhkan' : ' mengisi informasi vendor'}.
                    </AlertDescription>
                  </Alert>
                )}

                {diagnosaForm.opsiPerbaikan === 'tidak_bisa' && (
                  <Alert className="border-red-200 bg-red-50 mt-3">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Setelah submit, Anda akan diminta mengisi konfirmasi barang tidak dapat diperbaiki dan memberikan saran solusi kepada user.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiagnosaDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitDiagnosa}>
              Submit Diagnosa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Order Dialog (NEW) */}
      <Dialog open={showWorkOrderDialog} onOpenChange={setShowWorkOrderDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Work Order - {workOrderType === 'sparepart' ? 'Sparepart' : 'Vendor'}</DialogTitle>
            <DialogDescription>
              {workOrderType === 'sparepart' 
                ? 'Isi daftar sparepart yang dibutuhkan untuk perbaikan'
                : 'Isi informasi vendor yang akan menangani perbaikan'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {workOrderType === 'sparepart' ? (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Daftar Sparepart</h4>
                  <Button size="sm" onClick={addSparepartItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {sparepartItems.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm">Item #{index + 1}</h5>
                          {sparepartItems.length > 1 && (
                            <Button
                              size="sm"
                              variant="link"
                              onClick={() => removeSparepartItem(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2 col-span-2">
                            <Label>Nama Sparepart *</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => updateSparepartItem(index, 'name', e.target.value)}
                              placeholder="Contoh: RAM DDR4 8GB"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Qty *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateSparepartItem(index, 'qty', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Satuan *</Label>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateSparepartItem(index, 'unit', e.target.value)}
                              placeholder="pcs, unit, set, dll"
                            />
                          </div>
                          
                          <div className="space-y-2 col-span-2">
                            <Label>Keterangan</Label>
                            <Textarea
                              value={item.remarks}
                              onChange={(e) => updateSparepartItem(index, 'remarks', e.target.value)}
                              placeholder="Spesifikasi atau catatan tambahan..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h4 className="font-semibold">Informasi Vendor</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorName">Nama Vendor *</Label>
                    <Input
                      id="vendorName"
                      value={vendorInfo.name}
                      onChange={(e) => setVendorInfo({ ...vendorInfo, name: e.target.value })}
                      placeholder="Nama perusahaan/vendor"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vendorContact">Kontak Vendor *</Label>
                    <Input
                      id="vendorContact"
                      value={vendorInfo.contact}
                      onChange={(e) => setVendorInfo({ ...vendorInfo, contact: e.target.value })}
                      placeholder="No telepon / email vendor"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vendorDesc">Deskripsi Pekerjaan *</Label>
                    <Textarea
                      id="vendorDesc"
                      value={vendorInfo.description}
                      onChange={(e) => setVendorInfo({ ...vendorInfo, description: e.target.value })}
                      placeholder="Jelaskan pekerjaan yang perlu dilakukan oleh vendor..."
                      rows={4}
                    />
                  </div>
                </div>
              </>
            )}

            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Setelah work order dibuat, status tiket akan berubah menjadi "On Hold" dan Admin Penyedia akan memproses work order ini.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkOrderDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitWorkOrder}>
              Buat Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cannot Repair Dialog */}
      <Dialog open={showCannotRepairDialog} onOpenChange={setShowCannotRepairDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Konfirmasi Barang Tidak Dapat Diperbaiki</DialogTitle>
            <DialogDescription>
              Isi informasi detail dan berikan rekomendasi solusi kepada user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                User akan menerima notifikasi bahwa barang tidak dapat diperbaiki beserta saran Anda.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="alasanTidakBisa">Alasan Tidak Dapat Diperbaiki *</Label>
              <Textarea
                id="alasanTidakBisa"
                placeholder="Jelaskan secara detail mengapa barang tidak dapat diperbaiki..."
                value={cannotRepairForm.alasanTidakBisa}
                onChange={(e) => setCannotRepairForm({ ...cannotRepairForm, alasanTidakBisa: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rekomendasiSolusi">Rekomendasi Solusi *</Label>
              <Textarea
                id="rekomendasiSolusi"
                placeholder="Saran solusi: pengajuan barang baru, alternatif lain, dll..."
                value={cannotRepairForm.rekomendasiSolusi}
                onChange={(e) => setCannotRepairForm({ ...cannotRepairForm, rekomendasiSolusi: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimasiBiaya">Estimasi Biaya Barang Baru (Opsional)</Label>
              <Input
                id="estimasiBiaya"
                placeholder="Rp. 0"
                value={cannotRepairForm.estimasiBiayaBaruJikaDibeli}
                onChange={(e) => setCannotRepairForm({ ...cannotRepairForm, estimasiBiayaBaruJikaDibeli: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatanTambahan">Catatan Tambahan (Opsional)</Label>
              <Textarea
                id="catatanTambahan"
                placeholder="Informasi tambahan yang perlu diketahui..."
                value={cannotRepairForm.catatanTambahan}
                onChange={(e) => setCannotRepairForm({ ...cannotRepairForm, catatanTambahan: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCannotRepairDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCannotRepair} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Konfirmasi Tidak Dapat Diperbaiki
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Penyelesaian Perbaikan</DialogTitle>
            <DialogDescription>
              Dokumentasikan hasil perbaikan dan berikan saran perawatan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tindakanDilakukan">Tindakan yang Dilakukan *</Label>
              <Textarea
                id="tindakanDilakukan"
                placeholder="Jelaskan langkah perbaikan yang telah dilakukan..."
                value={completionForm.tindakanDilakukan}
                onChange={(e) => setCompletionForm({ ...completionForm, tindakanDilakukan: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="komponenDiganti">Komponen yang Diganti/Diperbaiki</Label>
              <Input
                id="komponenDiganti"
                placeholder="Daftar komponen yang diganti atau diperbaiki..."
                value={completionForm.komponenDiganti}
                onChange={(e) => setCompletionForm({ ...completionForm, komponenDiganti: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hasilPerbaikan">Hasil Perbaikan *</Label>
              <Textarea
                id="hasilPerbaikan"
                placeholder="Kondisi barang setelah perbaikan, fungsi yang sudah normal, dll..."
                value={completionForm.hasilPerbaikan}
                onChange={(e) => setCompletionForm({ ...completionForm, hasilPerbaikan: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saranPerawatan">Saran Perawatan</Label>
              <Textarea
                id="saranPerawatan"
                placeholder="Saran untuk merawat barang agar tidak rusak lagi..."
                value={completionForm.saranPerawatan}
                onChange={(e) => setCompletionForm({ ...completionForm, saranPerawatan: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatanTambahanCompletion">Catatan Tambahan</Label>
              <Textarea
                id="catatanTambahanCompletion"
                placeholder="Catatan tambahan yang perlu diketahui user..."
                value={completionForm.catatanTambahan}
                onChange={(e) => setCompletionForm({ ...completionForm, catatanTambahan: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fotoBukti">Link Foto Bukti Perbaikan (Opsional)</Label>
              <Input
                id="fotoBukti"
                placeholder="URL foto atau dokumentasi..."
                value={completionForm.fotoBukti}
                onChange={(e) => setCompletionForm({ ...completionForm, fotoBukti: e.target.value })}
              />
            </div>

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Setelah submit, tiket akan otomatis ditutup dan user akan menerima notifikasi bahwa perbaikan selesai.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCompleteRepair} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Selesaikan Perbaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
