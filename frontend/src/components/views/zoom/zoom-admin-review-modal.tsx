// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/storage";
import type { Ticket, ZoomTicket } from "@/types";

interface ZoomAccount {
  id: number;
  account_id: string;
  name: string;
  host_key: string;
  email: string;
  is_active: boolean;
  color?: string;
}

interface CoHost {
  name: string;
  email: string;
}

interface ZoomAdminReviewModalProps {
  booking: ZoomTicket;
  onClose: () => void;
  onUpdate: () => void;
}

const normalizeCoHosts = (value: unknown): CoHost[] => {
  if (!value) return [];
  const material = (() => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // free-form strings fall through
      }
      return trimmed
        .split(/[\r\n;,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    if (typeof value === "object" && value !== null) {
      const record = value as Record<string, unknown>;
      if (Array.isArray(record.data)) return record.data;
      if (Array.isArray(record.coHosts)) return record.coHosts;
      if (Array.isArray(record.co_hosts)) return record.co_hosts;
    }
    return [];
  })();

  return material
    .map((item, index) => {
      if (!item) return null;
      if (typeof item === "string") {
        const entry = item.trim();
        if (!entry) return null;
        const emailMatch = entry.match(/<([^>]+)>/);
        const email = emailMatch?.[1] || (entry.includes("@") ? entry : "");
        const name = email
          ? entry
              .replace(emailMatch ? `<${email}>` : email, "")
              .trim()
              .replace(/[\s,-]+$/, "")
          : entry;
        return {
          name: name || `Co-Host ${index + 1}`,
          email: email || "",
        };
      }
      const record = item as Record<string, unknown>;
      return {
        name:
          (record.name as string) ||
          (record.fullName as string) ||
          (record.full_name as string) ||
          (record.username as string) ||
          (record.email as string) ||
          `Co-Host ${index + 1}`,
        email: (record.email as string) || (record.mail as string) || "",
      };
    })
    .filter((host): host is CoHost =>
      Boolean(host && (host.name || host.email))
    );
};

const resolveZoomAccountSelection = (zoomAcc: ZoomAccount): string => {
  const source = zoomAcc;
  return source.id;
};

export const ZoomAdminReviewModal: React.FC<ZoomAdminReviewModalProps> = ({
  booking,
  onClose,
  onUpdate,
}) => {
  const [zoomAccounts, setZoomAccounts] = useState<ZoomAccount[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const suggestedAccountId =
    (booking as any).zoomAccountId || (booking as any).zoom_account_id;
  const [selectedAccount, setSelectedAccount] = useState<string>(() => {
    // Use suggested account if available
    if (suggestedAccountId) return String(suggestedAccountId);
    const resolved = resolveZoomAccountSelection(booking as any);
    return resolved || "";
  });
  const [hostkey, setHostkey] = useState<string>("");
  const [meetingLink, setMeetingLink] = useState<string>(
    booking.meetingLink || ""
  );
  const [passcode, setPasscode] = useState<string>(booking.passcode || "");
  const [coHosts, setCoHosts] = useState<CoHost[]>(() =>
    normalizeCoHosts(
      (booking as any).coHosts ??
        (booking as any).co_hosts ??
        (booking as any).zoom_co_hosts
    )
  );
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // When component mounts or booking changes, populate data from booking props
  useEffect(() => {
    setMeetingLink(booking.meetingLink || "");
    setPasscode(booking.passcode || "");
    setSelectedAccount(resolveZoomAccountSelection(booking));
    setCoHosts(
      normalizeCoHosts(
        (booking as any).coHosts ??
          (booking as any).co_hosts ??
          (booking as any).zoom_co_hosts
      )
    );
    setRejectionReason("");
  }, [booking]); // Refresh on any booking prop change

  // Load zoom accounts only when status is pending
  useEffect(() => {
    const isPending =
      booking.status === "pending_review" ||
      booking.status === "menunggu_review";

    if (!isPending) {
      return; // Don't load if not pending
    }

    const loadZoomAccounts = async () => {
      try {
        setAccountsError(null);
        const response = await api.get("zoom/accounts");
        if (Array.isArray(response)) {
          setZoomAccounts(response);
        }
      } catch (err: any) {
        const errorMsg =
          err?.body?.message || err?.message || "Gagal memuat data akun Zoom";
        setAccountsError(errorMsg);
      }
    };

    loadZoomAccounts();
  }, [booking.status]); // Only depend on booking status

  // Auto-fetch host key when account is selected
  useEffect(() => {
    if (selectedAccount) {
      const account = zoomAccounts.find(
        (acc) => acc.id.toString() === selectedAccount
      );
      if (account) {
        setHostkey(account.host_key);
      }
    }
  }, [selectedAccount, zoomAccounts]);

  const [conflictWarning, setConflictWarning] = useState<string>("");

  // Check for conflicts when account is selected
  useEffect(() => {
    if (!selectedAccount) {
      setConflictWarning("");
      return;
    }

    const checkConflicts = async () => {
      try {
        const dateStr = booking.date;
        const startTime = booking.startTime;
        const endTime = booking.endTime;

        // Get zoom bookings for the same date from backend
        const response = await api.get(
          `tickets?type=zoom_meeting&meeting_date=${dateStr}`
        );
        const allTickets = Array.isArray(response)
          ? response
          : response?.data || [];

        // Find conflicts: same account, same date, overlapping time, approved status
        const conflicts = allTickets.filter((t: any) => {
          if (t.id === booking.id) return false; // Skip current booking
          if (t.zoom_account_id !== selectedAccount) return false;
          if (t.status !== "approved") return false; // Only check approved bookings

          // Check time overlap
          const tStart = t.startTime;
          const tEnd = t.endTime;

          // Convert to minutes for easier comparison
          const toMinutes = (time: string) => {
            const [h, m] = time.split(":").map(Number);
            return h * 60 + m;
          };

          const bookingStart = toMinutes(startTime);
          const bookingEnd = toMinutes(endTime);
          const tStartMin = toMinutes(tStart);
          const tEndMin = toMinutes(tEnd);

          // Check overlap: (StartA < EndB) and (EndA > StartB)
          return bookingStart < tEndMin && bookingEnd > tStartMin;
        });

        if (conflicts.length > 0) {
          setConflictWarning(
            `⚠️ Akun ini sudah terpakai pada jam ${conflicts[0].startTime} - ${conflicts[0].endTime} oleh ${conflicts[0].userName}`
          );
        } else {
          setConflictWarning("");
        }
      } catch (err) {
        console.error("Failed to check conflicts:", err);
      }
    };

    checkConflicts();
  }, [
    selectedAccount,
    booking.date,
    booking.startTime,
    booking.endTime,
    booking.id,
  ]); // Depend on booking fields directly

  // Validate hostkey (must be 6 digits)
  const isHostkeyValid = () => {
    return /^\d{6}$/.test(hostkey);
  };

  // Extract or generate zoom meeting ID from meeting link
  const extractZoomMeetingId = (link: string): string | null => {
    // Try to match zoom link patterns: https://zoom.us/j/{id} or similar
    const match = link.match(/\/j\/(\d+)/);
    if (match) {
      return match[1];
    }
    // If not found in URL, generate ID from timestamp
    // This allows flexible link formats as long as they're valid URLs
    return Date.now().toString().slice(-9);
  };

  // Handle Approve
  const handleApprove = async () => {
    // Validation
    if (!selectedAccount) {
      toast.error("Pilih akun Zoom terlebih dahulu");
      return;
    }

    if (!isHostkeyValid()) {
      toast.error("Hostkey harus 6 digit angka");
      return;
    }

    if (!meetingLink || !passcode) {
      toast.error("Link Meeting dan Passcode harus diisi");
      return;
    }

    // Validate URL format: must have https:// and a domain
    try {
      const url = new URL(meetingLink);
      if (!url.protocol.startsWith("https")) {
        toast.error("Link Meeting harus menggunakan HTTPS");
        return;
      }
    } catch (err) {
      toast.error(
        "Format link tidak valid. Pastikan berupa URL lengkap (https://...)"
      );
      return;
    }

    const zoomMeetingId = extractZoomMeetingId(meetingLink);
    if (!zoomMeetingId) {
      toast.error("Gagal memproses link Zoom");
      return;
    }

    if (conflictWarning) {
      toast.error("Tidak dapat approve: terdapat conflict dengan booking lain");
      return;
    }

    setIsProcessing(true);

    try {
      // Use approve-zoom endpoint with correct payload matching backend validation
      await api.patch(`tickets/${booking.id}/approve-zoom`, {
        zoom_meeting_link: meetingLink,
        zoom_meeting_id: zoomMeetingId,
        zoom_passcode: passcode,
        zoom_account_id: selectedAccount ? parseInt(selectedAccount, 10) : null,
      });

      toast.success("Booking berhasil disetujui");
      onUpdate();
      onClose();
    } catch (error: any) {
      const errorMsg =
        error?.body?.message || error?.message || "Gagal menyetujui booking";
      toast.error(errorMsg);
      console.error("Error approving booking:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    setIsProcessing(true);
    try {
      // Use reject-zoom endpoint
      await api.patch(`tickets/${booking.id}/reject-zoom`, {
        reason: rejectionReason,
      });

      toast.success("Booking ditolak");
      onUpdate();
      onClose();
    } catch (error: any) {
      const errorMsg = error?.body?.message || "Gagal menolak booking";
      toast.error(errorMsg);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-green-500",
          text: "text-white",
          label: "Disetujui",
          icon: CheckCircle,
        };
      case "menunggu_review":
      case "pending_approval":
        return {
          bg: "bg-yellow-400",
          text: "text-gray-900",
          label: "Pending Review",
          icon: Clock,
        };
      case "ditolak":
        return {
          bg: "bg-red-500",
          text: "text-white",
          label: "Ditolak",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-gray-400",
          text: "text-white",
          label: status,
          icon: AlertCircle,
        };
    }
  };

  const statusStyle = getStatusStyle(booking.status);
  const StatusIcon = statusStyle.icon;
  const isPending =
    booking.status === "pending_review" || booking.status === "menunggu_review";
  const isApproved = booking.status === "approved";
  const isRejected = booking.status === "rejected";

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
            <Badge
              variant={
                isApproved
                  ? "default"
                  : isRejected
                  ? "destructive"
                  : "secondary"
              }
              className="gap-1.5"
            >
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
                <p className="text-blue-700">Nomor Tiket</p>
                <p className="font-semibold text-blue-900 font-mono">
                  {booking.ticketNumber}
                </p>
              </div>

              <div>
                <p className="text-blue-700">Judul</p>
                <p className="font-semibold text-blue-900">{booking.title}</p>
              </div>

              <div>
                <p className="text-blue-700">Pemohon</p>
                <p className="font-semibold text-blue-900">
                  {booking.userName}
                </p>
              </div>

              <div>
                <p className="text-blue-700">Tanggal</p>
                <p className="font-semibold text-blue-900">
                  {new Date(booking.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div>
                <p className="text-blue-700">Waktu</p>
                <p className="font-semibold text-blue-900">
                  {booking.startTime} - {booking.endTime}
                </p>
              </div>

              <div>
                <p className="text-blue-700">Jumlah Peserta</p>
                <p className="font-semibold text-blue-900">
                  {booking.estimatedParticipants || 0} peserta
                </p>
              </div>

              <div>
                <p className="text-blue-700">Jumlah Breakout Room</p>
                <p className="font-semibold text-blue-900">
                  {booking.breakoutRooms || 0} room
                </p>
              </div>
            </div>

            {booking.description && (
              <div className="pt-2 border-t border-blue-200">
                <p className="text-blue-700 text-sm font-medium mb-1">
                  Deskripsi
                </p>
                <p className="text-sm text-blue-900">{booking.description}</p>
              </div>
            )}
          </div>

          {/* Co-Hosts Section */}
          {coHosts.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Co-Hosts
              </h4>
              <div className="grid gap-2">
                {coHosts.map((host, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-purple-200 rounded p-3 text-sm"
                  >
                    <p className="font-medium text-gray-900">{host.name}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{host.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portal Zoom Helper */}
          {isPending && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-purple-900 mb-1">
                    Buat Jadwal di Portal Zoom
                  </h5>
                  <p className="text-sm text-purple-700 mb-3">
                    Sebelum approve, buat jadwal meeting di Portal Zoom terlebih
                    dahulu
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

          {/* Assignment Form - Only show when status is pending */}
          {isPending && (
            <>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Assign Akun Zoom
                </h4>

                {/* Accounts Loading Error */}
                {accountsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 text-sm">
                        Gagal memuat akun Zoom
                      </p>
                      <p className="text-red-700 text-sm mt-1">
                        {accountsError}
                      </p>
                      <p className="text-red-600 text-xs mt-2">
                        Silakan minta admin untuk memeriksa koneksi database
                        atau konfigurasi API.
                      </p>
                    </div>
                  </div>
                )}

                {/* Account Selection */}
                {!accountsError && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account">Pilih Akun Zoom *</Label>
                      <Select
                        value={selectedAccount}
                        onValueChange={setSelectedAccount}
                      >
                        <SelectTrigger id="account">
                          <SelectValue
                            placeholder={
                              zoomAccounts.length === 0
                                ? "Tidak ada akun tersedia"
                                : "Pilih akun zoom..."
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {zoomAccounts.map((account) => (
                            <SelectItem
                              key={account.id}
                              value={account.id.toString()}
                            >
                              <div className="flex items-center gap-2">
                                <span>{account.name}</span>
                                {!account.is_active && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs ml-1"
                                  >
                                    Nonaktif
                                  </Badge>
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
                      <div
                        className={`relative rounded-md overflow-hidden ${
                          hostkey
                            ? "bg-orange-100 border border-orange-300"
                            : "bg-gray-50"
                        }`}
                      >
                        <Key
                          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                            hostkey ? "text-orange-600" : "text-gray-400"
                          }`}
                        />
                        <Input
                          id="hostkey"
                          type="text"
                          placeholder="123456"
                          maxLength={6}
                          value={hostkey}
                          onChange={(e) =>
                            setHostkey(e.target.value.replace(/\D/g, ""))
                          }
                          className={`pl-10 border-0 ${
                            hostkey
                              ? "bg-orange-100 text-orange-900 font-semibold placeholder-orange-500"
                              : "bg-white"
                          }`}
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Otomatis terisi dari akun yang dipilih
                      </p>
                      {hostkey && !isHostkeyValid() && (
                        <p className="text-xs text-red-600">
                          Hostkey harus 6 digit angka
                        </p>
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
                      <p className="font-semibold mb-1">
                        💡 Instruksi Claim Host untuk User:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Join meeting menggunakan link di atas</li>
                        <li>Klik "Claim Host" di bagian bawah layar Zoom</li>
                        <li>
                          Masukkan Hostkey:{" "}
                          <strong>{hostkey || "______"}</strong>
                        </li>
                        <li>Anda akan menjadi Host meeting</li>
                      </ol>
                    </div>
                  </div>
                )}
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
                  {isProcessing ? "Memproses..." : "Approve & Kirim ke User"}
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
                <h4 className="font-semibold text-gray-900 text-red-600">
                  Atau Tolak Booking
                </h4>

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
                  {isProcessing ? "Memproses..." : "Tolak Booking"}
                </Button>
              </div>
            </>
          )}

          {/* Approved/Rejected Info */}
          {(isApproved || isRejected) && (
            <div
              className={`border-2 rounded-lg p-4 ${
                isApproved
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h4
                className={`font-semibold mb-3 ${
                  isApproved ? "text-green-900" : "text-red-900"
                }`}
              >
                {isApproved ? "Detail Persetujuan" : "Detail Penolakan"}
              </h4>

              {isApproved && (
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-green-700">Akun Zoom</p>
                    <p className="font-semibold text-green-900">
                      {booking.zoomAccount?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700">Link Meeting</p>
                    <a
                      href={booking.meetingLink || ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {booking.meetingLink || "-"}
                      {booking.meetingLink && (
                        <ExternalLink className="h-3 w-3" />
                      )}
                    </a>
                  </div>
                  <div>
                    <p className="text-green-700">Passcode</p>
                    <p className="font-semibold text-green-900">
                      {booking.passcode || "-"}
                    </p>
                  </div>
                </div>
              )}

              {isRejected && (
                <div className="text-sm">
                  <p className="text-red-700">Alasan Penolakan</p>
                  <p className="text-red-900">
                    {booking.rejectionReason || "Tidak ada alasan"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Tutup
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
