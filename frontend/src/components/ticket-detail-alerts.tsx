import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
  AlertCircle,
  UserCheck,
  Activity,
  Wrench,
  CheckCircle,
  XCircle,
  Package,
  Clock,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import type { User, Ticket } from '../types';

interface TicketDetailAlertsProps {
  ticket: Ticket;
  currentUser: User;
  onShowReviewDialog: () => void;
  onShowRejectDialog: () => void;
  onShowAssignDialog: () => void;
  onShowTeknisiAcceptDialog: () => void;
  onShowTeknisiRejectDialog: () => void;
  onShowTeknisiStartDiagnosa: () => void;
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
  onShowTeknisiAcceptDialog,
  onShowTeknisiRejectDialog,
  onShowTeknisiStartDiagnosa,
  onShowDiagnosaDialog,
  onShowCompletionDialog,
  onShowSparepartDialog,
  getWorkOrdersByTicket,
}) => {
  return (
    <>
      {/* ============== ALERTS & NOTIFICATIONS FOR ADMIN LAYANAN ============== */}

      {/* Alert: Admin Layanan Review - For submitted tickets */}
      {currentUser.role === 'admin_layanan' &&
        ['submitted', 'menunggu_review'].includes(ticket.status) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-blue-900">Tiket Menunggu Review</h3>
                    <p className="text-sm text-blue-700">
                      {ticket.type === 'perbaikan'
                        ? 'Review tiket perbaikan ini dan setujui atau tolak'
                        : 'Review permintaan Zoom Meeting ini dan setujui atau tolak'}
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
      {currentUser.role === 'admin_layanan' &&
        ticket.type === 'perbaikan' &&
        ticket.status === 'disetujui' &&
        !ticket.assignedTo && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-green-900">Siap untuk Ditugaskan</h3>
                    <p className="text-sm text-green-700">Tiket sudah disetujui, silakan assign ke teknisi yang tersedia</p>
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

      {/* Alert: Teknisi Accept/Reject - For newly assigned tickets */}
      {currentUser.role === 'teknisi' &&
        ticket.type === 'perbaikan' &&
        ticket.assignedTo === currentUser.id &&
        ['ditugaskan', 'assigned'].includes(ticket.status) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                  <div>
                    <h3 className="text-orange-900">Tiket Baru Ditugaskan</h3>
                    <p className="text-sm text-orange-700">Terima atau tolak tugas perbaikan ini</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-orange-300"
                    onClick={onShowTeknisiRejectDialog}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                  <Button
                    onClick={onShowTeknisiAcceptDialog}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Terima Tiket
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Alert: Teknisi Start Diagnosa - For accepted tickets */}
      {currentUser.role === 'teknisi' &&
        ticket.type === 'perbaikan' &&
        ticket.assignedTo === currentUser.id &&
        ['diterima_teknisi', 'in_progress'].includes(ticket.status) &&
        ticket.status !== 'sedang_diagnosa' &&
        ticket.status !== 'dalam_perbaikan' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-blue-900">Tiket Diterima</h3>
                    <p className="text-sm text-blue-700">Mulai diagnosa barang untuk menentukan langkah perbaikan</p>
                  </div>
                </div>
                <Button onClick={onShowTeknisiStartDiagnosa} className="bg-blue-600 hover:bg-blue-700">
                  <Wrench className="h-4 w-4 mr-2" />
                  Mulai Diagnosa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Alert: Teknisi Fill Diagnosa Form - During diagnosa phase */}
      {currentUser.role === 'teknisi' &&
        ticket.type === 'perbaikan' &&
        ticket.assignedTo === currentUser.id &&
        ticket.status === 'sedang_diagnosa' && (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="text-purple-900">Sedang Diagnosa</h3>
                    <p className="text-sm text-purple-700">Isi form hasil diagnosa dan tentukan apakah dapat diperbaiki</p>
                  </div>
                </div>
                <Button onClick={onShowDiagnosaDialog} className="bg-purple-600 hover:bg-purple-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Isi Form Diagnosa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Alert: Teknisi Complete Repair - During repair phase */}
      {currentUser.role === 'teknisi' &&
        ticket.type === 'perbaikan' &&
        ticket.assignedTo === currentUser.id &&
        ticket.status === 'dalam_perbaikan' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-green-900">Dalam Perbaikan</h3>
                    <p className="text-sm text-green-700">Selesaikan perbaikan dan isi form penyelesaian</p>
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
                  <Button onClick={onShowCompletionDialog} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Perbaikan Selesai
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Alert: Teknisi - On Hold (Menunggu Work Order) */}
      {currentUser.role === 'teknisi' &&
        ticket.type === 'perbaikan' &&
        ticket.assignedTo === currentUser.id &&
        ticket.status === 'on_hold' && (() => {
          const workOrders = getWorkOrdersByTicket(ticket.id);
          const pendingWO = workOrders.filter(wo => ['requested', 'in_procurement'].includes(wo.status));

          return (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div>
                      <h3 className="text-yellow-900">Menunggu Work Order</h3>
                      <p className="text-sm text-yellow-700">
                        {pendingWO.length} work order sedang diproses
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-yellow-300"
                    onClick={onShowSparepartDialog}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Tambah Work Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}
    </>
  );
};
