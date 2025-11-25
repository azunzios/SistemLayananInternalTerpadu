import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { ZoomAccountDisplay } from '@/components/views/zoom/zoom-booking-types';
import type { User } from '@/types';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any | null;
  isManagement: boolean;
  renderStatusBadge: (status: string) => React.ReactNode;
  zoomAccountDisplay: ZoomAccountDisplay;
  onRequestApprove: () => void;
  onRequestReject: () => void;
  onClose: () => void;
  onNavigateToTicket?: (ticketId: string) => void;
  currentUser?: User;
}

export const DetailDialog: React.FC<DetailDialogProps> = ({
  open,
  onOpenChange,
  booking,
  isManagement,
  renderStatusBadge,
  onRequestApprove,
  onRequestReject,
  onClose,
  onNavigateToTicket,
  currentUser,
}) => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{
    meetingLink?: string;
    meetingId?: string;
    passcode?: string;
    zoomAccount?: any;
  } | null>(null);

  // Tombol 'buka di tab tiket' hanya untuk pembuat tiket (user yang membuka booking ini)
  const canViewTicketButton = () => {
    if (!currentUser || !booking) {
      console.log("canViewTicketButton: missing currentUser or booking", {
        currentUser,
        booking,
      });
      return false;
    }
    const result = booking.userId === currentUser.id;
    console.log("canViewTicketButton:", {
      bookingUserId: booking.userId,
      currentUserId: currentUser.id,
      result,
    });
    return result;
  };

  // Fetch meeting credentials when dialog opens and booking changes
  useEffect(() => {
    if (open && booking && booking.id) {
      fetchMeetingCredentials();
    }
  }, [open, booking?.id]);

  const fetchMeetingCredentials = async () => {
    if (!booking?.id) return;

    setLoading(true);
    try {
      const response = await api.get<any>(`/tickets/${booking.id}`);

      if (response && response.data) {
        const ticketData = response.data;

        // Extract zoom credentials dari response
        setCredentials({
          meetingLink: ticketData.zoom_meeting_link || ticketData.meetingLink,
          meetingId: ticketData.zoom_meeting_id || ticketData.meetingId,
          passcode: ticketData.zoom_passcode || ticketData.passcode,
          zoomAccount: ticketData.zoomAccount,
        });
      } else if (response && response.meetingLink) {
        // Fallback jika response langsung berisi data
        setCredentials({
          meetingLink: response.meetingLink,
          meetingId: response.meetingId,
          passcode: response.passcode,
          zoomAccount: response.zoomAccount,
        });
      }
    } catch (err) {
      console.error("Failed to fetch meeting credentials:", err);
      // Jangan toast error jika bukan pemilik (expected behavior)
      if (currentUser && booking && booking.userId === currentUser.id) {
        toast.error("Gagal memuat kredensial meeting");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToTicket = () => {
    if (booking?.id && onNavigateToTicket) {
      onNavigateToTicket(booking.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex-col items-start justify-between">
            <DialogTitle>{booking?.title}</DialogTitle>
            <DialogDescription>
              Nomor Tiket: {booking?.ticketNumber}
            </DialogDescription>
            {renderStatusBadge(booking?.status)}
          </div>
        </DialogHeader>

        {booking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tanggal</p>
                <p className="font-medium">
                  {booking.date &&
                    new Date(booking.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Waktu</p>
                <p className="font-medium">
                  {booking.startTime} - {booking.endTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Jumlah Peserta</p>
                <p className="font-medium">
                  {booking.estimatedParticipants} orang
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Breakout Room</p>
                <p className="font-medium">{booking.breakoutRooms || 0} room</p>
              </div>
              {isManagement && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Pemohon</p>
                    <p className="font-medium">{booking.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unit Kerja</p>
                    <p className="font-medium">{booking.unitKerja}</p>
                  </div>
                </>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">
                Deskripsi Peminjaman Zoom
              </p>
              <p className="text-sm">{booking.description}</p>
            </div>

            {/* Co-Hosts Section */}
            {Array.isArray(booking.coHosts) && booking.coHosts.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3">Co-Host</p>
                <div className="space-y-2">
                  {booking.coHosts.map((coHost: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{coHost.name}</p>
                        <p className="text-xs text-gray-500">{coHost.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Credentials Section - Show when approved or loading */}
            {(booking.status === "approved" || loading) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Meeting Credentials
                </h4>

                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : credentials &&
                  (credentials.meetingLink ||
                    credentials.meetingId ||
                    credentials.passcode) ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {credentials.zoomAccount && (
                      <>
                        <div>
                          <p className="text-green-700 text-xs mb-1">
                            Akun Zoom:
                          </p>
                          <p className="font-mono font-semibold">
                            {credentials.zoomAccount.name || "N/A"}
                          </p>
                          <p className="text-gray-600 text-xs">
                            {credentials.zoomAccount.email}
                          </p>
                        </div>

                        {credentials.zoomAccount.hostKey && (
                          <div>
                            <p className="text-green-700 text-xs mb-1">
                              Host Key:
                            </p>
                            <p className="font-mono font-semibold">
                              {credentials.zoomAccount.hostKey}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {credentials.meetingId && (
                      <div>
                        <p className="text-green-700 text-xs mb-1">
                          Meeting ID:
                        </p>
                        <p className="font-mono font-semibold">
                          {credentials.meetingId}
                        </p>
                      </div>
                    )}

                    {credentials.passcode && (
                      <div>
                        <p className="text-green-700 text-xs mb-1">Passcode:</p>
                        <p className="font-mono font-semibold">
                          {credentials.passcode}
                        </p>
                      </div>
                    )}

                    {credentials.meetingLink && (
                      <div className="col-span-2">
                        <p className="text-green-700 text-xs mb-1">
                          Link Meeting:
                        </p>
                        <a
                          href={credentials.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-mono break-all text-xs"
                        >
                          {credentials.meetingLink}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                    <p className="font-semibold mb-1">Informasi Terbatas</p>
                    <p className="text-xs">
                      {currentUser &&
                      booking &&
                      booking.userId !== currentUser.id
                        ? "Anda hanya dapat melihat detail lengkap untuk booking Zoom milik Anda sendiri. Booking ini dibuat oleh pengguna lain."
                        : "Kredensial meeting belum tersedia."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Rejection Reason - Show when rejected */}
            {booking.status === "rejected" && booking.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Alasan Penolakan
                </h4>
                <p className="text-sm text-red-800">
                  {booking.rejectionReason}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            {/* tombol buka tiket - selalu tampil ketika ada onNavigateToTicket */}
            {onNavigateToTicket && booking?.id && (
              <Button
                variant="outline"
                onClick={handleNavigateToTicket}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Buka di Tab Tiket
              </Button>
            )}

            {/* action buttons */}
            <div className="flex gap-2 ml-auto">
              {isManagement &&
              booking?.status !== "approved" &&
              booking?.status !== "rejected" ? (
                <>
                  <Button variant="outline" onClick={onRequestReject}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                  <Button onClick={onRequestApprove} disabled={loading}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={onClose}>
                  Tutup
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
