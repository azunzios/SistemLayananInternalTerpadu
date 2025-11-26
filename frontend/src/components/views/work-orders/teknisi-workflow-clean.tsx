import React, { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle,
  XCircle,
  ClipboardCheck,
  Package,
  CheckCircle2,
  Clock,
  PlayCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { WorkOrderForm } from "@/components/views/work-orders/work-order-form";
import type {
  Ticket,
  User,
} from "@/types";
import {toast} from "sonner";

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
  // Compute work order stats directly from ticket prop
  const workOrders = (ticket as any).workOrders || [];
  const pendingWO = workOrders.filter(
    (wo: any) => wo.status === "requested" || wo.status === "in_procurement"
  );
  const completedWO = workOrders.filter(
    (wo: any) => wo.status === "completed" || wo.status === "delivered"
  );

  const workOrderStats = {
    total: workOrders.length,
    pending: pendingWO.length,
    completed: completedWO.length,
    allCompleted:
      completedWO.length === workOrders.length && workOrders.length > 0,
    workOrders,
  };

  // Accept/Reject Dialog
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [estimatedSchedule, setEstimatedSchedule] = useState("");

  // Work Order Form
  const [showWorkOrderForm, setShowWorkOrderForm] = useState(false);

  // ============== HANDLER FUNCTIONS ==============

  const handleAcceptTicket = async () => {
    if (!estimatedSchedule) {
      toast.error("Estimasi jadwal harus diisi");
      return;
    }

    try {
      await api.patch(`tickets/${ticket.id}/status`, {
        status: "in_progress",
        estimated_schedule: estimatedSchedule,
        notes: `Tiket diterima teknisi. Estimasi jadwal: ${estimatedSchedule}`,
      });

      toast.success("Tiket berhasil diterima");
      setShowAcceptDialog(false);
      setEstimatedSchedule("");
      onUpdate();
    } catch (error: any) {
      console.error("Failed to accept ticket:", error);
      toast.error(error.response?.data?.message || "Gagal menerima tiket");
    }
  };

  const handleRejectTicket = async () => {
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    try {
      await api.patch(`tickets/${ticket.id}/status`, {
        status: "submitted",
        reject_reason: rejectReason,
        notes: `Tiket ditolak teknisi. Alasan: ${rejectReason}`,
      });

      await api.patch(`tickets/${ticket.id}/assign`, {
        assigned_to: null,
      });

      toast.success(
        "Tiket telah ditolak. Admin Layanan akan melakukan re-assign."
      );
      setShowRejectDialog(false);
      setRejectReason("");
      onUpdate();
    } catch (error: any) {
      console.error("Failed to reject ticket:", error);
      toast.error(error.response?.data?.message || "Gagal menolak tiket");
    }
  };

  // ============== RENDER ==============

  const isAssignedToMe = ticket.assignedTo == currentUser.id;

  if (!isAssignedToMe) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Alert: Work Order Completed */}
      {(() => {
        const shouldShow =
          ticket.status === "on_hold" && workOrderStats.allCompleted;

        if (!shouldShow) return null;

        return (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">
                      Work Order Selesai
                    </h3>
                    <p className="text-sm text-green-700">
                      Semua work order telah selesai diproses. Anda dapat
                      melanjutkan perbaikan sekarang.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      await api.patch(`tickets/${ticket.id}/status`, {
                        status: "in_progress",
                      });

                      toast.success("Perbaikan dilanjutkan");
                      onUpdate();
                    } catch (error) {
                      console.error("Failed to continue repair:", error);
                      toast.error("Gagal melanjutkan perbaikan");
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Lanjutkan Perbaikan
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Alert: On Hold (menunggu work order) */}
      {ticket.status === "on_hold" && !workOrderStats.allCompleted && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-900">
                    Menunggu Work Order
                  </h3>
                  <p className="text-sm text-amber-700">
                    {workOrderStats.total === 0
                      ? "Menunggu pembuatan work order oleh teknisi."
                      : workOrderStats.pending > 0
                      ? `Menunggu ${workOrderStats.pending} work order selesai. Admin Penyedia sedang memproses.`
                      : "Perbaikan menunggu proses pengadaan. Admin Penyedia sedang memproses."}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowWorkOrderForm(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Package className="h-4 w-4 mr-2" />
                Tambah Work Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert: Assigned - Show Accept/Reject */}
      {ticket.status === "assigned" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Tiket Baru Ditugaskan
                  </h3>
                  <p className="text-sm text-blue-700">
                    Tiket ini telah ditugaskan kepada Anda. Silakan terima atau
                    tolak tiket ini.
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

      {/* ============== DIALOGS ============== */}

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terima Tiket Perbaikan</DialogTitle>
            <DialogDescription>
              Konfirmasi bahwa Anda menerima tugas perbaikan ini dan berikan
              estimasi jadwal penyelesaian
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedSchedule">
                Estimasi Jadwal Penyelesaian *
              </Label>
              <Input
                id="estimatedSchedule"
                placeholder="Contoh: 2-3 hari kerja"
                value={estimatedSchedule}
                onChange={(e) => setEstimatedSchedule(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                User akan menerima notifikasi dengan estimasi ini
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
            >
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
              Tiket ini akan dikembalikan ke Admin Layanan untuk di-assign ke
              teknisi lain.
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

      {/* Work Order Form */}
      <WorkOrderForm
        isOpen={showWorkOrderForm}
        onClose={() => setShowWorkOrderForm(false)}
        ticketId={parseInt(ticket.id)}
        ticketStatus={ticket.status}
        workOrderCount={workOrderStats.total}
        onSuccess={() => {
          onUpdate();
        }}
      />
    </div>
  );
};
