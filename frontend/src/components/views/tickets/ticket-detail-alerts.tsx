import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  Wrench
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User, Ticket } from "@/types";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface TicketDetailAlertsProps {
  ticket: Ticket;
  currentUser: User;
  onShowReviewDialog: () => void;
  onShowRejectDialog: () => void;
  onShowAssignDialog: () => void;
  onShowDiagnosaDialog: () => void;
  onShowSparepartDialog: () => void;
  getWorkOrdersByTicket: (ticketId: string) => any[];
  onUpdate?: () => void;
}

export const TicketDetailAlerts: React.FC<TicketDetailAlertsProps> = ({
  ticket,
  currentUser,
  onShowReviewDialog,
  onShowRejectDialog,
  onShowAssignDialog: _onShowAssignDialog,
  onShowDiagnosaDialog,
  onShowSparepartDialog,
  getWorkOrdersByTicket,
  onUpdate,
}) => {
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeTicketUnderstand, setCloseTicketUnderstand] = useState(false);
  const [isClosingTicket, setIsClosingTicket] = useState(false);
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);
  const [showPegawaiCloseDialog, setShowPegawaiCloseDialog] = useState(false);
  const [pegawaiCloseUnderstand, setPegawaiCloseUnderstand] = useState(false);
  const [isClosingPegawaiTicket, setIsClosingPegawaiTicket] = useState(false);
  return (
    <>
      {/* ============== ALERTS & NOTIFICATIONS FOR ADMIN LAYANAN ============== */}

      {/* Alert: Admin Layanan Review - For submitted tickets */}
      {currentUser.role === "admin_layanan" &&
        ["submitted", "pending_review"].includes(ticket.status) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-blue-900">Tiket Menunggu Review</h3>
                    <p className="text-sm text-blue-700">
                      {ticket.type === "perbaikan"
                        ? "Review tiket perbaikan ini dan setujui atau tolak"
                        : "Review permintaan Zoom Meeting ini dan setujui atau tolak"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-blue-300"
                    onClick={onShowRejectDialog}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                  <Button
                    onClick={onShowReviewDialog}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Alert: Admin Layanan Close Ticket - Only for perbaikan type */}
      {currentUser.role === "admin_layanan" &&
        ticket.type === "perbaikan" &&
        ticket.status !== "closed" && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <h3 className="text-red-900">Tutup Tiket</h3>
                    <p className="text-sm text-red-700">
                      Anda dapat menutup tiket ini kapan saja. Pastikan semua proses sudah selesai.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowCloseDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tutup Tiket
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* ============== ALERTS & NOTIFICATIONS FOR TEKNISI (ALWAYS ON TOP) ============== */}

      {/* Alert: Teknisi - Workflow buttons (Assigned, In Progress, On Hold) */}
      {currentUser.role === "teknisi" &&
        ticket.type === "perbaikan" &&
        String(ticket.assignedTo) === String(currentUser.id) &&
        ["assigned", "in_progress", "on_hold"].includes(ticket.status) && (() => {
          const diagnosis = (ticket as any).diagnosis;
          const hasBeenDiagnosed = !!diagnosis;
          // Use camelCase from backend TicketDiagnosisResource
          const repairType = diagnosis?.repairType;
          
          // Check if repair type needs work order
          const needsWorkOrder = ["need_sparepart", "need_vendor", "need_license"].includes(repairType);
          
          // Check if can be completed (either direct_repair or unrepairable)
          const canBeCompleted = ["direct_repair", "unrepairable"].includes(repairType);
          
          // Check if unrepairable
          const isUnrepairable = repairType === "unrepairable";
          
          // Get work orders for this ticket
          const workOrders = getWorkOrdersByTicket(ticket.id);
          
          // Check if work orders are ready (using the work_orders_ready flag from backend)
          // If work_orders_ready is true, skip work order checks and allow completion
          const workOrdersReady = (ticket as any).workOrdersReady === true;
          const allWorkOrdersDelivered = workOrdersReady || (needsWorkOrder && workOrders.length > 0 && workOrders.every((wo) => 
                ["delivered", "completed", "failed", "cancelled"].includes(wo.status)
              )) || !needsWorkOrder; // If doesn't need work order, always true
          
          // Button enable/disable logic
          const diagnosaEnabled = true; // Always can redo diagnosis
          const workOrderEnabled = hasBeenDiagnosed && needsWorkOrder;

          // Card styling based on unrepairable status
          const cardBgClass = isUnrepairable ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50";
          const titleColorClass = isUnrepairable ? "text-red-900" : "text-blue-900";
          const descColorClass = isUnrepairable ? "text-red-700" : "text-blue-700";
          const iconColorClass = isUnrepairable ? "text-red-600" : "text-blue-600";

          return (
            <Card className={cardBgClass}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Wrench className={`h-8 w-8 ${iconColorClass}`} />
                    <div>
                      <h3 className={titleColorClass}>Workflow Perbaikan</h3>
                      <p className={`text-sm ${descColorClass}`}>
                        {!hasBeenDiagnosed
                          ? "Mulai dengan mengisi form diagnosis"
                          : needsWorkOrder
                          ? "Buat work order untuk pengadaan"
                          : canBeCompleted
                          ? isUnrepairable
                            ? "Barang tidak dapat diperbaiki. Selesaikan tiket untuk konfirmasi."
                            : "Selesaikan perbaikan"
                          : "Pilihan diagnosis tidak valid"}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {hasBeenDiagnosed && (
                    <div className="bg-white rounded p-3 text-sm">
                      <div className="font-medium text-gray-700 mb-1">
                        Status Diagnosis: {repairType === "direct_repair" ? "Bisa diperbaiki langsung" : repairType === "unrepairable" ? "Tidak dapat diperbaiki" : `Membutuhkan ${repairType === "need_sparepart" ? "Sparepart" : repairType === "need_vendor" ? "Vendor" : "Lisensi"}`}
                      </div>
                      {diagnosis?.technicianNotes && (
                        <div className="text-gray-600 text-xs">Catatan: {diagnosis.technicianNotes}</div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={onShowDiagnosaDialog}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                      disabled={!diagnosaEnabled}
                      title={!diagnosaEnabled ? "Isi diagnosis terlebih dahulu" : ""}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      {hasBeenDiagnosed ? "Ubah Diagnosis" : "Isi Diagnosis"}
                    </Button>

                    {needsWorkOrder && (
                      <Button
                        onClick={onShowSparepartDialog}
                        variant="outline"
                        className="border-blue-300 flex-1"
                        disabled={!workOrderEnabled}
                        title={!workOrderEnabled ? "Diagnosis harus memilih sparepart/vendor/lisensi" : ""}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Work Orders
                      </Button>
                    )}

                    {hasBeenDiagnosed && (
                      <Button
                        onClick={async () => {
                          try {
                            setIsLoadingComplete(true);
                            await api.patch(`tickets/${ticket.id}/status`, {
                              status: "waiting_for_submitter",
                            });
                            toast.success("Perbaikan selesai, menunggu konfirmasi");
                            onUpdate?.();
                          } catch (error) {
                            console.error("Failed to complete repair:", error);
                            toast.error("Gagal menyelesaikan perbaikan");
                          } finally {
                            setIsLoadingComplete(false);
                          }
                        }}
                        className={`flex-1 ${isUnrepairable ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white`}
                        disabled={!hasBeenDiagnosed || (needsWorkOrder && !allWorkOrdersDelivered) || isLoadingComplete}
                        title={
                          !hasBeenDiagnosed 
                            ? "Isi diagnosis terlebih dahulu"
                            : needsWorkOrder && !allWorkOrdersDelivered
                            ? "Semua work order harus diselesaikan terlebih dahulu"
                            : ""
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Selesaikan
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

      {/* Alert: Pegawai - Unrepairable notification */}
      {currentUser.role === "pegawai" &&
        ticket.type === "perbaikan" &&
        ticket.status === "waiting_for_submitter" && (() => {
          const diagnosis = (ticket as any).diagnosis;
          const isUnrepairable = diagnosis?.repairType === "unrepairable";
          
          if (!isUnrepairable) return null;
          
          return (
            <Card className="border-red-200 bg-red-50 mb-4">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900">Barang Tidak Dapat Diperbaiki</h3>
                      <p className="text-sm text-red-700 mt-1">
                        Teknisi telah menetapkan bahwa barang ini tidak dapat diperbaiki.
                      </p>
                      {diagnosis?.unrepairableReason && (
                        <div className="mt-3 p-3 bg-white rounded border border-red-200">
                          <p className="text-sm text-red-800">
                            <span className="font-medium">Alasan:</span> {diagnosis.unrepairableReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

      {/* Alert: Pegawai - Waiting for Submitter confirmation (perbaikan only) */}
      {currentUser.role === "pegawai" &&
        ticket.type === "perbaikan" &&
        ticket.status === "waiting_for_submitter" && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-900">
                      Perbaikan Selesai - Menunggu Konfirmasi
                    </h3>
                    <p className="text-sm text-orange-700">
                      Teknisi telah menyelesaikan perbaikan. Silakan verifikasi dan tutup tiket jika sudah sesuai.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowPegawaiCloseDialog(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tutup Tiket
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Alert: Pegawai - Closed tiket yang unrepairable */}
      {currentUser.role === "pegawai" &&
        ticket.type === "perbaikan" &&
        ticket.status === "closed" && (() => {
          const diagnosis = (ticket as any).diagnosis;
          const wasUnrepairable = diagnosis?.repairType === "unrepairable";
          
          if (!wasUnrepairable) return null;
          
          return (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-8 w-8 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Tiket Ditutup - Barang Tidak Dapat Diperbaiki</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Tiket ini telah ditutup karena barang telah ditetapkan tidak dapat diperbaiki.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

      {/* Alert: Teknisi - On Hold removed - now handled by TeknisiWorkflow component */}

      {/* Dialog: Admin Layanan Close Ticket Confirmation */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tutup Tiket</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menutup tiket <strong>#{ticket.ticketNumber}</strong>. 
              Pastikan semua proses sudah selesai dan tidak ada lagi yang perlu dilakukan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="text-sm font-medium text-gray-900">
                Informasi Tiket:
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Judul: <span className="font-medium">{ticket.title}</span></div>
                <div>Status saat ini: <span className="font-medium">{ticket.status}</span></div>
                <div>Tipe: <span className="font-medium">{ticket.type === "perbaikan" ? "Perbaikan" : "Zoom Meeting"}</span></div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Checkbox
                id="understand"
                checked={closeTicketUnderstand}
                onCheckedChange={(checked) => setCloseTicketUnderstand(checked as boolean)}
              />
              <Label 
                htmlFor="understand"
                className="text-sm font-medium text-yellow-900 cursor-pointer flex-1"
              >
                Saya telah memahami dan siap menutup tiket ini
              </Label>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!closeTicketUnderstand) {
                  toast.error("Silakan centang checkbox pemahaman terlebih dahulu");
                  return;
                }
                setShowCloseDialog(false);
                setShowCloseConfirmDialog(true);
              }}
              disabled={!closeTicketUnderstand}
              className="bg-red-600 hover:bg-red-700"
            >
              Lanjutkan
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Admin Layanan Close Ticket - Second Confirmation */}
      <AlertDialog open={showCloseConfirmDialog} onOpenChange={setShowCloseConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Konfirmasi Penutupan Tiket
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menutup tiket <strong>#{ticket.ticketNumber}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-900 font-medium">
                ⚠️ Tiket akan ditutup secara permanen
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  setIsClosingTicket(true);
                  await api.patch(`tickets/${ticket.id}/status`, {
                    status: "closed",
                  });
                  toast.success("Tiket berhasil ditutup");
                  setShowCloseConfirmDialog(false);
                  setCloseTicketUnderstand(false);
                  onUpdate?.();
                } catch (error: any) {
                  console.error("Failed to close ticket:", error);
                  toast.error(error.response?.data?.message || "Gagal menutup tiket");
                } finally {
                  setIsClosingTicket(false);
                }
              }}
              disabled={isClosingTicket}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClosingTicket ? "Memproses..." : "Ya, Tutup Tiket"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Pegawai Close Ticket Confirmation */}
      <AlertDialog open={showPegawaiCloseDialog} onOpenChange={setShowPegawaiCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tutup Tiket</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menutup tiket <strong>#{ticket.ticketNumber}</strong>. 
              Pastikan barang sudah diterima dan sesuai dengan kondisi yang diharapkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="text-sm font-medium text-gray-900">
                Informasi Tiket:
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Judul: <span className="font-medium">{ticket.title}</span></div>
                <div>Status: <span className="font-medium">status: {ticket.status}</span></div>
                <div>Tipe: <span className="font-medium">{ticket.type === "perbaikan" ? "Perbaikan" : "Zoom Meeting"}</span></div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Checkbox
                id="pegawai-understand"
                checked={pegawaiCloseUnderstand}
                onCheckedChange={(checked) => setPegawaiCloseUnderstand(checked as boolean)}
              />
              <Label 
                htmlFor="pegawai-understand"
                className="text-sm font-medium text-orange-900 cursor-pointer flex-1"
              >
                Saya telah memahami dan siap menutup tiket ini
              </Label>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pegawaiCloseUnderstand) {
                  toast.error("Silakan centang checkbox pemahaman terlebih dahulu");
                  return;
                }

                try {
                  setIsClosingPegawaiTicket(true);
                  await api.patch(`tickets/${ticket.id}/status`, {
                    status: "closed",
                  });
                  toast.success("Tiket berhasil ditutup");
                  setShowPegawaiCloseDialog(false);
                  setPegawaiCloseUnderstand(false);
                  onUpdate?.();
                } catch (error: any) {
                  console.error("Failed to close ticket:", error);
                  toast.error(error.response?.data?.message || "Gagal menutup tiket");
                } finally {
                  setIsClosingPegawaiTicket(false);
                }
              }}
              disabled={!pegawaiCloseUnderstand || isClosingPegawaiTicket}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isClosingPegawaiTicket ? "Memproses..." : "Tutup Tiket"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
