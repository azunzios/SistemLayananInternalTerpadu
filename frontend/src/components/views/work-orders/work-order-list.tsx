import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Ban,
  RotateCw,
  Search,
  BadgeCheck
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { WorkOrder, User } from "@/types";

// --- DEFINISI TIPE BARU ---
export type WorkOrderStatus =
  | "requested"
  | "in_procurement"
  | "completed"
  | "unsuccessful";

interface WorkOrderListProps {
  currentUser: User;
}

interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export const WorkOrderList: React.FC<WorkOrderListProps> = ({
  currentUser: _currentUser,
}) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // State untuk konfirmasi
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<WorkOrderStatus | null>(null);

  // Form untuk update WO
  const [updateForm, setUpdateForm] = useState({
    status: "" as WorkOrderStatus,
    failureReason: "",
    vendorCompletionNotes: "",
    vendorName: "",
    vendorContact: "",
  });

  // Debounce searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Helper: parse items
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

  // Fetch work orders saat filter berubah (gunakan debouncedSearch)
  useEffect(() => {
    fetchWorkOrders(1);
  }, [filterStatus, filterType, debouncedSearch]);

  const fetchWorkOrders = async (page: number = 1) => {
    try {
      setLoading(true);

      const query: string[] = [];
      query.push(`page=${page}`);
      query.push(`per_page=15`);

      // Filter by status
      if (filterStatus !== "all") {
        query.push(`status=${filterStatus}`);
      }

      // Filter by type
      if (filterType !== "all") {
        query.push(`type=${filterType}`);
      }

      // Search (gunakan debouncedSearch)
      if (debouncedSearch) {
        query.push(`search=${encodeURIComponent(debouncedSearch)}`);
      }

      const url = `work-orders?${query.join("&")}`;
      const response = await api.get<any>(url);

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
          completionNotes: wo.completion_notes,
          completedAt: wo.completed_at,
          failureReason: wo.failure_reason,
          createdAt: wo.created_at,
          updatedAt: wo.updated_at,
        })) || [];

      setWorkOrders(transformedData);

      // Set pagination dari response
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch work orders:", error);
      toast.error("Gagal memuat work order");
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (!pagination || pagination.current_page <= 1) return;
    fetchWorkOrders(pagination.current_page - 1);
  };

  const handleNextPage = () => {
    if (!pagination || pagination.current_page >= pagination.last_page) return;
    fetchWorkOrders(pagination.current_page + 1);
  };

  const handleRefreshData = () => {
    fetchWorkOrders(pagination?.current_page || 1);
  };

  const handleViewDetail = (wo: WorkOrder) => {
    setSelectedWO(wo);
    // Pastikan status yang diambil sesuai dengan tipe baru, jika tidak default ke requested
    const currentStatus = [
      "requested",
      "in_procurement",
      "completed",
      "unsuccessful",
    ].includes(wo.status)
      ? (wo.status as WorkOrderStatus)
      : "requested";

    setUpdateForm({
      status: currentStatus,
      failureReason: wo.failureReason || "",
      vendorCompletionNotes: wo.completionNotes || "",
      vendorName: wo.vendorName || "",
      vendorContact: wo.vendorContact || "",
    });
    setShowDetailDialog(true);
  };

  // Helper untuk label status dalam Bahasa Indonesia
  const getStatusLabel = (status: WorkOrderStatus | string): string => {
    const labels: Record<string, string> = {
      requested: "Diajukan",
      in_procurement: "Dalam Pengadaan",
      completed: "Selesai",
      unsuccessful: "Tidak Berhasil",
    };
    return labels[status] || status;
  };

  // Handler untuk klik status di stepper - tampilkan konfirmasi
  const handleStatusClick = (newStatus: WorkOrderStatus) => {
    if (!selectedWO) return;
    if (selectedWO.status === newStatus) {
      toast.info(`Status sudah ${getStatusLabel(newStatus)}`);
      return;
    }
    setPendingStatus(newStatus);
    setShowConfirmDialog(true);
  };

  // Handler untuk konfirmasi perubahan status
  const handleConfirmStatusChange = () => {
    if (!pendingStatus) return;
    setUpdateForm({ ...updateForm, status: pendingStatus });
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  // Handler untuk batal konfirmasi
  const handleCancelStatusChange = () => {
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  const handleUpdateWorkOrder = async () => {
    if (!selectedWO) return;

    // Validasi sebelum submit
    if (updateForm.status === "unsuccessful" && !updateForm.failureReason.trim()) {
      toast.error("Alasan kegagalan wajib diisi");
      return;
    }

    // Catatan penyelesaian vendor tidak wajib diisi
    // Validasi dihapus untuk vendor completion notes

    try {
      const updates: any = {
        status: updateForm.status,
      };

      // Handle vendor info
      if (
        selectedWO.type === "vendor" &&
        (updateForm.status === "in_procurement" ||
          updateForm.status === "completed")
      ) {
        updates.vendor_name = updateForm.vendorName;
        updates.vendor_contact = updateForm.vendorContact;

        if (updateForm.status === "completed") {
          updates.completion_notes = updateForm.vendorCompletionNotes;
        }
      }

      // Handle completion notes untuk semua tipe
      if (updateForm.status === "completed" && updateForm.vendorCompletionNotes) {
        updates.completion_notes = updateForm.vendorCompletionNotes;
      }

      // Handle failure
      if (updateForm.status === "unsuccessful") {
        updates.failure_reason = updateForm.failureReason;
      }

      // API Call
      await api.patch(`work-orders/${selectedWO.id}/status`, updates);

      toast.success(`Work order berhasil diubah ke ${getStatusLabel(updateForm.status)}`);
      await fetchWorkOrders(pagination?.current_page || 1);
      setShowDetailDialog(false);
    } catch (error: any) {
      console.error("Failed to update work order:", error);
      const message = error.response?.data?.message || "Gagal update work order";
      toast.error(message);
    }
  };

  const getStatusBadge = (status: WorkOrderStatus | string) => {
    switch (status) {
      case "requested":
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Requested
          </Badge>
        );
      case "in_procurement":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Package className="h-3 w-3" /> In_Procurement
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Completed
          </Badge>
        );
      case "unsuccessful":
      case "failed": // Backward compatibility
      case "cancelled": // Backward compatibility
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Unsuccessful
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: "sparepart" | "vendor" | "license") => {
    if (type === "sparepart") {
      return (
        <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
          <Package className="h-3 w-3" /> Sparepart
        </Badge>
      );
    }
    if (type === "license") {
      return (
        <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <span>🔑</span> Lisensi
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
        <Building className="h-3 w-3" /> Vendor
      </Badge>
    );
  };

  // --- KOMPONEN STATUS STEPPER ---
  const StatusStepper = () => {
    const current = updateForm.status;

    const steps: { status: WorkOrderStatus; labelEn: string; labelId: string; icon: React.ReactNode }[] = [
      { status: "requested", labelEn: "Requested", labelId: "Diajukan", icon: <span className="text-sm font-bold">1</span> },
      { status: "in_procurement", labelEn: "In Procurement", labelId: "Pengadaan", icon: <span className="text-sm font-bold">2</span> },
      { status: "completed", labelEn: "Completed", labelId: "Selesai", icon: <CheckCircle className="h-4 w-4" /> },
    ];

    const getStepStyle = (status: WorkOrderStatus) => {
      const isActive = current === status;
      const colors: Record<WorkOrderStatus, { active: string; inactive: string }> = {
        requested: {
          active: "bg-blue-600 border-blue-600 text-white",
          inactive: "bg-white border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-400"
        },
        in_procurement: {
          active: "bg-yellow-500 border-yellow-500 text-white shadow-md",
          inactive: "bg-white border-gray-300 text-gray-400 hover:border-yellow-300 hover:text-yellow-500"
        },
        completed: {
          active: "bg-green-600 border-green-600 text-white shadow-md",
          inactive: "bg-white border-gray-300 text-gray-400 hover:border-green-300 hover:text-green-500"
        },
        unsuccessful: {
          active: "bg-red-600 border-red-600 text-white shadow-md",
          inactive: "bg-white border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-400"
        },
      };
      return isActive ? colors[status].active : colors[status].inactive;
    };

    return (
      <div className="py-4 w-full">
        {/* Main Flow: 1 -----> 2 -----> 3 */}
        <div className="flex items-center overflow-y-visible justify-center gap-0 mb-6 max-md:overflow-x-auto max-md:justify-start max-md:pb-4 max-md:px-4">
          {steps.map((step, index) => (
            <div key={step.status} className="flex items-center shrink-0 overflow-y-visible">
              {/* Step Circle + Labels */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all ${getStepStyle(step.status)} ${current === step.status ? "scale-100" : ""}`}
                  onClick={() => handleStatusClick(step.status)}
                >
                  {step.icon}
                </div>
                {/* Double Label: English + Indonesian */}
                <span className={`mt-1.5 text-[10px] font-semibold ${current === step.status ? "text-foreground" : "text-gray-500"}`}>
                  {step.labelEn}
                </span>
                <span className={`text-[10px] ${current === step.status ? "text-muted-foreground font-medium" : "text-gray-400"}`}>
                  ({step.labelId})
                </span>
              </div>

              {/* Arrow Line (tidak untuk step terakhir) */}
              {index < steps.length - 1 && (
                <div className="flex items-center mx-2 mb-8">
                  <div className="w-10 h-0.5 bg-gray-300" />
                  <ChevronRight className="h-4 w-4 text-gray-400 -ml-1" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Unsuccessful Option */}
        <div className="flex justify-center pt-3 border-t border-dashed border-gray-200">
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${current === "unsuccessful"
              ? "bg-red-50 border-red-300 text-red-700 ring-2 ring-red-100"
              : "bg-white border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
              }`}
            onClick={() => handleStatusClick("unsuccessful")}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${current === "unsuccessful" ? "bg-red-600 border-red-600 text-white" : "border-gray-300 bg-gray-100"
              }`}>
              <Ban className="h-3 w-3" />
            </div>
            <span className="text-sm font-medium">Unsuccessful (Tidak Berhasil)</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Work Order Management</h1>
        <p className="text-gray-600">
          Kelola work order sparepart dan vendor untuk perbaikan
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 max-md:flex-col max-md:items-stretch">

            {/* 1. WRAPPER SEARCH */}
            <div className="relative flex-[2] md:h-10 max-md:w-full max-md:h-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                placeholder="Cari work order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-full w-full pl-9 text-sm !ring-offset-0"
              />
            </div>

            {/* 2. FILTER STATUS */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="!h-10 flex-1 text-sm bg-background border-input">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="in_procurement">Procurement</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
              </SelectContent>
            </Select>

            {/* 3. FILTER TIPE */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="!h-10 flex-1 text-sm bg-background border-input">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="sparepart">Sparepart</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="license">Lisensi</SelectItem>
              </SelectContent>
            </Select>

            {/* 4. REFRESH BUTTON */}
            <Button
              variant="outline"
              onClick={handleRefreshData}
              disabled={loading}
              className="!h-10 !w-10 flex-shrink-0 p-0 bg-background max-md:w-full"
              size="icon"
              title="Refresh"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

          </div>
        </CardContent>
      </Card>

      {/* Work Order List */}
      <Card className="pb-6">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 max-md:flex-col max-md:items-start max-md:gap-4">

          {/* BAGIAN KIRI: Judul & Sub-judul */}
          <div className="flex flex-col gap-1">
            <CardTitle>Daftar Work Order</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Klik pada salah satu baris untuk melihat detail
            </p>
          </div>

          {/* BAGIAN KANAN: Hanya Total */}
          <div className="flex flex-col items-end max-md:items-start">
            <span className="text-sm font-medium text-slate-700">
              Total: {pagination?.total || 0}
            </span>
          </div>

        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="border border-gray-200 min-w-[800px]">
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b">
                  <TableHead className="border-r">ID</TableHead>
                  <TableHead className="border-r">Tipe</TableHead>
                  <TableHead className="border-r">Status</TableHead>
                  <TableHead className="border-r">Tiket</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-gray-500"
                    >
                      <RotateCw className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-gray-500"
                    >
                      Tidak ada work order
                    </TableCell>
                  </TableRow>
                ) : (
                  workOrders.map((wo) => {
                    const ticket = wo.ticket;

                    return (
                      <TableRow
                        key={wo.id}
                        className="hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => handleViewDetail(wo)}
                      >
                        <TableCell className="font-mono text-sm border-r">
                          WO-{wo.id}
                        </TableCell>
                        <TableCell className="border-r">
                          {getTypeBadge(wo.type)}
                        </TableCell>
                        <TableCell className="border-r">
                          {getStatusBadge(wo.status)}
                        </TableCell>
                        <TableCell className="border-r">
                          <div>
                            <div className="font-mono text-sm">
                              {ticket?.ticketNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {ticket?.title}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(wo.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4 max-md:flex-col max-md:gap-4">
              <div className="text-sm text-muted-foreground text-center">
                Menampilkan {pagination.from || 0} - {pagination.to || 0} dari {pagination.total} work order
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={pagination?.current_page <= 1}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>
                <span className="text-sm px-2">
                  Halaman {pagination.current_page} dari {pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={pagination.current_page >= pagination.last_page || loading}
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

     {/* Detail & Update Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="md:max-w-3xl max-md:!w-[95vw] max-md:!max-h-[90vh] max-md:!p-4 max-md:!rounded-xl max-md:!overflow-y-auto">
          <DialogHeader className="max-md:!pb-2 max-md:!text-left">
            <DialogTitle className="max-md:!text-lg max-md:!leading-tight">
              Detail & Status Work Order
            </DialogTitle>
            <DialogDescription className="max-md:!text-xs max-md:!mt-1">
              {selectedWO &&
                `Work Order ${
                  selectedWO.type === "sparepart" ? "Sparepart" : "Vendor"
                } - Klik lingkaran status di bawah untuk mengubah.`}
            </DialogDescription>
          </DialogHeader>

          {selectedWO && (
            <div className="space-y-6 py-2 max-md:!space-y-4 max-md:!py-1">
              {/* --- STATUS STEPPER UI --- */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-2 max-md:!p-2 max-md:!overflow-x-auto">
                {/* Pastikan komponen StatusStepper di dalamnya juga responsif atau bisa di-scroll */}
                <StatusStepper />
              </div>

              {/* Conditional Input Fields based on Status Click */}
              <div className="space-y-4 px-1 max-md:!px-0 max-md:!space-y-3">
                {/* 1. Field untuk In Procurement / Completed (Khusus Vendor) */}
                {selectedWO.type === "vendor" &&
                  (updateForm.status === "in_procurement" ||
                    updateForm.status === "completed") && (
                    <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-md:!p-3 max-md:!space-y-3">
                      <div className="flex items-center gap-2 mb-2 max-md:!mb-1">
                        <Building className="h-4 w-4 text-yellow-600 max-md:!h-3.5 max-md:!w-3.5" />
                        <h4 className="font-semibold text-sm text-yellow-800 max-md:!text-xs">
                          Data Vendor Diperlukan
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 max-md:!grid-cols-1 max-md:!gap-3">
                        <div className="space-y-2 max-md:!space-y-1">
                          <Label htmlFor="vendorName" className="max-md:!text-xs">
                            Nama Vendor *
                          </Label>
                          <Input
                            id="vendorName"
                            value={updateForm.vendorName}
                            onChange={(e) =>
                              setUpdateForm({
                                ...updateForm,
                                vendorName: e.target.value,
                              })
                            }
                            placeholder="PT. Contoh Vendor"
                            className="bg-white max-md:!h-9 max-md:!text-sm"
                          />
                        </div>
                        <div className="space-y-2 max-md:!space-y-1">
                          <Label htmlFor="vendorContact" className="max-md:!text-xs">
                            Kontak Vendor *
                          </Label>
                          <Input
                            id="vendorContact"
                            value={updateForm.vendorContact}
                            onChange={(e) =>
                              setUpdateForm({
                                ...updateForm,
                                vendorContact: e.target.value,
                              })
                            }
                            placeholder="0812..."
                            className="bg-white max-md:!h-9 max-md:!text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                {/* 2. Field untuk Completed (Catatan Akhir) */}
                {updateForm.status === "completed" &&
                  selectedWO.type === "vendor" && (
                    <div className="bg-green-50/50 border border-green-100 rounded-lg p-4 space-y-2 animate-in fade-in zoom-in-95 duration-200 max-md:!p-3 max-md:!space-y-2">
                      <Label
                        htmlFor="vendorCompletionNotes"
                        className="text-green-800 font-semibold max-md:!text-xs"
                      >
                        Catatan Penyelesaian
                      </Label>
                      <Textarea
                        id="vendorCompletionNotes"
                        value={updateForm.vendorCompletionNotes}
                        onChange={(e) =>
                          setUpdateForm({
                            ...updateForm,
                            vendorCompletionNotes: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="Deskripsikan hasil pekerjaan..."
                        className="bg-white border-green-200 focus-visible:ring-green-500 max-md:!text-sm"
                      />
                    </div>
                  )}

                {/* 3. Field untuk Unsuccessful (Alasan Gagal) */}
                {updateForm.status === "unsuccessful" && (
                  <div className="bg-red-50/50 border border-red-100 rounded-lg p-4 space-y-2 animate-in fade-in zoom-in-95 duration-200 max-md:!p-3 max-md:!space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-600 max-md:!h-3.5 max-md:!w-3.5" />
                      <Label
                        htmlFor="failureReason"
                        className="text-red-800 font-semibold max-md:!text-xs"
                      >
                        Alasan Gagal / Dibatalkan *
                      </Label>
                    </div>
                    <Textarea
                      id="failureReason"
                      value={updateForm.failureReason}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          failureReason: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Jelaskan alasan kegagalan..."
                      className="bg-white border-red-200 focus-visible:ring-red-500 max-md:!text-sm"
                    />
                  </div>
                )}
              </div>

              <Separator className="max-md:!my-2" />

              {/* Sparepart Details View */}
              {selectedWO.type === "sparepart" && selectedWO.items && (
                <div className="space-y-3 max-md:!space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider max-md:!text-xs">
                    Detail Sparepart
                  </h4>
                  {/* Container Table Responsif */}
                  <div className="rounded-md border max-md:!overflow-x-auto">
                    <Table className="max-md:!min-w-[300px]">
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="max-md:!text-xs max-md:!h-8 max-md:!py-1 max-md:!px-2">
                            Nama
                          </TableHead>
                          <TableHead className="max-md:!text-xs max-md:!h-8 max-md:!py-1 max-md:!px-2">
                            Qty
                          </TableHead>
                          <TableHead className="max-md:!text-xs max-md:!h-8 max-md:!py-1 max-md:!px-2">
                            Satuan
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parseItems(selectedWO.items).map(
                          (item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium max-md:!text-xs max-md:!py-2 max-md:!px-2">
                                {item.name}
                              </TableCell>
                              <TableCell className="max-md:!text-xs max-md:!py-2 max-md:!px-2">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="max-md:!text-xs max-md:!py-2 max-md:!px-2">
                                {item.unit}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Vendor Details View (Static Info) */}
              {selectedWO.type === "vendor" && (
                <div className="space-y-3 max-md:!space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider max-md:!text-xs">
                    Detail Request
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-lg border text-sm max-md:!p-2.5 max-md:!text-xs">
                    <p className="text-muted-foreground mb-1">
                      Deskripsi Pekerjaan:
                    </p>
                    <p>{selectedWO.vendorDescription || "-"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 max-md:!flex-col-reverse max-md:!gap-3 max-md:!pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
              className="cursor-pointer max-md:!w-full max-md:!h-10 max-md:!text-sm"
            >
              Tutup
            </Button>
            <Button
              onClick={handleUpdateWorkOrder}
              className="min-w-[120px] cursor-pointer max-md:!w-full max-md:!h-10 max-md:!text-sm"
            >
              Simpan Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Perubahan Status */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-md:max-w-[90vw] max-md:p-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 max-md:text-base">
              <AlertTriangle className="h-5 w-5 max-md:h-4 max-md:w-4 text-yellow-500" />
              Konfirmasi Perubahan Status
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 max-md:text-sm">
              <div>Apakah Anda yakin ingin mengubah status work order ini?</div>
              {selectedWO && pendingStatus && (
                <div className="mt-3 p-3 max-md:p-2 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm max-md:text-xs">
                    <span className="text-muted-foreground">Status saat ini:</span>
                    <span className="font-medium">{getStatusLabel(selectedWO.status)}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <ChevronRight className="h-4 w-4 max-md:h-3 max-md:w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between text-sm max-md:text-xs">
                    <span className="text-muted-foreground">Status baru:</span>
                    <span className={`font-bold ${pendingStatus === "completed" ? "text-green-600" :
                      pendingStatus === "unsuccessful" ? "text-red-600" :
                        pendingStatus === "in_procurement" ? "text-yellow-600" :
                          "text-blue-600"
                      }`}>
                      {getStatusLabel(pendingStatus)}
                    </span>
                  </div>
                </div>
              )}
              {pendingStatus === "completed" && (
                <div className="flex items-center gap-2 text-sm max-md:text-xs text-green-800 mt-2">
                  <BadgeCheck className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" />
                  <span>Work order yang selesai akan otomatis dicatat di Kartu Kendali</span>
                </div>
              )}
              {pendingStatus === "unsuccessful" && (
                <div className="text-sm max-md:text-xs text-red-600 mt-2">
                  ⚠ Anda akan diminta mengisi alasan kegagalan
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="max-md:flex-col max-md:gap-2">
            <AlertDialogCancel onClick={handleCancelStatusChange} className="cursor-pointer max-md:w-full max-md:m-0">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange} className="cursor-pointer max-md:w-full">
              Ya, Ubah Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
};