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
  AlertCircle,
  Search,
  RotateCcw,
  Calendar,
  Wrench,
  Video,
  Info,
} from "lucide-react";
import type { Ticket, User } from "@/types";
import { api } from "@/lib/api";
import { StatusInfoDialog } from "./status-info-dialog";

interface MyTicketsViewProps {
  currentUser: User;
  activeRole?: string; // Role aktif saat ini (untuk multi-role)
  onViewTicket: (ticketId: string) => void;
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

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  currentUser,
  activeRole,
  onViewTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const [loading, setLoading] = useState(false);

  // Multi-role: gunakan activeRole untuk menentukan scope (bukan includes logic)
  const effectiveRole = activeRole || currentUser.role;
  const isTeknisi = effectiveRole === "teknisi";
  const scope = isTeknisi ? "assigned" : "my";

  console.log("🔍 MY TICKETS VIEW DEBUG:", {
    activeRole,
    "currentUser.role": currentUser.role,
    "currentUser.roles": currentUser.roles,
    effectiveRole,
    isTeknisi,
    scope,
  });

  // Reset filterStatus ketika filterType berubah
  useEffect(() => {
    setFilterStatus("all");
  }, [filterType]);

  // Load tickets when filterStatus, searchTerm, or filterType changes
  useEffect(() => {
    loadTickets(1);
  }, [filterStatus, searchTerm, filterType, scope]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Add type filter - teknisi hanya handle perbaikan
      const effectiveType = isTeknisi ? "perbaikan" : filterType;
      if (isTeknisi) {
        query.push(`type=perbaikan`);
      } else if (filterType !== "all") {
        query.push(`type=${filterType}`);
      }

      // Add status filter based on filterStatus dan tipe tiket
      if (filterStatus !== "all") {
        if (effectiveType === "perbaikan" || effectiveType === "all") {
          // Perbaikan: pending=submitted, diproses=assigned/in_progress/on_hold/waiting_for_submitter, selesai=closed
          if (filterStatus === "pending") {
            query.push(`status=submitted`);
          } else if (filterStatus === "inProgress") {
            query.push(
              `status=assigned,in_progress,on_hold,waiting_for_submitter`
            );
          } else if (filterStatus === "completed") {
            query.push(`status=closed`);
          }
        }
        if (effectiveType === "zoom_meeting") {
          // Zoom: pending=pending_review, selesai=approved/rejected/cancelled
          if (filterStatus === "pending") {
            query.push(`status=pending_review`);
          } else if (filterStatus === "completed") {
            query.push(`status=approved,rejected,cancelled`);
          }
        }
      }

      // Force scope based on user role (teknisi: assigned, pegawai: my)
      query.push(`scope=${scope}`);

      const url = `tickets?${query.join("&")}`;
      const res: any = await api.get(url);

      const data = Array.isArray(res) ? res : res?.data || [];
      const responseMeta = res?.meta || res;

      setTickets(data);
      setPagination({
        total: responseMeta.total || 0,
        per_page: responseMeta.per_page || 15,
        current_page: responseMeta.current_page || page,
        last_page: responseMeta.last_page || 1,
        from: responseMeta.from || (page - 1) * 15 + 1,
        to: responseMeta.to || Math.min(page * 15, responseMeta.total || 0),
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

  const handleRefreshData = () => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tiket Saya</h1>
          <p className="text-muted-foreground">Pantau semua tiket Anda</p>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 w-full">
            {/* 1. Search - flex-1 agar mengisi sisa ruang (paling panjang) */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari tiket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm w-full"
              />
            </div>

            {/* 2. Filter Tipe - Fixed width & tidak menyusut */}
            {!isTeknisi && (
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-10 text-sm w-36 flex-shrink-0">
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="perbaikan">Perbaikan</SelectItem>
                  <SelectItem value="zoom_meeting">Zoom Meeting</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* 3. Filter Status - Fixed width & tidak menyusut */}
            <Select
              value={filterType === "all" ? "all" : filterStatus}
              onValueChange={setFilterStatus}
              disabled={filterType === "all"}
            >
              <SelectTrigger
                className="h-10 text-sm w-36 flex-shrink-0"
                title={
                  filterType === "all"
                    ? "Pilih tipe tiket terlebih dahulu"
                    : undefined
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterType === "perbaikan" ? (
                  <>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inProgress">Diproses</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                  </>
                ) : filterType === "zoom_meeting" ? (
                  <>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                  </>
                ) : (
                  <SelectItem value="all">Semua</SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* 4. Action Buttons - Fixed size & tidak menyusut */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowStatusInfo(true)}
                className="h-10 w-10"
                title="Informasi Status"
              >
                <Info className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleRefreshData}
                disabled={loading}
                className="h-10 w-10"
                title="Refresh"
              >
                <RotateCcw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
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
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak ada tiket</h3>
              <p className="text-muted-foreground text-center">
                {filterStatus === "all" && "Belum ada tiket yang dibuat"}
                {filterStatus === "pending" && "Tidak ada tiket pending"}
                {filterStatus === "inProgress" &&
                  "Tidak ada tiket dalam proses"}
                {filterStatus === "completed" && "Tidak ada tiket selesai"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {tickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onViewTicket(ticket.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {React.createElement(getTypeIcon(ticket.type), {
                                className: `h-5 w-5 ${
                                  ticket.type === "perbaikan"
                                    ? "text-orange-600"
                                    : "text-purple-600"
                                }`,
                              })}
                              <h3 className="font-semibold text-lg">
                                {ticket.title}
                              </h3>
                            </div>
                            <Badge className={getTypeColor(ticket.type)}>
                              {getTypeLabel(ticket.type)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-mono">
                              {ticket.ticketNumber}
                            </span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(ticket.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getStatusBadge(ticket.status)}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-8 w-8 p-0"
                          ></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination - selalu tampilkan */}
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="text-sm text-muted-foreground">
                    {pagination ? (
                      <>
                        Halaman {pagination.current_page} dari{" "}
                        {pagination.last_page} • Menampilkan {pagination.from}-
                        {pagination.to} dari {pagination.total}
                      </>
                    ) : (
                      "Memuat..."
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={
                        !pagination || pagination.current_page === 1 || loading
                      }
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!pagination || !pagination.has_more || loading}
                    >
                      Berikutnya
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
