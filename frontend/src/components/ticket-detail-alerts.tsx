import React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  AlertCircle,
  UserCheck,
  CheckCircle,
  XCircle,
  Package,
  FileText,
  ClipboardCheck,
  Wrench,
} from "lucide-react";
import type { User, Ticket } from "../types";

interface TicketDetailAlertsProps {
  ticket: Ticket;
  currentUser: User;
  onShowReviewDialog: () => void;
  onShowRejectDialog: () => void;
  onShowAssignDialog: () => void;
  onShowDiagnosaDialog: () => void;
  onShowCompletionDialog: () => void;
  onShowSparepartDialog: () => void;
  getWorkOrdersByTicket: (ticketId: string) => any[];
}

export const TicketDetailAlerts: React.FC<TicketDetailAlertsProps> = ({
  ticket,
  currentUser,
  onShowReviewDialog,
  onShowRejectDialog,
  onShowAssignDialog,
  onShowDiagnosaDialog,
  onShowCompletionDialog,
  onShowSparepartDialog,
  getWorkOrdersByTicket,
}) => {
  return (
    <>
      {/* ============== ALERTS & NOTIFICATIONS FOR ADMIN LAYANAN ============== */}

      {/* Alert: Admin Layanan Review - For submitted tickets */}
      {currentUser.role === "admin_layanan" &&
        ["submitted", "menunggu_review"].includes(ticket.status) && (
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

      {/* Alert: Admin Layanan Assign - For approved repair tickets */}
      {currentUser.role === "admin_layanan" &&
        ticket.type === "perbaikan" &&
        ["approved", "disetujui"].includes(ticket.status) &&
        !ticket.assignedTo && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-green-900">Siap untuk Ditugaskan</h3>
                    <p className="text-sm text-green-700">
                      Tiket sudah disetujui, silakan assign ke teknisi yang
                      tersedia
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onShowAssignDialog}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign ke Teknisi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* ============== ALERTS & NOTIFICATIONS FOR TEKNISI (ALWAYS ON TOP) ============== */}

      {/* Alert: Teknisi Start Diagnosa - For accepted tickets */}
      {/* Alert: Teknisi Fill Diagnosa Form - After accepting ticket */}
      {currentUser.role === "teknisi" &&
        ticket.type === "perbaikan" &&
        ticket.assignedTo == currentUser.id &&
        ["in_progress"].includes(ticket.status) &&
        !ticket.diagnosis && ( // Only show if diagnosis not yet filled
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="text-purple-900">Isi Form Diagnosa</h3>
                    <p className="text-sm text-purple-700">
                      Isi form hasil diagnosa dan tentukan apakah dapat
                      diperbaiki
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onShowDiagnosaDialog}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Isi Form Diagnosa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Alert: Teknisi Complete Repair - During repair phase */}
      {currentUser.role === "teknisi" &&
        ticket.type === "perbaikan" &&
        ticket.assignedTo == currentUser.id &&
        (ticket.status as any) === "dalam_perbaikan" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-green-900">Dalam Perbaikan</h3>
                    <p className="text-sm text-green-700">
                      Selesaikan perbaikan dan isi form penyelesaian
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-green-300"
                    onClick={onShowSparepartDialog}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Request Work Order
                  </Button>
                  <Button
                    onClick={onShowCompletionDialog}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Perbaikan Selesai
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Alert: Teknisi - On Hold removed - now handled by TeknisiWorkflow component */}
    </>
  );
};
