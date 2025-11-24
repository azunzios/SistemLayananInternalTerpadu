import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Eye,
  Calendar,
  Clock,
  Wrench,
  Video,
  Loader,
} from "lucide-react";
import type { Ticket, User } from "../types";
import { api } from "../lib/api";

interface MyTicketsViewProps {
  currentUser: User;
  onViewTicket: (ticketId: string) => void;
}

interface TicketStats {
  total: number;
  pending: number;
  in_progress: number;
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

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  currentUser,
  onViewTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState<
    "all" | "pending" | "inProgress" | "completed"
  >("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Determine scope based on user role
  const userRoles = Array.isArray(currentUser.roles)
    ? currentUser.roles
    : typeof currentUser.roles === "string"
    ? JSON.parse(currentUser.roles)
    : [];
  const isTeknisi = userRoles.includes("teknisi");
  const scope = isTeknisi ? "assigned" : "my"; // teknisi: assigned_to, pegawai: user_id

  // Load statistics on mount
  useEffect(() => {
    loadStats();
  }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load tickets when tab, searchTerm, or filterType changes
  useEffect(() => {
    loadTickets(1);
  }, [selectedTab, searchTerm, filterType, scope]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const params: string[] = [`scope=${scope}`];
      if (filterType !== "all") {
        params.push(`type=${filterType}`);
      }
      const response = await api.get<any>(
        `tickets-counts${params.length ? `?${params.join("&")}` : ""}`
      );
      // Response bisa langsung berisi properties atau nested dalam 'counts'
      const statsData = response.counts || response;
      setStats({
        total: statsData.total || 0,
        pending: statsData.pending || 0,
        in_progress: statsData.in_progress || 0,
        completed: statsData.completed || 0,
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

      // Add type filter
      if (filterType !== "all") {
        query.push(`type=${filterType}`);
      }

      // Add status filter based on tab
      if (selectedTab === "pending") {
        query.push(`status=pending`);
      } else if (selectedTab === "inProgress") {
        query.push(`status=in_progress`);
      } else if (selectedTab === "completed") {
        query.push(`status=completed`);
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

  const handleRefreshData = async () => {
    await loadStats();
    loadTickets(1);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      submitted: { label: "Submitted", color: "bg-yellow-100 text-yellow-800" },
      assigned: { label: "Assigned", color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
      on_hold: { label: "On Hold", color: "bg-orange-100 text-orange-800" },
      resolved: { label: "Resolved", color: "bg-green-100 text-green-800" },
      waiting_for_pegawai: {
        label: "Waiting for Pegawai",
        color: "bg-purple-100 text-purple-800",
      },
      closed: { label: "Closed", color: "bg-green-100 text-green-800" },
      closed_unrepairable: {
        label: "Unrepairable",
        color: "bg-red-100 text-red-800",
      },
      pending_review: {
        label: "Pending Review",
        color: "bg-yellow-100 text-yellow-800",
      },
      approved: { label: "Approved", color: "bg-green-100 text-green-800" },
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800" },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
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
          <h1 className="text-3xl font-semibold">Tiket Saya</h1>
          <p className="text-muted-foreground">
            Pantau semua tiket yang Anda ajukan
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={loading || statsLoading}
              className="h-8"
            >
              <RotateCcw
                className={`h-4 w-4 ${
                  loading || statsLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari tiket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Filter Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="perbaikan">Perbaikan</SelectItem>
                <SelectItem value="zoom_meeting">Zoom Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Tabs */}
      <Card>
        <CardContent className="p-4">
          <Tabs
            value={selectedTab}
            onValueChange={(val) => setSelectedTab(val as any)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">
                Semua{" "}
                {statsLoading ? (
                  <Loader className="h-3 w-3 animate-spin ml-1" />
                ) : (
                  `(${stats.total})`
                )}
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending{" "}
                {statsLoading ? (
                  <Loader className="h-3 w-3 animate-spin ml-1" />
                ) : (
                  `(${stats.pending})`
                )}
              </TabsTrigger>
              <TabsTrigger value="inProgress">
                Diproses{" "}
                {statsLoading ? (
                  <Loader className="h-3 w-3 animate-spin ml-1" />
                ) : (
                  `(${stats.in_progress})`
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Selesai{" "}
                {statsLoading ? (
                  <Loader className="h-3 w-3 animate-spin ml-1" />
                ) : (
                  `(${stats.completed})`
                )}
              </TabsTrigger>
            </TabsList>

            {(["all", "pending", "inProgress", "completed"] as const).map(
              (tab) => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  {loading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-16">
                        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ) : tickets.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Tidak ada tiket
                        </h3>
                        <p className="text-muted-foreground text-center">
                          {tab === "all" && "Belum ada tiket yang dibuat"}
                          {tab === "pending" && "Tidak ada tiket pending"}
                          {tab === "inProgress" &&
                            "Tidak ada tiket dalam proses"}
                          {tab === "completed" && "Tidak ada tiket selesai"}
                        </p>
                      </CardContent>
                    </Card>
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
                                      {React.createElement(
                                        getTypeIcon(ticket.type),
                                        {
                                          className: `h-5 w-5 ${
                                            ticket.type === "perbaikan"
                                              ? "text-orange-600"
                                              : "text-purple-600"
                                          }`,
                                        }
                                      )}
                                      <h3 className="font-semibold text-lg">
                                        {ticket.title}
                                      </h3>
                                    </div>
                                    <Badge
                                      className={getTypeColor(ticket.type)}
                                    >
                                      {getTypeLabel(ticket.type)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="font-mono">
                                      {ticket.ticketNumber}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>
                                        {formatDate(ticket.createdAt)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {getStatusBadge(ticket.status)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Pagination */}
                      {pagination && pagination.last_page > 1 && (
                        <Card>
                          <CardContent className="flex items-center justify-between py-4">
                            <div className="text-sm text-muted-foreground">
                              Halaman {pagination.current_page} dari{" "}
                              {pagination.last_page} • Menampilkan{" "}
                              {pagination.from}-{pagination.to} dari{" "}
                              {pagination.total}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={
                                  pagination.current_page === 1 || loading
                                }
                              >
                                Sebelumnya
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={!pagination.has_more || loading}
                              >
                                Berikutnya
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>
              )
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
