import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
  Truck,
  AlertTriangle,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { WorkOrder, WorkOrderStatus, User } from "@/types";
import { KartuKendaliForm } from "@/components/views/shared/kartu-kendali-form";

interface WorkOrderListProps {
  currentUser: User;
}

export const WorkOrderList: React.FC<WorkOrderListProps> = ({
  currentUser,
}) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Kartu Kendali states
  const [showKartuKendaliForm, setShowKartuKendaliForm] = useState(false);
  const [selectedWOForKartuKendali, setSelectedWOForKartuKendali] =
    useState<WorkOrder | null>(null);
  const [workOrdersWithKartuKendali, setWorkOrdersWithKartuKendali] = useState<
    Set<number>
  >(new Set());

  // Form untuk update WO
  const [updateForm, setUpdateForm] = useState({
    status: "" as WorkOrderStatus,
    failureReason: "",
    vendorCompletionNotes: "",
    vendorName: "",
    vendorContact: "",
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

  // Fetch work orders from API
  useEffect(() => {
    fetchWorkOrders();
  }, []);

  // Check which work orders have kartu kendali
  const checkKartuKendali = async (woIds: number[]) => {
    try {
      const checks = await Promise.all(
        woIds.map(async (id) => {
          const response = await api.get<any>(
            `/kartu-kendali/check-work-order/${id}`
          );
          return {
            id,
            hasKartuKendali: response.data?.data?.has_kartu_kendali || false,
          };
        })
      );

      const woWithKK = new Set(
        checks.filter((c) => c.hasKartuKendali).map((c) => c.id)
      );
      setWorkOrdersWithKartuKendali(woWithKK);
    } catch (error) {
      console.error("Error checking kartu kendali:", error);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>("work-orders");

      // Transform snake_case to camelCase
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

      setWorkOrders(transformedData);

      // Check kartu kendali for completed work orders
      const completedWOIds = transformedData
        .filter((wo: WorkOrder) => wo.status === "completed")
        .map((wo: WorkOrder) =>
          typeof wo.id === "string" ? parseInt(wo.id) : wo.id
        );

      if (completedWOIds.length > 0) {
        checkKartuKendali(completedWOIds);
      }
    } catch (error) {
      console.error("Failed to fetch work orders:", error);
      toast.error("Gagal memuat work order");
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setUpdateForm({
      status: wo.status,
      failureReason: wo.failureReason || "",
      vendorCompletionNotes: "",
      vendorName: wo.vendorName || "",
      vendorContact: wo.vendorContact || "",
    });
    setShowDetailDialog(true);
  };

  const handleUpdateWorkOrder = async () => {
    if (!selectedWO) return;

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

      // Handle failure
      if (updateForm.status === "failed") {
        updates.failure_reason = updateForm.failureReason;
      }

      // Use PATCH endpoint for status update
      await api.patch(`work-orders/${selectedWO.id}/status`, updates);

      toast.success("Work order berhasil diupdate");
      await fetchWorkOrders();
      setShowDetailDialog(false);
    } catch (error) {
      console.error("Failed to update work order:", error);
      toast.error("Gagal update work order");
    }
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    const variants: Record<
      WorkOrderStatus,
      { variant: string; label: string; icon: any }
    > = {
      requested: {
        variant: "bg-blue-100 text-blue-800",
        label: "Requested",
        icon: Clock,
      },
      in_procurement: {
        variant: "bg-yellow-100 text-yellow-800",
        label: "Procurement",
        icon: Package,
      },
      delivered: {
        variant: "bg-green-100 text-green-800",
        label: "Delivered",
        icon: Truck,
      },
      completed: {
        variant: "bg-emerald-100 text-emerald-800",
        label: "Completed",
        icon: CheckCircle,
      },
      failed: {
        variant: "bg-red-100 text-red-800",
        label: "Failed",
        icon: XCircle,
      },
      cancelled: {
        variant: "bg-gray-100 text-gray-800",
        label: "Cancelled",
        icon: XCircle,
      },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.variant} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusLabel = (status: WorkOrderStatus) => {
    const labels: Record<WorkOrderStatus, string> = {
      requested: "Diminta",
      in_procurement: "Dalam Pengadaan",
      delivered: "Diterima",
      completed: "Selesai",
      failed: "Gagal",
      cancelled: "Dibatalkan",
    };
    return labels[status];
  };

  const getTypeBadge = (type: "sparepart" | "vendor" | "license") => {
    if (type === "sparepart") {
      return (
        <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
          <Package className="h-3 w-3" />
          Sparepart
        </Badge>
      );
    }
    if (type === "license") {
      return (
        <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <span>🔑</span>
          Lisensi
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
        <Building className="h-3 w-3" />
        Vendor
      </Badge>
    );
  };

  const filteredWorkOrders = workOrders.filter((wo) => {
    if (filterStatus !== "all" && wo.status !== filterStatus) return false;
    if (filterType !== "all" && wo.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2>Work Order Management</h2>
        <p className="text-gray-600">
          Kelola work order sparepart dan vendor untuk perbaikan
        </p>
      </div>

      {/* Filters */}
      <Card className="!pb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="in_procurement">Procurement</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filter by Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="sparepart">Sparepart</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="license">Lisensi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Order List */}
      <Card className="pb-6">
        <CardHeader>
          <CardTitle>Daftar Work Order</CardTitle>
          <CardDescription>
            Total: {filteredWorkOrders.length} work order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tiket</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredWorkOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    Tidak ada work order
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkOrders.map((wo) => {
                  const ticket = wo.ticket;

                  return (
                    <TableRow key={wo.id}>
                      <TableCell className="font-mono text-sm">
                        WO-{wo.id}
                      </TableCell>
                      <TableCell>{getTypeBadge(wo.type)}</TableCell>
                      <TableCell>{getStatusBadge(wo.status)}</TableCell>
                      <TableCell>
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
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(wo)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detail
                          </Button>
                          {wo.status === "completed" &&
                            wo.ticket &&
                            (wo.ticket as any)?.type === "perbaikan" &&
                            (wo.ticket as any)?.assetCode &&
                            (wo.ticket as any)?.assetNUP &&
                            !workOrdersWithKartuKendali.has(
                              typeof wo.id === "string"
                                ? parseInt(wo.id)
                                : wo.id
                            ) && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                  setSelectedWOForKartuKendali(wo);
                                  setShowKartuKendaliForm(true);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Isi Kartu Kendali
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Work Order</DialogTitle>
            <DialogDescription>
              {selectedWO &&
                `Work Order ${
                  selectedWO.type === "sparepart" ? "Sparepart" : "Vendor"
                }`}
            </DialogDescription>
          </DialogHeader>

          {selectedWO && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Tipe</Label>
                  <div className="mt-1">{getTypeBadge(selectedWO.type)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedWO.status)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sparepart Details */}
              {selectedWO.type === "sparepart" && selectedWO.items && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Daftar Sparepart</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Satuan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseItems(selectedWO.items).map(
                        (item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Vendor Details */}
              {selectedWO.type === "vendor" && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Informasi Vendor</h4>

                  {selectedWO.vendorName ? (
                    // Display vendor info if already filled
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">
                            Nama Vendor
                          </Label>
                          <p>{selectedWO.vendorName}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Kontak
                          </Label>
                          <p>{selectedWO.vendorContact || "-"}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">
                          Deskripsi Pekerjaan
                        </Label>
                        <p className="text-sm mt-1">
                          {selectedWO.vendorDescription || "-"}
                        </p>
                      </div>
                    </>
                  ) : (
                    // Show form to add vendor info if not yet filled
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-yellow-900 font-medium">
                            Informasi vendor belum ditambahkan
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Silakan tambahkan nama dan kontak vendor di form
                            update di bawah
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* License Details */}
              {selectedWO.type === "license" && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Informasi Lisensi</h4>
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">
                        Nama Lisensi
                      </Label>
                      <p>{selectedWO.licenseName || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Deskripsi</Label>
                      <p className="text-sm mt-1">
                        {selectedWO.licenseDescription || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Update Form */}
              <div className="space-y-4">
                <h4 className="font-semibold">Update Work Order</h4>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={updateForm.status}
                    onValueChange={(value: WorkOrderStatus) =>
                      setUpdateForm({ ...updateForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="in_procurement">
                        In Procurement
                      </SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional fields based on status and type */}
                {selectedWO.type === "vendor" &&
                  (updateForm.status === "in_procurement" ||
                    updateForm.status === "completed") && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="vendorName">Nama Vendor *</Label>
                        <Input
                          id="vendorName"
                          value={updateForm.vendorName}
                          onChange={(e) =>
                            setUpdateForm({
                              ...updateForm,
                              vendorName: e.target.value,
                            })
                          }
                          placeholder="Masukkan nama vendor"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vendorContact">Kontak Vendor *</Label>
                        <Input
                          id="vendorContact"
                          value={updateForm.vendorContact}
                          onChange={(e) =>
                            setUpdateForm({
                              ...updateForm,
                              vendorContact: e.target.value,
                            })
                          }
                          placeholder="No. telepon atau email vendor"
                        />
                      </div>
                    </>
                  )}

                {updateForm.status === "completed" &&
                  selectedWO.type === "vendor" && (
                    <div className="space-y-2">
                      <Label htmlFor="vendorCompletionNotes">
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
                        placeholder="Catatan hasil pekerjaan vendor..."
                      />
                    </div>
                  )}

                {updateForm.status === "failed" && (
                  <div className="space-y-2">
                    <Label htmlFor="failureReason">Alasan Gagal *</Label>
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
                      placeholder="Jelaskan alasan work order gagal..."
                    />
                  </div>
                )}
              </div>

              <Separator />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
            >
              Tutup
            </Button>
            <Button onClick={handleUpdateWorkOrder}>Simpan Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kartu Kendali Form */}
      {selectedWOForKartuKendali && (
        <KartuKendaliForm
          isOpen={showKartuKendaliForm}
          onClose={() => {
            setShowKartuKendaliForm(false);
            setSelectedWOForKartuKendali(null);
          }}
          workOrderId={
            typeof selectedWOForKartuKendali.id === "string"
              ? parseInt(selectedWOForKartuKendali.id)
              : selectedWOForKartuKendali.id
          }
          assetCode={(selectedWOForKartuKendali.ticket as any)?.assetCode || ""}
          assetNup={(selectedWOForKartuKendali.ticket as any)?.assetNUP || ""}
          onSuccess={() => {
            toast.success("Kartu Kendali berhasil dibuat");
            // Add the work order to the set of WOs with kartu kendali
            const woId =
              typeof selectedWOForKartuKendali.id === "string"
                ? parseInt(selectedWOForKartuKendali.id)
                : selectedWOForKartuKendali.id;
            setWorkOrdersWithKartuKendali((prev) => new Set([...prev, woId]));
            setShowKartuKendaliForm(false);
            setSelectedWOForKartuKendali(null);
          }}
        />
      )}
    </div>
  );
};
