import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import {
  Package,
  Truck,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { api } from "../lib/api";
import type { User, WorkOrder, WorkOrderStatus } from "../types";
import { motion } from "motion/react";
import { Spinner } from "./ui/spinner";

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
  delivered: {
    label: "Sudah Dikirim",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  completed: {
    label: "Selesai",
    color: "bg-gray-100 text-gray-800",
    icon: CheckCircle,
  },
  failed: { label: "Gagal", color: "bg-red-100 text-red-800", icon: XCircle },
  cancelled: {
    label: "Dibatalkan",
    color: "bg-gray-100 text-gray-600",
    icon: XCircle,
  },
};

export const TeknisiWorkOrderList: React.FC<TeknisiWorkOrderListProps> = ({
  currentUser,
  onViewDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch work orders from API
  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>("work-orders");
      console.log("Work orders API response:", response);
      console.log("Work orders data:", response.data);
      console.log("Current user ID:", currentUser.id);

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
          createdAt: wo.created_at,
          updatedAt: wo.updated_at,
        })) || [];

      console.log("Transformed data:", transformedData);
      setWorkOrders(transformedData);
    } catch (error) {
      console.error("Failed to fetch work orders:", error);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter work orders created by current user
  const myWorkOrders = useMemo(() => {
    console.log("=== FILTERING WORK ORDERS ===");
    console.log("Total work orders:", workOrders.length);
    console.log(
      "Current user ID:",
      currentUser.id,
      "Type:",
      typeof currentUser.id
    );

    const filtered = workOrders.filter((wo) => {
      console.log(
        "WO:",
        wo.id,
        "createdBy:",
        wo.createdBy,
        "Type:",
        typeof wo.createdBy
      );
      console.log(
        "createdByUser?.id:",
        wo.createdByUser?.id,
        "Type:",
        typeof wo.createdByUser?.id
      );

      const isCreator =
        wo.createdBy == currentUser.id ||
        wo.createdByUser?.id == currentUser.id;
      console.log("Match result:", isCreator);
      return isCreator;
    });

    console.log("Filtered work orders:", filtered.length);
    console.log("=== END FILTERING ===");
    return filtered;
  }, [workOrders, currentUser.id]);

  // Apply filters
  const filteredWorkOrders = useMemo(() => {
    return myWorkOrders.filter((wo) => {
      // Status filter
      if (statusFilter !== "all" && wo.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== "all" && wo.type !== typeFilter) return false;

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();

        const matchesTicket =
          wo.ticket?.ticketNumber?.toLowerCase().includes(searchLower) ||
          wo.ticket?.title?.toLowerCase().includes(searchLower) ||
          wo.ticketNumber?.toLowerCase().includes(searchLower);

        const itemsArray = parseItems(wo.items);
        const matchesSparepart = itemsArray.some((item: any) =>
          item.name?.toLowerCase().includes(searchLower)
        );

        const matchesVendor =
          wo.vendorName?.toLowerCase().includes(searchLower) ||
          wo.vendorDescription?.toLowerCase().includes(searchLower);

        const matchesLicense =
          wo.licenseName?.toLowerCase().includes(searchLower) ||
          wo.licenseDescription?.toLowerCase().includes(searchLower);

        if (
          !matchesTicket &&
          !matchesSparepart &&
          !matchesVendor &&
          !matchesLicense
        )
          return false;
      }

      return true;
    });
  }, [myWorkOrders, statusFilter, typeFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: myWorkOrders.length,
      requested: myWorkOrders.filter((wo) => wo.status === "requested").length,
      in_procurement: myWorkOrders.filter(
        (wo) => wo.status === "in_procurement"
      ).length,
      completed: myWorkOrders.filter((wo) => wo.status === "completed").length,
    };
  }, [myWorkOrders]);

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
        <h1 className="text-3xl flex items-center gap-3">
          <Package className="h-8 w-8 text-blue-600" />
          Work Order Saya
        </h1>
        <p className="text-gray-500 mt-1">
          Daftar semua work order yang telah Anda request
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total WO</p>
                <p className="text-2xl mt-1">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Diminta</p>
                <p className="text-2xl mt-1">{stats.requested}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pengadaan</p>
                <p className="text-2xl mt-1">{stats.in_procurement}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selesai</p>
                <p className="text-2xl mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
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
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="requested">Diminta</SelectItem>
                <SelectItem value="in_procurement">Dalam Pengadaan</SelectItem>
                <SelectItem value="delivered">Sudah Dikirim</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="failed">Gagal</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Work Order ({filteredWorkOrders.length})</CardTitle>
          <CardDescription>
            Klik pada baris untuk melihat detail work order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWorkOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada work order yang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tiket</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((wo, index) => {
                    const ticket = wo.ticket;
                    const StatusIcon = statusConfig[wo.status]?.icon;
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
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewDetail(wo.id)}
                      >
                        <TableCell>
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

                        <TableCell>
                          <div className="font-mono text-sm">
                            {ticket?.ticketNumber || wo.ticketNumber}
                          </div>
                          <div className="text-xs text-gray-500 max-w-[200px] truncate">
                            {ticket?.title}
                          </div>
                        </TableCell>

                        <TableCell>
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

                        <TableCell>
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

                        <TableCell>
                          <Badge className={statusConfig[wo.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[wo.status].label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Button
                            size="sm"
                            variant="link"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetail(wo.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

              <Separator />

              {/* Timeline */}
              <div>
                <h4 className="font-semibold mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-gray-600">Dibuat:</span>{" "}
                    <span>
                      {new Date(selectedWO.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Terakhir Diupdate:</span>{" "}
                    <span>
                      {new Date(selectedWO.updatedAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
