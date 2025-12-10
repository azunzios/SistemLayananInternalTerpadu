import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Truck,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import type { User, WorkOrder, WorkOrderStatus } from "@/types";
import { motion } from "motion/react";
import { Spinner } from "@/components/ui/spinner";

// Pagination info from backend
interface PaginationInfo {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

interface TeknisiWorkOrderListProps {
  currentUser: User;
  onViewDetail?: (workOrderId: string) => void;
}

const statusConfig: Record<
  WorkOrderStatus,
  { label: string; color: string; icon: any }
> = {
  requested: {
    label: "Diminta",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  in_procurement: {
    label: "Dalam Pengadaan",
    color: "bg-blue-100 text-blue-800",
    icon: Package,
  },
  completed: {
    label: "Selesai",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  unsuccessful: {
    label: "Tidak Berhasil",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

export const TeknisiWorkOrderList: React.FC<TeknisiWorkOrderListProps> = ({
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
    from: null,
    to: null,
  });

  // Helper: parse items (handle both array and JSON string)
  const parseItems = (items: any) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === "string") {
      try {
        return JSON.parse(items);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Fetch work orders from API with server-side filtering
  const fetchWorkOrders = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      
      // Build query params for server-side filtering
      const params = new URLSearchParams();
      params.append("created_by", String(currentUser.id));
      params.append("page", String(page));
      params.append("per_page", "15");
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await api.get<any>(`work-orders?${params.toString()}`);

      // Transform snake_case to camelCase for top-level fields
      const transformedData =
        response.data?.map((wo: any) => ({
          ...wo,
          createdBy: wo.created_by,
          createdByUser: wo.created_by_user,
          ticketId: wo.ticket_id,
          ticketNumber: wo.ticket_number,
          vendorName: wo.vendor_name,
          vendorContact: wo.vendor_contact,
          vendorDescription: wo.vendor_description,
          licenseName: wo.license_name,
          licenseDescription: wo.license_description,
          failureReason: wo.failure_reason,
          completionNotes: wo.completion_notes,
          createdAt: wo.created_at,
          updatedAt: wo.updated_at,
        })) || [];

      setWorkOrders(transformedData);
      
      // Update pagination info
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch work orders:", error);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, statusFilter, typeFilter, searchQuery]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchWorkOrders(1);
  }, [statusFilter, typeFilter]); // Don't include searchQuery here - use debounce

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWorkOrders(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchWorkOrders(newPage);
    }
  };

  const handleViewDetail = (woId: string | number) => {
    const wo = workOrders.find((w) => w.id === woId);
    if (wo) {
      setSelectedWO(wo);
      setShowDetailDialog(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          Work Order Saya
          <Package className="h-8 w-8 text-blue-600" />
        </h1>
        <p className="text-gray-500 mt-1">
          Daftar semua work order yang telah Anda request
        </p>
      </div>

      {/* Filters */}
      <Card className="pb-6">
        <CardHeader>
          <CardTitle>Filter Work Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari tiket, sparepart, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="sparepart">Sparepart</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="license">Lisensi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="in_procurement">In Procurement</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Table */}
      <Card className="pb-6">
        <CardHeader>
          <CardTitle>Daftar Work Order ({pagination.total})</CardTitle>
          <CardDescription>
            Klik pada baris untuk melihat detail work order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada work order yang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border border-gray-200">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r">Tanggal</TableHead>
                    <TableHead className="border-r">Tiket</TableHead>
                    <TableHead className="border-r">Jenis</TableHead>
                    <TableHead className="border-r">Detail</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((wo: any, index: number) => {
                    const ticket = wo.ticket;
                    const StatusIcon = statusConfig[wo.status as WorkOrderStatus]?.icon;
                    const getTypeIcon = () => {
                      if (wo.type === "sparepart")
                        return <Package className="h-3 w-3" />;
                      if (wo.type === "license") return <span>🔑</span>;
                      return <Truck className="h-3 w-3" />;
                    };

                    return (
                      <motion.tr
                        key={wo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => handleViewDetail(wo.id)}
                      >
                        <TableCell className="border-r">
                          <div className="text-sm">
                            {new Date(wo.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(wo.createdAt).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="border-r">
                          <div className="font-mono text-sm">
                            {ticket?.ticketNumber || wo.ticketNumber}
                          </div>
                          <div className="text-xs text-gray-500 max-w-[200px] truncate">
                            {ticket?.title}
                          </div>
                        </TableCell>

                        <TableCell className="border-r">
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            {getTypeIcon()}
                            {wo.type === "sparepart"
                              ? "Sparepart"
                              : wo.type === "license"
                              ? "Lisensi"
                              : "Vendor"}
                          </Badge>
                        </TableCell>

                        <TableCell className="border-r">
                          {wo.type === "sparepart" && wo.items && (
                            <div className="text-sm">
                              {(() => {
                                const itemsArray = parseItems(wo.items);
                                return itemsArray.length > 1 ? (
                                  <span>
                                    {itemsArray.length} item sparepart
                                  </span>
                                ) : itemsArray.length === 1 ? (
                                  <span>{itemsArray[0]?.name}</span>
                                ) : null;
                              })()}
                            </div>
                          )}
                          {wo.type === "vendor" && (
                            <div className="text-sm max-w-[200px] truncate">
                              {wo.vendorName || wo.vendorDescription}
                            </div>
                          )}
                          {wo.type === "license" && (
                            <div className="text-sm max-w-[200px] truncate">
                              {wo.licenseName}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="w-32">
                          <Badge className={statusConfig[wo.status as WorkOrderStatus]?.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[wo.status as WorkOrderStatus]?.label}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-500">
              {pagination.from && pagination.to ? (
                <>
                  Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} work order
                </>
              ) : (
                <>Total: {pagination.total} work order</>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and nearby pages
                    if (page === 1 || page === pagination.last_page) return true;
                    if (Math.abs(page - pagination.current_page) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => {
                    // Add ellipsis if there's a gap
                    const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={pagination.current_page === page ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    );
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.last_page || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="md:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Work Order</DialogTitle>
            <DialogDescription>
              Informasi lengkap work order yang Anda request
            </DialogDescription>
          </DialogHeader>

          {selectedWO && (
            <div className="space-y-6">
              {/* Status & Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedWO.type === "sparepart" ? (
                    <Package className="h-5 w-5 text-gray-500" />
                  ) : selectedWO.type === "license" ? (
                    <span className="text-2xl">🔑</span>
                  ) : (
                    <Truck className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="font-medium">
                    {selectedWO.type === "sparepart"
                      ? "Work Order Sparepart"
                      : selectedWO.type === "license"
                      ? "Work Order Lisensi"
                      : "Work Order Vendor"}
                  </span>
                </div>
                <Badge className={statusConfig[selectedWO.status].color}>
                  {statusConfig[selectedWO.status].label}
                </Badge>
              </div>

              <Separator />

              {/* Ticket Info */}
              <div>
                <h4 className="font-semibold mb-3">Informasi Tiket</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Nomor Tiket:</span>
                    <span className="font-mono">
                      {selectedWO.ticket?.ticketNumber ||
                        selectedWO.ticketNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Judul:</span>
                    <span>{selectedWO.ticket?.title}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sparepart Details */}
              {selectedWO.type === "sparepart" && selectedWO.items && (
                <div>
                  <h4 className="font-semibold mb-3">Daftar Sparepart</h4>
                  <div className="space-y-2">
                    {parseItems(selectedWO.items).map(
                      (item: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">
                                Unit: {item.unit}
                              </p>
                            </div>
                            <span className="text-sm font-medium">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Vendor Details */}
              {selectedWO.type === "vendor" && (
                <div>
                  <h4 className="font-semibold mb-3">Detail Vendor</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Nama Vendor:</span>
                      <span>{selectedWO.vendorName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Kontak:</span>
                      <span>{selectedWO.vendorContact}</span>
                    </div>
                    <div className="text-sm mt-2">
                      <span className="text-gray-600">Deskripsi:</span>
                      <p className="mt-1">{selectedWO.vendorDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* License Details */}
              {selectedWO.type === "license" && (
                <div>
                  <h4 className="font-semibold mb-3">Detail Lisensi</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Nama Lisensi:</span>
                      <span>{selectedWO.licenseName}</span>
                    </div>
                    <div className="text-sm mt-2">
                      <span className="text-gray-600">Deskripsi:</span>
                      <p className="mt-1">{selectedWO.licenseDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Failure Reason - tampilkan jika status unsuccessful */}
              {selectedWO.status === "unsuccessful" && selectedWO.failureReason && (
                <div>
                  <h4 className="font-semibold mb-3 text-red-600">Alasan Tidak Berhasil</h4>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-800">{selectedWO.failureReason}</p>
                  </div>
                </div>
              )}

              <Separator />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
