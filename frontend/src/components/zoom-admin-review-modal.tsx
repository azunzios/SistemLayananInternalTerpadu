import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Link as LinkIcon,
  Key,
  Lock,
  ExternalLink,
  Send,
  Ban,
  Info,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { getTickets, saveTickets, createNotification, getCurrentUser } from '../lib/storage';
import type { Ticket } from '../types';

interface ZoomAdminReviewModalProps {
  booking: Ticket;
  onClose: () => void;
  onUpdate: () => void;
}

export const ZoomAdminReviewModal: React.FC<ZoomAdminReviewModalProps> = ({
  booking,
  onClose,
  onUpdate,
}) => {
  const currentUser = getCurrentUser();
  const [selectedAccount, setSelectedAccount] = useState<string>(booking.data?.zoomAccount || '');
  const [hostkey, setHostkey] = useState<string>(booking.data?.hostkey || '');
  const [meetingLink, setMeetingLink] = useState<string>(booking.data?.meetingLink || '');
  const [passcode, setPasscode] = useState<string>(booking.data?.passcode || '');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string>('');

  // Load zoom accounts
  const [zoomAccounts, setZoomAccounts] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('bps_ntb_zoom_accounts');
    if (stored) {
      const accounts = JSON.parse(stored);
      setZoomAccounts(accounts);
    }
  }, []);

  // Check for conflicts when account is selected
  useEffect(() => {
    if (!selectedAccount) {
      setConflictWarning('');
      return;
    }

    const allTickets = getTickets();
    const dateStr = booking.data?.meetingDate;
    const startTime = booking.data?.startTime;
    const endTime = booking.data?.endTime;

    // Find conflicts: same account, same date, overlapping time, approved status
    const conflicts = allTickets.filter(t => {
      if (t.id === booking.id) return false; // Skip current booking
      if (t.type !== 'zoom_meeting') return false;
      if (t.data?.zoomAccount !== selectedAccount) return false;
      if (t.data?.meetingDate !== dateStr) return false;
      if (t.status !== 'approved') return false; // Only check approved bookings

      // Check time overlap
      const tStart = t.data.startTime;
      const tEnd = t.data.endTime;

      // Convert to minutes for easier comparison
      const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };

      const bookingStart = toMinutes(startTime);
      const bookingEnd = toMinutes(endTime);
      const tStartMin = toMinutes(tStart);
      const tEndMin = toMinutes(tEnd);

      // Check overlap: (StartA < EndB) and (EndA > StartB)
      return (bookingStart < tEndMin) && (bookingEnd > tStartMin);
    });

    if (conflicts.length > 0) {
      setConflictWarning(
        `⚠️ Akun ini sudah terpakai pada jam ${conflicts[0].data.startTime} - ${conflicts[0].data.endTime} oleh ${conflicts[0].userName}`
      );
    } else {
      setConflictWarning('');
    }
  }, [selectedAccount, booking]);

  // Validate hostkey (must be 6 digits)
  const isHostkeyValid = () => {
    return /^\d{6}$/.test(hostkey);
  };

  // Handle Approve
  const handleApprove = async () => {
    // Validation
    if (!selectedAccount) {
      toast.error('Pilih akun Zoom terlebih dahulu');
      return;
    }

    if (!isHostkeyValid()) {
      toast.error('Hostkey harus 6 digit angka');
      return;
    }

    if (!meetingLink || !passcode) {
      toast.error('Link Meeting dan Passcode harus diisi');
      return;
    }

    if (conflictWarning) {
      toast.error('Tidak dapat approve: terdapat conflict dengan booking lain');
      return;
    }

    setIsProcessing(true);

    try {
      const allTickets = getTickets();
      const ticketIndex = allTickets.findIndex(t => t.id === booking.id);

      if (ticketIndex === -1) {
        toast.error('Ticket tidak ditemukan');
        return;
      }

      // Update ticket
      const updatedTicket = {
        ...allTickets[ticketIndex],
        status: 'approved',
        data: {
          ...allTickets[ticketIndex].data,
          zoomAccount: selectedAccount,
          hostkey: hostkey,
          meetingLink: meetingLink,
          passcode: passcode,
        },
        timeline: [
          ...allTickets[ticketIndex].timeline,
          {
            timestamp: new Date().toISOString(),
            action: 'approved',
            actor: currentUser?.name || 'Admin',
            description: `Booking disetujui dan diberikan akun ${selectedAccount}`,
          },
        ],
      };

      allTickets[ticketIndex] = updatedTicket;
      saveTickets(allTickets);

      // Create notification for user
      const accountName = zoomAccounts.find(a => a.id === selectedAccount)?.name || selectedAccount;
      createNotification({
        userId: booking.userId,
        type: 'info',
        title: 'Booking Zoom Disetujui',
        message: `Booking Zoom Anda "${booking.title}" telah disetujui dengan ${accountName}. Link: ${meetingLink}, Passcode: ${passcode}, Hostkey: ${hostkey}`,
        metadata: {
          ticketId: booking.id,
          ticketNumber: booking.ticketNumber,
        },
      });

      toast.success('Booking berhasil disetujui dan notifikasi dikirim ke user');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Gagal menyetujui booking');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    setIsProcessing(true);

    try {
      const allTickets = getTickets();
      const ticketIndex = allTickets.findIndex(t => t.id === booking.id);

      if (ticketIndex === -1) {
        toast.error('Ticket tidak ditemukan');
        return;
      }

      // Update ticket
      const updatedTicket = {
        ...allTickets[ticketIndex],
        status: 'ditolak',
        data: {
          ...allTickets[ticketIndex].data,
          rejectionReason: rejectionReason,
        },
        timeline: [
          ...allTickets[ticketIndex].timeline,
          {
            timestamp: new Date().toISOString(),
            action: 'ditolak',
            actor: currentUser?.name || 'Admin',
            description: `Booking ditolak: ${rejectionReason}`,
          },
        ],
      };

      allTickets[ticketIndex] = updatedTicket;
      saveTickets(allTickets);

      // Create notification for user
      createNotification({
        userId: booking.userId,
        type: 'error',
        title: 'Booking Zoom Ditolak',
        message: `Booking Zoom Anda "${booking.title}" ditolak. Alasan: ${rejectionReason}`,
        metadata: {
          ticketId: booking.id,
          ticketNumber: booking.ticketNumber,
        },
      });

      toast.success('Booking ditolak dan notifikasi dikirim ke user');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Gagal menolak booking');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          label: 'Disetujui',
          icon: CheckCircle,
        };
      case 'menunggu_review':
      case 'pending_approval':
        return {
          bg: 'bg-yellow-400',
          text: 'text-gray-900',
          label: 'Pending Review',
          icon: Clock,
        };
      case 'ditolak':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          label: 'Ditolak',
          icon: XCircle,
        };
      default:
        return {
          bg: 'bg-gray-400',
          text: 'text-white',
          label: status,
          icon: AlertCircle,
        };
    }
  };

  const statusStyle = getStatusStyle(booking.status);
  const StatusIcon = statusStyle.icon;
  const isPending = booking.status === 'menunggu_review' || booking.status === 'pending_approval';
  const isApproved = booking.status === 'approved';
  const isRejected = booking.status === 'ditolak';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold">Admin Review Panel</h3>
              <p className="text-sm text-gray-500 mt-1">
                Tinjau dan proses permintaan booking Zoom
              </p>
            </div>
            <Badge variant={
              isApproved ? 'default' : isRejected ? 'destructive' : 'secondary'
            } className="gap-1.5">
              <StatusIcon className="h-3 w-3" />
              {statusStyle.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Booking Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Informasi Booking
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-blue-700">Judul</p>
                <p className="font-semibold text-blue-900">{booking.title}</p>
              </div>
              
              <div>
                <p className="text-blue-700">Pemohon</p>
                <p className="font-semibold text-blue-900">{booking.userName}</p>
              </div>
              
              <div>
                <p className="text-blue-700">Tanggal</p>
                <p className="font-semibold text-blue-900">
                  {new Date(booking.data.meetingDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-blue-700">Waktu</p>
                <p className="font-semibold text-blue-900">
                  {booking.data.startTime} - {booking.data.endTime}
                </p>
              </div>
            </div>

            {booking.description && (
              <div>
                <p className="text-blue-700 text-sm">Deskripsi</p>
                <p className="text-sm text-blue-900">{booking.description}</p>
              </div>
            )}
          </div>

          {/* Portal Zoom Helper */}
          {isPending && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-purple-900 mb-1">Buat Jadwal di Portal Zoom</h5>
                  <p className="text-sm text-purple-700 mb-3">
                    Sebelum approve, buat jadwal meeting di Portal Zoom terlebih dahulu
                  </p>
                  <a
                    href="https://zoom.us/meeting/schedule"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Buka Portal Zoom
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Form */}
          {isPending && (
            <>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Assign Akun Zoom</h4>
                
                {/* Account Selection */}
                <div className="space-y-2">
                  <Label htmlFor="account">Pilih Akun Zoom *</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger id="account">
                      <SelectValue placeholder="Pilih akun zoom..." />
                    </SelectTrigger>
                    <SelectContent>
                      {zoomAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${account.color}-500`} />
                            {account.name}
                            {!account.isActive && (
                              <Badge variant="secondary" className="text-xs ml-1">Nonaktif</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Conflict Warning */}
                  {conflictWarning && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{conflictWarning}</span>
                    </div>
                  )}
                  
                  {selectedAccount && !conflictWarning && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Akun tersedia untuk waktu yang dipilih</span>
                    </div>
                  )}
                </div>

                {/* Hostkey Input */}
                <div className="space-y-2">
                  <Label htmlFor="hostkey">Hostkey (6 Digit) *</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="hostkey"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={hostkey}
                      onChange={(e) => setHostkey(e.target.value.replace(/\D/g, ''))}
                      className="pl-10"
                    />
                  </div>
                  {hostkey && !isHostkeyValid() && (
                    <p className="text-xs text-red-600">Hostkey harus 6 digit angka</p>
                  )}
                </div>

                {/* Meeting Link Input */}
                <div className="space-y-2">
                  <Label htmlFor="link">Link Meeting Zoom *</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="link"
                      type="url"
                      placeholder="https://zoom.us/j/..."
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Passcode Input */}
                <div className="space-y-2">
                  <Label htmlFor="passcode">Passcode *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="passcode"
                      type="text"
                      placeholder="Masukkan passcode..."
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Claim Host Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1">💡 Instruksi Claim Host untuk User:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Join meeting menggunakan link di atas</li>
                    <li>Klik "Claim Host" di bagian bawah layar Zoom</li>
                    <li>Masukkan Hostkey: <strong>{hostkey || '______'}</strong></li>
                    <li>Anda akan menjadi Host meeting</li>
                  </ol>
                </div>
              </div>

              {/* Action Buttons - Approve */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleApprove}
                  disabled={
                    isProcessing ||
                    !selectedAccount ||
                    !isHostkeyValid() ||
                    !meetingLink ||
                    !passcode ||
                    !!conflictWarning
                  }
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4" />
                  {isProcessing ? 'Memproses...' : 'Approve & Kirim ke User'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-6"
                >
                  Batal
                </Button>
              </div>

              {/* Rejection Form */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-semibold text-gray-900 text-red-600">Atau Tolak Booking</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Alasan Penolakan *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Jelaskan alasan penolakan booking ini..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  <Ban className="h-4 w-4" />
                  {isProcessing ? 'Memproses...' : 'Tolak Booking'}
                </Button>
              </div>
            </>
          )}

          {/* Approved/Rejected Info */}
          {(isApproved || isRejected) && (
            <div className={`border-2 rounded-lg p-4 ${
              isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <h4 className={`font-semibold mb-3 ${
                isApproved ? 'text-green-900' : 'text-red-900'
              }`}>
                {isApproved ? 'Detail Persetujuan' : 'Detail Penolakan'}
              </h4>
              
              {isApproved && (
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-green-700">Akun Zoom</p>
                    <p className="font-semibold text-green-900">
                      {zoomAccounts.find(a => a.id === booking.data?.zoomAccount)?.name || booking.data?.zoomAccount}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700">Link Meeting</p>
                    <a 
                      href={booking.data?.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {booking.data?.meetingLink}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div>
                    <p className="text-green-700">Passcode</p>
                    <p className="font-semibold text-green-900">{booking.data?.passcode}</p>
                  </div>
                  <div>
                    <p className="text-green-700">Hostkey</p>
                    <p className="font-semibold text-green-900">{booking.data?.hostkey}</p>
                  </div>
                </div>
              )}

              {isRejected && (
                <div className="text-sm">
                  <p className="text-red-700">Alasan Penolakan</p>
                  <p className="text-red-900">{booking.data?.rejectionReason || 'Tidak ada alasan'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Tutup
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
