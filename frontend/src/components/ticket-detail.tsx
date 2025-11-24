import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Alert, AlertDescription } from "./ui/alert";
import { TicketProgressTracker } from "./ticket-progress-tracker";
import { TicketProgressTrackerZoom } from "./ticket-progress-tracker-zoom";
import { TeknisiWorkflow } from "./teknisi-workflow-new";
import { ZoomAdminReviewModal } from "./zoom-admin-review-modal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import type { User } from "../types";
type TicketStatus = any;
import { motion } from "motion/react";
import { Spinner } from "./ui/spinner";
import { toast } from "sonner";
import { api } from "../lib/api";
import {
  getTickets,
  saveTickets,
  getUsersSync,
  addNotification,
  getWorkOrdersByTicket,
} from "../lib/storage";
import type { ViewType } from "./main-layout";
import { TicketDetailHeader, TicketDetailInfo } from "./ticket-detail-info";
import { TicketDetailAlerts } from "./ticket-detail-alerts";
import { formatActorName } from "./ticket-detail-utils";
import { useTicketComments } from "../hooks/useTicketComments";
import { TicketDiagnosisForm } from "./ticket-diagnosis-form";
import { WorkOrderForm } from "./work-order-form";
import {
  useAdminLayananDialogs,
  useTeknisiDialogs,
  useDiagnosaDialogs,
  useProgressDialog,
  useCommentState,
  useZoomReviewModal,
} from "./ticket-detail-hooks";

const ZOOM_PRO_ACCOUNTS = [
  {
    id: "zoom1",
    name: "Zoom Pro 1",
    email: "zoom1@bps-ntb.go.id",
    hostKey: "4567891",
  },
  {
    id: "zoom2",
    name: "Zoom Pro 2",
    email: "zoom2@bps-ntb.go.id",
    hostKey: "7891234",
  },
  {
    id: "zoom3",
    name: "Zoom Pro 3",
    email: "zoom3@bps-ntb.go.id",
    hostKey: "2345678",
  },
];

interface TicketDetailProps {
  ticketId: string;
  currentUser: User;
  onBack: () => void;
  onNavigate: (view: ViewType) => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticketId,
  currentUser,
  onBack,
}) => {
  // === ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ===
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [ticketDetail, setTicketDetail] = React.useState<any>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(true);
  const [users, setUsers] = React.useState<User[]>([]);
  const [allTickets, setAllTickets] = React.useState<any[]>([]);
  const tickets = useMemo(() => getTickets(), [refreshKey]);

  // Import state dari custom hooks
  const adminDialogs = useAdminLayananDialogs();
  const tekDialogs = useTeknisiDialogs();
  const diagnosaDialog = useDiagnosaDialogs();
  const progressDialog = useProgressDialog();
  const { comment, setComment } = useCommentState();
  const { showZoomReviewModal, setShowZoomReviewModal } = useZoomReviewModal();
  const [showDiagnosisForm, setShowDiagnosisForm] = React.useState(false);
  const [showWorkOrderForm, setShowWorkOrderForm] = React.useState(false);
  const {
    comments,
    loading: commentsLoading,
    hasMore,
    fetchComments,
    loadMoreComments,
    addComment,
  } = useTicketComments();

  // Fetch users from API
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get<any>("users?per_page=100");
        // Backend returns paginated data: { data: [...], meta: {...} }
        const usersData = response?.data || [];
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        // Fallback to cached users if API fails
        setUsers(getUsersSync());
      }
    };
    fetchUsers();
  }, []);

  // Fetch all tickets from API untuk hitung tiket aktif teknisi
  React.useEffect(() => {
    const fetchAllTickets = async () => {
      try {
        const response = await api.get<any>(
          "tickets?per_page=1000&type=perbaikan"
        );
        const ticketsData = response?.data || [];
        setAllTickets(ticketsData);
      } catch (error) {
        console.error("Failed to fetch all tickets:", error);
        // Fallback to cached tickets if API fails
        setAllTickets(getTickets());
      }
    };
    fetchAllTickets();
  }, [refreshKey]);

  // Fetch full ticket detail from backend
  React.useEffect(() => {
    const fetchTicketDetail = async () => {
      setLoadingDetail(true);
      try {
        const response = await api.get<any>(`tickets/${ticketId}`);
        const ticketData = response.data || response;
        setTicketDetail(ticketData);
      } catch (error) {
        console.error("Failed to fetch ticket detail:", error);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchTicketDetail();
  }, [ticketId, refreshKey]);

  // Fetch comments saat component mount
  React.useEffect(() => {
    fetchComments(ticketId);
  }, [ticketId, fetchComments]);

  const ticket = ticketDetail || tickets.find((t) => t.id === ticketId);

  // === COMPUTED VALUES (useMemo must be before conditional returns) ===
  const technicians = useMemo(() => {
    return users.filter((u) => u.role === "teknisi");
  }, [users]);

  const technicianActiveTickets = useMemo(() => {
    const activeStatuses: TicketStatus[] = [
      "assigned",
      "in_progress",
      "on_hold",
      "ditugaskan",
      "diterima_teknisi",
      "sedang_diagnosa",
      "dalam_perbaikan",
      "menunggu_sparepart",
      "approved", // Tambahkan status approved juga
    ];
    const counts = technicians.reduce((acc, tech) => {
      const activeCount = allTickets.filter((t) => {
        // Support both camelCase (assignedTo) and snake_case (assigned_to) from backend
        const assignedUserId = t.assignedTo || t.assigned_to;
        return (
          t.type === "perbaikan" &&
          assignedUserId === tech.id &&
          activeStatuses.includes(t.status)
        );
      }).length;
      acc[tech.id] = activeCount;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  }, [technicians, allTickets]);

  // === EARLY RETURN IF TICKET NOT FOUND (AFTER ALL HOOKS) ===
  if (loadingDetail) {
    return (
      <div className="text-center py-12">
        <Spinner className="h-16 w-16 mx-auto mb-4 text-blue-500" />
        <p className="text-gray-500">Memuat detail tiket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">Tiket tidak ditemukan</p>
        <Button onClick={onBack} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  // === DERIVED VALUES (after ticket is confirmed to exist) ===
  const ticketOwner = users.find((u) => u.id === ticket.userId);
  // Use assignedUser from backend if available, otherwise find from users array
  const assignedUser = ticket.assignedTo
    ? users.find((u) => u.id === ticket.assignedTo)
    : null;

  // === PERMISSION CHECKS ===
  const canComplete =
    currentUser.role === "pegawai" &&
    String(ticket.userId) === String(currentUser.id) &&
    ["resolved", "selesai_diperbaiki", "dalam_pengiriman"].includes(
      ticket.status as any
    );

  // === HANDLERS (KEPT INLINE) ===
  const handleApprove = async () => {
    try {
      await api.patch(`tickets/${ticketId}/approve`, {});

      toast.success("Tiket berhasil disetujui");
      adminDialogs.setShowApproveDialog(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to approve ticket:", error);
      const errorMsg = error?.body?.message || "Gagal menyetujui tiket";
      toast.error(errorMsg);
    }
  };

  const handleReject = async () => {
    if (!adminDialogs.rejectReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    try {
      // Gunakan endpoint yang sesuai berdasarkan tipe tiket
      const endpoint =
        ticket.type === "zoom_meeting"
          ? `tickets/${ticketId}/reject-zoom`
          : `tickets/${ticketId}/reject`;

      await api.patch(endpoint, {
        reason: adminDialogs.rejectReason,
      });

      toast.success("Tiket berhasil ditolak");
      adminDialogs.setShowRejectDialog(false);
      adminDialogs.setRejectReason("");
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to reject ticket:", error);
      const errorMsg = error?.body?.message || "Gagal menolak tiket";
      toast.error(errorMsg);
    }
  };

  const handleAssign = async () => {
    if (!adminDialogs.selectedTechnician) {
      toast.error("Pilih teknisi terlebih dahulu");
      return;
    }

    try {
      await api.patch(`tickets/${ticketId}/assign`, {
        assigned_to: adminDialogs.selectedTechnician,
        notes: adminDialogs.assignNotes,
      });

      toast.success("Tiket berhasil ditugaskan");
      adminDialogs.setShowAssignDialog(false);
      adminDialogs.setSelectedTechnician("");
      adminDialogs.setAssignNotes("");
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to assign ticket:", error);
      const errorMsg = error?.body?.message || "Gagal assign tiket";
      toast.error(errorMsg);
    }
  };

  const handleComplete = async () => {
    try {
      await api.patch(`tickets/${ticketId}/status`, {
        status: "closed",
        notes: "Tiket dikonfirmasi selesai oleh pegawai",
      });

      toast.success(
        "Terima kasih atas konfirmasinya! Tiket telah diselesaikan."
      );
      setRefreshKey((prev) => prev + 1); // Refresh ticket data
      // Optionally navigate back or close dialog
      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (error: any) {
      console.error("Failed to close ticket:", error);
      const errorMsg = error?.body?.message || "Gagal menyelesaikan tiket";
      toast.error(errorMsg);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("Komentar tidak boleh kosong");
      return;
    }
    try {
      await addComment(ticketId, comment);
      toast.success("Komentar berhasil dikirim");
      setComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Gagal mengirim komentar");
    }
  };

  // === TEKNISI HANDLERS ===
  const handleTeknisiAcceptTicket = async () => {
    if (!tekDialogs.estimatedSchedule) {
      toast.error("Estimasi jadwal harus diisi");
      return;
    }
    try {
      await api.patch(`tickets/${ticketId}/status`, {
        status: "accepted",
        estimated_schedule: tekDialogs.estimatedSchedule,
      });
      toast.success("Tiket berhasil diterima");
      tekDialogs.setShowTeknisiAcceptDialog(false);
      tekDialogs.setEstimatedSchedule("");
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to accept ticket:", error);
      toast.error(error.response?.data?.message || "Gagal menerima tiket");
    }
  };

  const handleTeknisiRejectTicket = async () => {
    if (!tekDialogs.teknisiRejectReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }
    try {
      await api.patch(`tickets/${ticketId}/status`, {
        status: "rejected",
        reject_reason: tekDialogs.teknisiRejectReason,
      });
      toast.success("Tiket telah ditolak");
      tekDialogs.setShowTeknisiRejectDialog(false);
      tekDialogs.setTeknisiRejectReason("");
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to reject ticket:", error);
      toast.error(error.response?.data?.message || "Gagal menolak tiket");
    }
  };

  const handleSubmitDiagnosa = () => {
    if (
      !diagnosaDialog.diagnosaForm.pemeriksaanFisik ||
      !diagnosaDialog.diagnosaForm.hasilTesting ||
      !diagnosaDialog.diagnosaForm.dapatDiperbaiki
    ) {
      toast.error("Semua field diagnosa wajib diisi");
      return;
    }
    if (diagnosaDialog.diagnosaForm.dapatDiperbaiki === "tidak") {
      diagnosaDialog.setShowDiagnosaDialog(false);
      diagnosaDialog.setShowCannotRepairDialog(true);
    } else {
      diagnosaDialog.setShowDiagnosaDialog(false);
      diagnosaDialog.setShowStartRepairDialog(true);
    }
  };

  const handleCannotRepair = () => {
    if (
      !diagnosaDialog.cannotRepairForm.alasanTidakBisa ||
      !diagnosaDialog.cannotRepairForm.rekomendasiSolusi
    ) {
      toast.error("Alasan dan rekomendasi solusi harus diisi");
      return;
    }
    const updatedTickets = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: "tidak_dapat_diperbaiki" as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: "STATUS_UPDATE",
              actor: currentUser.name,
              details: `Barang tidak dapat diperbaiki: ${diagnosaDialog.cannotRepairForm.alasanTidakBisa}`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: ticket.userId,
      title: "Barang Tidak Dapat Diperbaiki",
      message: `Saran: ${diagnosaDialog.cannotRepairForm.rekomendasiSolusi}`,
      type: "warning",
      read: false,
    });
    toast.success("Status diubah ke Tidak Dapat Diperbaiki");
    diagnosaDialog.setShowCannotRepairDialog(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleStartRepair = () => {
    if (
      !diagnosaDialog.repairForm.rencanaPerbaikan ||
      !diagnosaDialog.repairForm.estimasiWaktu
    ) {
      toast.error("Rencana perbaikan dan estimasi waktu harus diisi");
      return;
    }
    const updatedTickets = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: "dalam_perbaikan" as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: "STATUS_UPDATE",
              actor: currentUser.name,
              details: `Memulai perbaikan. Estimasi: ${diagnosaDialog.repairForm.estimasiWaktu}`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: ticket.userId,
      title: "Perbaikan Dimulai",
      message: `Estimasi waktu: ${diagnosaDialog.repairForm.estimasiWaktu}`,
      type: "info",
      read: false,
    });
    toast.success("Status diubah ke Dalam Perbaikan");
    diagnosaDialog.setShowStartRepairDialog(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCompleteRepair = () => {
    if (
      !diagnosaDialog.completionForm.tindakanDilakukan ||
      !diagnosaDialog.completionForm.hasilPerbaikan
    ) {
      toast.error("Tindakan dan hasil perbaikan harus diisi");
      return;
    }
    const updatedTickets = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: "selesai_diperbaiki" as TicketStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: "STATUS_UPDATE",
              actor: currentUser.name,
              details: `Perbaikan selesai: ${diagnosaDialog.completionForm.hasilPerbaikan}`,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: ticket.userId,
      title: "Perbaikan Selesai",
      message: `Perbaikan telah diselesaikan`,
      type: "success",
      read: false,
    });
    toast.success("Perbaikan selesai!");
    diagnosaDialog.setShowCompletionDialog(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleUpdateProgress = () => {
    if (
      progressDialog.newStatus === "tidak_dapat_diperbaiki" &&
      !progressDialog.progressNotes.trim()
    ) {
      toast.error("Catatan wajib diisi");
      return;
    }
    const isClosed = progressDialog.newStatus === "tidak_dapat_diperbaiki";
    const updatedTickets = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: progressDialog.newStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...t.timeline,
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: "STATUS_UPDATE",
              actor: currentUser.name,
              details: progressDialog.progressNotes,
            },
          ],
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    addNotification({
      userId: ticket.userId,
      title: isClosed ? "Tiket Ditutup" : "Progress Update",
      message: progressDialog.progressNotes,
      type: isClosed ? "error" : "info",
      read: false,
    });
    toast.success(isClosed ? "Tiket ditutup" : "Progress updated");
    progressDialog.setShowProgressDialog(false);
    progressDialog.setProgressNotes("");
    if (isClosed) setTimeout(() => onBack(), 1000);
  };

  // === RENDER ===
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <TicketDetailHeader
        ticket={ticket}
        currentUser={currentUser}
        canComplete={canComplete}
        onBack={onBack}
        onShowCompleteDialog={handleComplete}
      />

      {/* Teknisi Workflow - After header */}
      {(() => {
        const shouldShowWorkflow =
          currentUser.role === "teknisi" &&
          ticketDetail &&
          ticketDetail.type === "perbaikan" &&
          ticketDetail.assignedTo == currentUser.id &&
          ["assigned", "in_progress", "on_hold"].includes(
            ticketDetail.status as any
          );

        return shouldShowWorkflow ? (
          <TeknisiWorkflow
            ticket={ticketDetail}
            currentUser={currentUser}
            onUpdate={() => setRefreshKey((prev) => prev + 1)}
          />
        ) : null;
      })()}

      {/* Alerts */}
      <TicketDetailAlerts
        ticket={ticket}
        currentUser={currentUser}
        onShowReviewDialog={() => adminDialogs.setShowApproveDialog(true)}
        onShowRejectDialog={() => adminDialogs.setShowRejectDialog(true)}
        onShowAssignDialog={() => adminDialogs.setShowAssignDialog(true)}
        onShowDiagnosaDialog={() => setShowDiagnosisForm(true)}
        onShowCompletionDialog={() =>
          diagnosaDialog.setShowCompletionDialog(true)
        }
        onShowSparepartDialog={() => setShowWorkOrderForm(true)}
        getWorkOrdersByTicket={getWorkOrdersByTicket}
      />

      {/* Info */}
      <TicketDetailInfo
        ticket={ticket}
        ticketOwner={ticketOwner}
        assignedUser={assignedUser || undefined}
        comment={comment}
        onCommentChange={setComment}
        onAddComment={handleAddComment}
        getWorkOrdersByTicket={getWorkOrdersByTicket}
        comments={comments}
        commentsLoading={commentsLoading}
        hasMore={hasMore}
        onLoadMoreComments={() => loadMoreComments(ticketId)}
      />

      {/* Progress Tracker */}
      {ticket.type === "perbaikan" && <TicketProgressTracker ticket={ticket} />}
      {ticket.type === "zoom_meeting" && (
        <TicketProgressTrackerZoom ticket={ticket} />
      )}

      {/* ============== DIALOGS ============== */}

      {/* Approve */}
      <AlertDialog
        open={adminDialogs.showApproveDialog}
        onOpenChange={adminDialogs.setShowApproveDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Tiket</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Setujui
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject */}
      <Dialog
        open={adminDialogs.showRejectDialog}
        onOpenChange={adminDialogs.setShowRejectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Tiket</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Alasan penolakan..."
            value={adminDialogs.rejectReason}
            onChange={(e) => adminDialogs.setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => adminDialogs.setShowRejectDialog(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign */}
      <Dialog
        open={adminDialogs.showAssignDialog}
        onOpenChange={adminDialogs.setShowAssignDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign ke Teknisi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={adminDialogs.selectedTechnician}
              onValueChange={adminDialogs.setSelectedTechnician}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih teknisi" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name} ({technicianActiveTickets[tech.id] || 0} aktif)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Catatan..."
              value={adminDialogs.assignNotes}
              onChange={(e) => adminDialogs.setAssignNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => adminDialogs.setShowAssignDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleAssign}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teknisi Accept */}
      <Dialog
        open={tekDialogs.showTeknisiAcceptDialog}
        onOpenChange={tekDialogs.setShowTeknisiAcceptDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terima Tiket</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Estimasi jadwal..."
            value={tekDialogs.estimatedSchedule}
            onChange={(e) => tekDialogs.setEstimatedSchedule(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => tekDialogs.setShowTeknisiAcceptDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleTeknisiAcceptTicket}>Terima</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teknisi Reject */}
      <AlertDialog
        open={tekDialogs.showTeknisiRejectDialog}
        onOpenChange={tekDialogs.setShowTeknisiRejectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Tiket</AlertDialogTitle>
          </AlertDialogHeader>
          <Textarea
            placeholder="Alasan..."
            value={tekDialogs.teknisiRejectReason}
            onChange={(e) => tekDialogs.setTeknisiRejectReason(e.target.value)}
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleTeknisiRejectTicket}>
              Tolak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diagnosa - Form Baru Terhubung Backend */}
      <TicketDiagnosisForm
        ticketId={ticketId}
        ticketNumber={ticket.ticketNumber}
        open={showDiagnosisForm}
        onOpenChange={setShowDiagnosisForm}
        existingDiagnosis={ticket.diagnosis || null}
        onDiagnosisSubmitted={() => {
          setRefreshKey((prev) => prev + 1);
        }}
        onCreateWorkOrder={(_type: "sparepart" | "vendor" | "license") => {
          setShowWorkOrderForm(true);
        }}
      />

      {/* Work Order Form */}
      <WorkOrderForm
        isOpen={showWorkOrderForm}
        onClose={() => setShowWorkOrderForm(false)}
        ticketId={parseInt(ticketId)}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
        }}
      />

      {/* Diagnosa - Dialog Lama (Backup) */}
      <Dialog
        open={diagnosaDialog.showDiagnosaDialog}
        onOpenChange={diagnosaDialog.setShowDiagnosaDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form Diagnosa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Pemeriksaan fisik..."
              value={diagnosaDialog.diagnosaForm.pemeriksaanFisik}
              onChange={(e) =>
                diagnosaDialog.setDiagnosaForm({
                  ...diagnosaDialog.diagnosaForm,
                  pemeriksaanFisik: e.target.value,
                })
              }
              rows={3}
            />
            <Textarea
              placeholder="Hasil testing..."
              value={diagnosaDialog.diagnosaForm.hasilTesting}
              onChange={(e) =>
                diagnosaDialog.setDiagnosaForm({
                  ...diagnosaDialog.diagnosaForm,
                  hasilTesting: e.target.value,
                })
              }
              rows={3}
            />
            <div>
              <Label>Dapat diperbaiki?</Label>
              <RadioGroup
                value={diagnosaDialog.diagnosaForm.dapatDiperbaiki}
                onValueChange={(val) =>
                  diagnosaDialog.setDiagnosaForm({
                    ...diagnosaDialog.diagnosaForm,
                    dapatDiperbaiki: val as any,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ya" id="ya" />
                  <Label htmlFor="ya">Ya</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tidak" id="tidak" />
                  <Label htmlFor="tidak">Tidak</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => diagnosaDialog.setShowDiagnosaDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleSubmitDiagnosa}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cannot Repair */}
      <Dialog
        open={diagnosaDialog.showCannotRepairDialog}
        onOpenChange={diagnosaDialog.setShowCannotRepairDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tidak Dapat Diperbaiki</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Alasan..."
              value={diagnosaDialog.cannotRepairForm.alasanTidakBisa}
              onChange={(e) =>
                diagnosaDialog.setCannotRepairForm({
                  ...diagnosaDialog.cannotRepairForm,
                  alasanTidakBisa: e.target.value,
                })
              }
              rows={3}
            />
            <Textarea
              placeholder="Rekomendasi..."
              value={diagnosaDialog.cannotRepairForm.rekomendasiSolusi}
              onChange={(e) =>
                diagnosaDialog.setCannotRepairForm({
                  ...diagnosaDialog.cannotRepairForm,
                  rekomendasiSolusi: e.target.value,
                })
              }
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => diagnosaDialog.setShowCannotRepairDialog(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleCannotRepair}>
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Repair */}
      <Dialog
        open={diagnosaDialog.showStartRepairDialog}
        onOpenChange={diagnosaDialog.setShowStartRepairDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mulai Perbaikan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Rencana perbaikan..."
              value={diagnosaDialog.repairForm.rencanaPerbaikan}
              onChange={(e) =>
                diagnosaDialog.setRepairForm({
                  ...diagnosaDialog.repairForm,
                  rencanaPerbaikan: e.target.value,
                })
              }
              rows={3}
            />
            <Input
              placeholder="Estimasi waktu..."
              value={diagnosaDialog.repairForm.estimasiWaktu}
              onChange={(e) =>
                diagnosaDialog.setRepairForm({
                  ...diagnosaDialog.repairForm,
                  estimasiWaktu: e.target.value,
                })
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => diagnosaDialog.setShowStartRepairDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleStartRepair}>Mulai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion */}
      <Dialog
        open={diagnosaDialog.showCompletionDialog}
        onOpenChange={diagnosaDialog.setShowCompletionDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Penyelesaian Perbaikan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Tindakan..."
              value={diagnosaDialog.completionForm.tindakanDilakukan}
              onChange={(e) =>
                diagnosaDialog.setCompletionForm({
                  ...diagnosaDialog.completionForm,
                  tindakanDilakukan: e.target.value,
                })
              }
              rows={3}
            />
            <Textarea
              placeholder="Hasil..."
              value={diagnosaDialog.completionForm.hasilPerbaikan}
              onChange={(e) =>
                diagnosaDialog.setCompletionForm({
                  ...diagnosaDialog.completionForm,
                  hasilPerbaikan: e.target.value,
                })
              }
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => diagnosaDialog.setShowCompletionDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleCompleteRepair}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress */}
      <Dialog
        open={progressDialog.showProgressDialog}
        onOpenChange={progressDialog.setShowProgressDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={progressDialog.newStatus}
              onValueChange={(val) => progressDialog.setNewStatus(val as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedang_diagnosa">Sedang Diagnosa</SelectItem>
                <SelectItem value="dalam_perbaikan">Dalam Perbaikan</SelectItem>
                <SelectItem value="tidak_dapat_diperbaiki">
                  Tidak Dapat Diperbaiki
                </SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Catatan..."
              value={progressDialog.progressNotes}
              onChange={(e) => progressDialog.setProgressNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => progressDialog.setShowProgressDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateProgress}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zoom Modal */}
      {showZoomReviewModal && ticket.type === "zoom_meeting" && (
        <ZoomAdminReviewModal
          booking={ticket}
          onClose={() => setShowZoomReviewModal(false)}
          onUpdate={() => {
            setShowZoomReviewModal(false);
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </motion.div>
  );
};
