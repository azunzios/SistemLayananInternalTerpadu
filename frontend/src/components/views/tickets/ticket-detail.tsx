// @ts-nocheck
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TicketProgressTracker } from "./ticket-progress-tracker";
import { TicketProgressTrackerZoom } from "./ticket-progress-tracker-zoom";
import { WorkOrderForm } from "@/components/views/work-orders/work-order-form";
import { ZoomAdminReviewModal } from '@/components/views/zoom';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import type { User } from "@/types";
import { motion } from "motion/react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  getTickets,
  getUsersSync,
  getWorkOrdersByTicket,
} from "@/lib/storage";
import type { ViewType } from "@/components/main-layout";
import { TicketDetailHeader, TicketDetailInfo } from "./ticket-detail-info";
import { TicketDetailAlerts } from "./ticket-detail-alerts";
import { TicketDiagnosisForm } from "./ticket-diagnosis-form";
import { useTicketComments } from "@/hooks/useTicketComments";
import {
  useAdminLayananDialogs,
  useDiagnosaDialogs,
  useWorkOrderDialogs,
  useCommentState,
  useZoomReviewModal,
} from "./ticket-detail-hooks";

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
  const [diagnosisSubmitCallback, setDiagnosisSubmitCallback] = React.useState<(() => Promise<void>) | null>(null);
  const [showDiagnosisConfirm, setShowDiagnosisConfirm] = React.useState(false);
  const tickets = useMemo(() => getTickets(), [refreshKey]);
  const users = getUsersSync();

  // Import state dari custom hooks
  const adminDialogs = useAdminLayananDialogs();
  const diagnosaDialog = useDiagnosaDialogs();
  const workOrderDialog = useWorkOrderDialogs();
  const { comment, setComment } = useCommentState();
  const { showZoomReviewModal, setShowZoomReviewModal } = useZoomReviewModal();
  const {
    comments,
    loading: commentsLoading,
    hasMore,
    fetchComments,
    loadMoreComments,
    addComment,
  } = useTicketComments();

  // Fetch full ticket detail from backend
  React.useEffect(() => {
    const fetchTicketDetail = async () => {
      setLoadingDetail(true);
      try {
        const response = await api.get<any>(`tickets/${ticketId}`);
        const ticketData = response.data || response;
        setTicketDetail(ticketData);
        console.log("📝 Ticket Detail fetched:", ticketData);
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
  const [technicianStats, setTechnicianStats] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const fetchTechnicianStats = async () => {
      try {
        const response = await api.get<any[]>('technician-stats');
        const stats = response.reduce((acc, curr) => {
          acc[curr.id] = curr.active_tickets;
          return acc;
        }, {} as Record<string, number>);
        setTechnicianStats(stats);
      } catch (error) {
        console.error("Failed to fetch technician stats:", error);
      }
    };

    if (adminDialogs.showAssignDialog) {
      fetchTechnicianStats();
    }
  }, [adminDialogs.showAssignDialog]);

  const technicians = useMemo(
    () => users.filter((u) => u.role === "teknisi"),
    [users]
  );

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
    ticket.userId === currentUser.id &&
    ["waiting_for_submitter"].includes(ticket.status as any)
    ;

  // === HANDLERS (KEPT INLINE) ===
  const handleApprove = async () => {
    // Jika tiket perbaikan, buka dialog assign teknisi
    if (ticket.type === "perbaikan") {
      adminDialogs.setShowApproveDialog(false);
      adminDialogs.setShowAssignDialog(true);
      return;
    }

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
      });

      toast.success("Tiket berhasil ditugaskan");
      adminDialogs.setShowAssignDialog(false);
      adminDialogs.setSelectedTechnician("");
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to assign ticket:", error);
      const errorMsg = error?.body?.message || "Gagal menugaskan tiket";
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

  // Handler untuk menampilkan konfirmasi status change sebelum submit diagnosis
  const handleRequestStatusChange = (callback: () => Promise<void>) => {
    // Simpan callback untuk diexecute setelah status change
    setDiagnosisSubmitCallback(() => callback);
    // Tampilkan dialog konfirmasi
    diagnosaDialog.setShowStatusChangeConfirm(true);
  };

  // Handler untuk confirm status change dan execute diagnosis submit
  const handleStatusChangeOnDiagnosisSubmit = async () => {
    if (ticket.status === "assigned") {
      try {
        await api.patch(`tickets/${ticketId}/status`, {
          status: "in_progress",
        });
        toast.success("Status tiket berhasil diubah menjadi In Progress");
        diagnosaDialog.setShowStatusChangeConfirm(false);
        setRefreshKey((prev) => prev + 1);
        
        // Execute diagnosis submission after status is changed
        setTimeout(async () => {
          if (diagnosisSubmitCallback) {
            await diagnosisSubmitCallback();
            setDiagnosisSubmitCallback(null);
          }
        }, 500);
      } catch (error: any) {
        console.error("Failed to change status:", error);
        const errorMsg = error?.body?.message || "Gagal mengubah status tiket";
        toast.error(errorMsg);
        diagnosaDialog.setShowStatusChangeConfirm(false);
        setDiagnosisSubmitCallback(null);
      }
    }
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
        onShowCompleteDialog={() => { }}
      />

      {/* Alerts */}
      <TicketDetailAlerts
        ticket={ticket}
        currentUser={currentUser}
        onShowReviewDialog={() => {
          if (ticket.type === "perbaikan") {
            adminDialogs.setShowAssignDialog(true);
          } else {
            adminDialogs.setShowApproveDialog(true);
          }
        }}
        onShowRejectDialog={() => adminDialogs.setShowRejectDialog(true)}
        onShowAssignDialog={() => adminDialogs.setShowAssignDialog(true)}
        onShowDiagnosaDialog={() => setShowDiagnosisConfirm(true)}
        onShowSparepartDialog={() =>
          workOrderDialog.setShowSparepartDialog(true)
        }
        getWorkOrdersByTicket={getWorkOrdersByTicket}
        onUpdate={() => setRefreshKey((prev) => prev + 1)}
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
      {/* Teknisi Workflow - Removed: all alerts and actions moved to TicketDetailAlerts */}

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
                    {tech.name} ({technicianStats[tech.id] || 0} aktif)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={diagnosaDialog.showStatusChangeConfirm} onOpenChange={diagnosaDialog.setShowStatusChangeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah Status Tiket</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">
            Ini akan mengubah status tiket menjadi <span className="font-semibold text-blue-600">In Progress</span>. Lanjutkan?
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChangeOnDiagnosisSubmit} className="bg-blue-600 hover:bg-blue-700">
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diagnosis Confirmation Dialog */}
      <AlertDialog open={showDiagnosisConfirm} onOpenChange={setShowDiagnosisConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ticket?.diagnosis ? "Ubah Diagnosis?" : "Isi Diagnosis?"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">
            {ticket?.diagnosis
              ? "Anda akan mengubah hasil diagnosis sebelumnya. Pastikan informasi baru sudah diperiksa dengan teliti."
              : "Mulai dengan mengisi form diagnosis untuk menentukan kondisi barang dan opsi perbaikan."}
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDiagnosisConfirm(false);
                diagnosaDialog.setShowDiagnosaDialog(true);
              }}
            >
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diagnosa Form - Full featured diagnosis form */}
      <TicketDiagnosisForm
        ticketId={ticketId}
        ticketNumber={ticket.ticketNumber}
        open={diagnosaDialog.showDiagnosaDialog}
        onOpenChange={(open) => {
          diagnosaDialog.setShowDiagnosaDialog(open);
        }}
        existingDiagnosis={(ticket as any).diagnosis || null}
        onDiagnosisSubmitted={() => {
          setRefreshKey((prev) => prev + 1);
        }}
        ticketStatus={ticket.status}
        onRequestStatusChange={handleRequestStatusChange}
      />

      {/* Work Order - Form Dialog */}
      <WorkOrderForm
        isOpen={workOrderDialog.showSparepartDialog}
        onClose={() => workOrderDialog.setShowSparepartDialog(false)}
        ticketId={Number(ticketId)}
        ticketStatus={ticket?.status || "in_progress"}
        workOrderCount={getWorkOrdersByTicket(ticketId).length}
        existingWorkOrders={getWorkOrdersByTicket(ticketId)}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
        }}
      />

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
