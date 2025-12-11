import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Wrench,
  Video,
  AlertCircle,
  RotateCw,
  User as UserIcon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  Download,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { api, resolveApiUrl } from "@/lib/api";
import { StatusInfoDialog } from "./status-info-dialog";
import { toast } from "sonner";
import type { User, Ticket, UserRole } from "@/types";

interface TicketListProps {
  currentUser: User;
  activeRole: UserRole;
  viewMode: "all" | "my-tickets";
  onViewTicket: (ticketId: string) => void;
}

interface TicketStats {
  total: number;
  pending: number;
  in_progress: number;
  approved: number;
  completed: number;
  rejected: number;
}

interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  has_more: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({
  onViewTicket,
  currentUser,
  activeRole,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Role effective mengikuti activeRole (bukan sekadar daftar roles)
  const effectiveRole = activeRole || currentUser.role;
  const isAdmin =
    effectiveRole === "admin_layanan" || effectiveRole === "super_admin";
  const isTeknisi = effectiveRole === "teknisi";
  const isAdminPenyedia = effectiveRole === "admin_penyedia";
  const isPegawai = effectiveRole === "pegawai";

  // Untuk multi-role users, tentukan scope berdasarkan activeRole saat ini
  // Bukan berdasarkan "only" logic karena bisa punya multiple roles

  // Reset filterStatus ketika filterType berubah
  useEffect(() => {
    setFilterStatus("all");
  }, [filterType]);

  // Load statistics on mount and when filter type changes
  useEffect(() => {
    loadStats();
  }, [filterType, effectiveRole]);

  // Load tickets when filters change
  useEffect(() => {
    loadTickets(1);
  }, [filterStatus, searchTerm, filterType, effectiveRole]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const query: string[] = [];
      // Admin view hanya untuk super_admin/admin_layanan
      if (isAdmin) {
        query.push("admin_view=true");
      } else if (isAdminPenyedia) {
        // Admin penyedia melihat tiket yang butuh work order
        query.push("scope=work_order_needed");
      } else if (isPegawai) {
        query.push("scope=my");
      } else if (isTeknisi) {
        query.push("scope=assigned");
      }
      if (!isAdminPenyedia && filterType !== "all") {
        query.push(`type=${filterType}`);
      }

      const response = await api.get<any>(`tickets-counts?${query.join("&")}`);
      const statsData = response.counts || response;

      setStats({
        total: statsData.total || 0,
        pending: statsData.submitted || statsData.pending || 0,
        in_progress: statsData.in_progress || statsData.processing || 0,
        approved: statsData.approved || 0,
        completed: statsData.closed || statsData.completed || 0,
        rejected: statsData.rejected || 0,
      });
    } catch (err) {
      console.error("Failed to load ticket stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTickets = async (page: number = 1) => {
    setLoading(true);
    try {
      const query = [];
      query.push(`page=${page}`);
      query.push(`per_page=15`);

      // Add search parameter
      if (searchTerm) {
        query.push(`search=${encodeURIComponent(searchTerm)}`);
      }

      // Add type filter - only for non-admin-penyedia
      if (!isAdminPenyedia && filterType !== "all") {
        query.push(`type=${filterType}`);
      }

      // Add status filter - map filters to actual status values based on type
      if (filterStatus !== "all") {
        if (isAdminPenyedia) {
          // Admin penyedia: perbaikan only
          if (filterStatus === "submitted") {
            query.push(`status=submitted`);
          } else if (filterStatus === "on_hold") {
            query.push(`status=on_hold`);
          } else if (filterStatus === "closed") {
            query.push(`status=closed`);
          }
        } else if (filterType === "perbaikan") {
          // Perbaikan: submitted, assigned, in_progress, on_hold, closed
          query.push(`status=${filterStatus}`);
        } else if (filterType === "zoom_meeting") {
          // Zoom: pending_review, approved, rejected, closed
          query.push(`status=${filterStatus}`);
        } else {
          query.push(`status=${filterStatus}`);
        }
      }

      const url = `tickets?${query.join("&")}`;
      const res: any = await api.get(url);

      let data = Array.isArray(res) ? res : res?.data || [];
      const responseMeta = res?.meta || res;

      // Safety: filter di frontend sesuai activeRole agar pegawai tidak melihat tiket orang lain
      if (isPegawai) {
        data = data.filter(
          (t: any) => (t.userId || t.user_id) === currentUser.id
        );
      } else if (isTeknisi) {
        data = data.filter(
          (t: any) => (t.assignedTo || t.assigned_to) === currentUser.id
        );
      }

      setTickets(data);
      setPagination({
        total:
          isPegawai || isTeknisi
            ? data.length
            : responseMeta.total || data.length,
        per_page: responseMeta.per_page || 15,
        current_page: responseMeta.current_page || page,
        last_page: responseMeta.last_page || 1,
        from: responseMeta.from || (page - 1) * 15 + 1,
        to:
          responseMeta.to ||
          Math.min(page * 15, responseMeta.total || data.length),
        has_more:
          responseMeta.has_more !== undefined
            ? responseMeta.has_more
            : responseMeta.current_page < responseMeta.last_page,
      });
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (!pagination || pagination.current_page <= 1) return;
    loadTickets(pagination.current_page - 1);
  };

  const handleNextPage = () => {
    if (!pagination || !pagination.has_more) return;
    loadTickets(pagination.current_page + 1);
  };

  const handleRefreshData = async () => {
    await loadStats();
    loadTickets(1);
  };

  const getStatusBadge = (status: string) => {
    return (
      <div className="text-sm">
        <span className="text-muted-foreground font-medium">status:</span>{" "}
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          {status}
        </span>
      </div>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "perbaikan":
        return Wrench;
      case "zoom_meeting":
        return Video;
      default:
        return AlertCircle;
    }
  };

  // Export ke Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await fetch(resolveApiUrl("/tickets/export/all"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `laporan_tiket_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Berhasil mengunduh laporan tiket");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengunduh laporan");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      perbaikan: "Perbaikan",
      zoom_meeting: "Zoom Meeting",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      perbaikan: "bg-orange-100 text-orange-800",
      zoom_meeting: "bg-purple-100 text-purple-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div>
          <h1 className="text-3xl font-bold">Kelola Tiket</h1>
          <p className="text-muted-foreground">
            {isAdminPenyedia
              ? "Review dan kelola semua tiket yang membutuhkan work order"
              : "Review dan kelola semua tiket dari pengguna"}
          </p>
        </div>
        {/* Export Button */}
        <div className="flex items-center gap-3 max-md:w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={exporting}
            className="h-8 rounded-full border-slate-300 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-black transition-all max-md:w-full max-md:h-10"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-2 h-3.5 w-3.5 text-slate-500" />
            )}
            Unduh Laporan (.xlsx)
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center max-md:flex-col max-md:items-stretch">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] h-10 max-md:w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari tiket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-full text-sm w-full !ring-offset-0"
              />
            </div>

            {/* Admin Penyedia - Status Filter only */}
            {isAdminPenyedia && (
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="!h-10 text-sm flex-1 max-md:w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Semua ({statsLoading ? "..." : stats.total})
                  </SelectItem>
                  <SelectItem value="submitted">
                    Pending ({statsLoading ? "..." : stats.pending})
                  </SelectItem>
                  <SelectItem value="on_hold">
                    On Hold ({statsLoading ? "..." : stats.in_progress})
                  </SelectItem>
                  <SelectItem value="closed">
                    Closed ({statsLoading ? "..." : stats.completed})
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Non-Admin Penyedia - Type + Status */}
            {!isAdminPenyedia && (
              <>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="!h-10 text-sm flex-1 max-md:w-full">
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="perbaikan">Perbaikan</SelectItem>
                    <SelectItem value="zoom_meeting">Zoom Meeting</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="!h-10 text-sm flex-1 max-md:w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterType === "perbaikan" ? (
                      <>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="waiting_for_submitter">
                          Waiting for Submitter
                        </SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </>
                    ) : filterType === "zoom_meeting" ? (
                      <>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="pending_review">
                          Pending Review
                        </SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="submitted">Pending</SelectItem>
                        <SelectItem value="in_progress">Diproses</SelectItem>
                        <SelectItem value="approved">Disetujui</SelectItem>
                        <SelectItem value="closed">Selesai</SelectItem>
                        <SelectItem value="rejected">Ditolak</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </>
            )}

            {/* Buttons Group (Info & Refresh) */}
            <div className="flex gap-3 max-md:w-full">
              <Button
                variant="outline"
                onClick={() => setShowStatusInfo(true)}
                className="h-10 w-10 p-0 flex-shrink-0 max-md:flex-1"
                size="icon"
                title="Informasi Status"
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleRefreshData}
                disabled={loading || statsLoading}
                className="h-10 w-10 p-0 flex-shrink-0 max-md:flex-1"
                size="icon"
                title="Refresh"
              >
                <RotateCw
                  className={`h-4 w-4 ${loading || statsLoading ? "animate-spin" : ""
                    }`}
                />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">Tidak ada tiket</p>
              <p className="text-sm text-center">
                Belum ada tiket yang sesuai dengan filter
              </p>
            </div>
          ) : (
            tickets.length > 0 && (
              <div className="space-y-3">
                {tickets.map((ticket, index) => {
                  const TypeIcon = getTypeIcon(ticket.type);

                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onViewTicket(String(ticket.id))}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-4">
                            {/* Layout utama: Icon+Text di kiri, Status di kanan (desktop) atau bawah (mobile) */}
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                              {/* Icon Wrapper */}
                              <div className="flex-shrink-0 max-md:hidden">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <TypeIcon className="h-5 w-5 text-primary" />
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 max-md:mb-3">
                                  {/* Mobile Icon (ditampilkan inline di mobile) */}
                                  <div className="hidden max-md:flex h-8 w-8 rounded bg-primary/10 items-center justify-center flex-shrink-0">
                                    <TypeIcon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-sm line-clamp-1">
                                      {ticket.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                      #{ticket.ticketNumber}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <UserIcon className="h-3 w-3" />
                                    <span>{ticket.userName}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(ticket.createdAt)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Badges Section */}
                              <div className="flex sm:flex-col max-md:items-center sm:items-end gap-2 mt-2 sm:mt-0 max-md:justify-between max-md:w-full max-md:border-t max-md:pt-3">
                                <Badge className={`${getTypeColor(ticket.type)} max-md:text-[10px]`}>
                                  {getTypeLabel(ticket.type)}
                                </Badge>
                                <div className="text-right">
                                  {getStatusBadge(ticket.status)}
                                </div>
                              </div>

                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )
          )}

          {/* Responsive Pagination */}
          <div className="flex flex-col-reverse gap-4 md:flex-row items-center justify-between mt-6 pt-4 border-t">
            {/* Info Text */}
            <div className="text-sm text-muted-foreground text-center md:text-left">
              {pagination ? (
                <>
                  Menampilkan <span className="font-medium text-foreground">{pagination.from}</span> - <span className="font-medium text-foreground">{pagination.to}</span> dari{" "}
                  <span className="font-medium text-foreground">{pagination.total}</span> data
                </>
              ) : (
                "Memuat..."
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={!pagination || pagination.current_page <= 1 || loading}
                className="cursor-pointer max-md:px-2"
              >
                <ChevronLeft className="h-4 w-4 md:mr-1" />
                {/* Text disembunyikan di max-md */}
                <span className="hidden md:inline">Sebelumnya</span>
              </Button>

              <div className="text-sm font-medium px-2 min-w-[80px] text-center">
                Hal. {pagination?.current_page || 1} / {pagination?.last_page || 1}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination || !pagination.has_more || loading}
                className="cursor-pointer max-md:px-2"
              >
                {/* Text disembunyikan di max-md */}
                <span className="hidden md:inline">Selanjutnya</span>
                <ChevronRight className="h-4 w-4 md:ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Info Dialog */}
      <StatusInfoDialog
        open={showStatusInfo}
        onOpenChange={setShowStatusInfo}
      />
    </div>
  );
};
