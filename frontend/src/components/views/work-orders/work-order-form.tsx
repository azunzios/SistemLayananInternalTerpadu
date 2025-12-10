import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Users, Key, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";

// Tipe sparepart item
interface SparepartItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface WorkOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number;
  ticketStatus?: string;
  workOrderCount?: number;
  onSuccess: () => void;
}

export const WorkOrderForm: React.FC<WorkOrderFormProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketStatus = "in_progress",
  workOrderCount = 0,
  onSuccess,
}) => {
  const [type, setType] = useState<"sparepart" | "vendor" | "license">(
    "sparepart"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWorkOrders, setIsLoadingWorkOrders] = useState(false);

  const [showContinueConfirm, setShowContinueConfirm] = useState(false);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);

  // State for BMN condition change
  const [showBMNConditionDialog, setShowBMNConditionDialog] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
  const [bmnCondition, setBmnCondition] = useState<string>("");
  const [isChangingCondition, setIsChangingCondition] = useState(false);

  // Fetch work orders saat dialog dibuka
  useEffect(() => {
    if (isOpen && ticketId) {
      fetchWorkOrders();
    }
  }, [isOpen, ticketId]);

  const fetchWorkOrders = async () => {
    setIsLoadingWorkOrders(true);
    try {
      const response = (await api.get(`/tickets/${ticketId}/work-orders`)) as {
        success?: boolean;
        data?: any[];
      };
      if (response.success && Array.isArray(response.data)) {
        setWorkOrders(response.data);
      } else if (Array.isArray(response.data)) {
        setWorkOrders(response.data);
      }
    } catch (error) {
      console.error("Error fetching work orders:", error);
      setWorkOrders([]);
    } finally {
      setIsLoadingWorkOrders(false);
    }
  };

  // State untuk sparepart (array)
  const [spareparts, setSpareparts] = useState<SparepartItem[]>([
    { id: "1", name: "", quantity: 1, unit: "" },
  ]);

  // State untuk vendor
  const [vendorName, setVendorName] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [vendorDescription, setVendorDescription] = useState("");

  // State untuk lisensi
  const [licenseName, setLicenseName] = useState("");
  const [licenseDescription, setLicenseDescription] = useState("");

  // Tambah sparepart baru
  const addSparepart = () => {
    const newId = (spareparts.length + 1).toString();
    setSpareparts([
      ...spareparts,
      { id: newId, name: "", quantity: 1, unit: "" },
    ]);
  };

  // Hapus sparepart
  const removeSparepart = (id: string) => {
    if (spareparts.length > 1) {
      setSpareparts(spareparts.filter((sp) => sp.id !== id));
    }
  };

  // Update sparepart item
  const updateSparepart = (
    id: string,
    field: keyof SparepartItem,
    value: string | number
  ) => {
    setSpareparts(
      spareparts.map((sp) => (sp.id === id ? { ...sp, [field]: value } : sp))
    );
  };

  // Reset form
  const resetForm = () => {
    setType("sparepart");
    setSpareparts([{ id: "1", name: "", quantity: 1, unit: "" }]);
    setVendorName("");
    setVendorContact("");
    setVendorDescription("");
    setLicenseName("");
    setLicenseDescription("");
  };

  // Validasi form
  const validateForm = (): boolean => {
    if (type === "sparepart") {
      const hasEmpty = spareparts.some(
        (sp) => !sp.name.trim() || !sp.unit.trim() || sp.quantity < 1
      );
      if (hasEmpty) {
        toast.error("Semua field sparepart harus diisi dengan lengkap");
        return false;
      }
    } else if (type === "vendor") {
      if (
        !vendorName.trim() ||
        !vendorContact.trim() ||
        !vendorDescription.trim()
      ) {
        toast.error("Nama vendor, kontak, dan deskripsi harus diisi");
        return false;
      }
    } else if (type === "license") {
      if (!licenseName.trim() || !licenseDescription.trim()) {
        toast.error("Nama lisensi dan deskripsi harus diisi");
        return false;
      }
    }
    return true;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Siapkan data sesuai tipe
    const requestData: any = {
      ticket_id: ticketId,
      type: type,
    };

    if (type === "sparepart") {
      requestData.items = spareparts.map((sp) => ({
        name: sp.name,
        quantity: sp.quantity,
        unit: sp.unit,
      }));
    } else if (type === "vendor") {
      requestData.vendor_name = vendorName;
      requestData.vendor_contact = vendorContact;
      requestData.description = vendorDescription;
    } else if (type === "license") {
      requestData.license_name = licenseName;
      requestData.description = licenseDescription;
    }

    // Simpan data dan show confirmation dialog
    setPendingSubmitData(requestData);
    setShowConfirmSubmit(true);
  };

  // Submit ke API setelah konfirmasi
  const handleConfirmedSubmit = async () => {
    if (!pendingSubmitData) return;

    setIsSubmitting(true);

    try {
      await api.post("work-orders", pendingSubmitData);

      // Reset work_orders_ready ke 0 saat membuat work order baru
      try {
        await api.patch(`tickets/${ticketId}`, {
          work_orders_ready: 0,
        });
      } catch (error) {
        console.error("Error resetting work_orders_ready:", error);
        // Continue anyway, work order was created successfully
      }

      // Jika ini adalah work order pertama (count = 0), update status tiket ke on_hold
      if (workOrderCount === 0 && ticketStatus === "in_progress") {
        try {
          await api.patch(`tickets/${ticketId}/status`, {
            status: "on_hold",
            notes: "Work order dibuat, tiket dalam status menunggu",
          });
        } catch (error) {
          console.error("Error updating ticket status:", error);
          // Continue anyway, work order was created successfully
        }
      }

      toast.success("Work order berhasil dibuat");
      resetForm();
      setShowConfirmSubmit(false);
      setPendingSubmitData(null);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating work order:", error);
      toast.error(
        error.body?.message ||
          error.message ||
          "Terjadi kesalahan saat membuat work order"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close dialog
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  // Handle "Lanjutkan Perbaikan" - unlock selesaikan button
  const handleContinueRepair = async () => {
    setIsSubmitting(true);
    try {
      // Set flag work_orders_ready ke 1 (integer), jangan ubah status
      await api.patch(`tickets/${ticketId}`, {
        work_orders_ready: 1,
      });

      toast.success(
        "Perbaikan siap dilanjutkan. Tombol selesaikan sudah tersedia."
      );
      setShowContinueConfirm(false);
      onSuccess(); // Refresh parent
      onClose();
    } catch (error: any) {
      console.error("Error continuing repair:", error);
      toast.error(
        error.response?.data?.message || "Gagal melanjutkan perbaikan"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open BMN condition change dialog
  const openBMNConditionDialog = (workOrder: any) => {
    setSelectedWorkOrder(workOrder);
    setBmnCondition("");
    setShowBMNConditionDialog(true);
  };

  // Handle BMN condition change submission
  const handleChangeBMNCondition = async () => {
    if (!bmnCondition) {
      toast.error("Pilih kondisi BMN terlebih dahulu");
      return;
    }

    setIsChangingCondition(true);
    try {
      await api.patch(
        `work-orders/${selectedWorkOrder.id}/change-bmn-condition`,
        {
          asset_condition_change: bmnCondition,
        }
      );

      toast.success("Kondisi BMN berhasil diubah");
      setShowBMNConditionDialog(false);
      setBmnCondition("");
      setSelectedWorkOrder(null);
      fetchWorkOrders(); // Refresh work orders list
      onSuccess(); // Refresh parent
    } catch (error: any) {
      console.error("Error changing BMN condition:", error);
      toast.error(
        error.response?.data?.message || "Gagal mengubah kondisi BMN"
      );
    } finally {
      setIsChangingCondition(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-[90%] min-w-[80%] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>Kelola Work Order</DialogTitle>
            <DialogDescription>
              Lihat daftar work order yang ada dan buat work order baru untuk
              pengadaan sparepart, vendor eksternal, atau lisensi software
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
            {/* Loading State */}
            {isLoadingWorkOrders && (
              <div className="flex items-center justify-center py-4">
                <Spinner className="h-5 w-5 mr-2" />
                <span className="text-sm text-gray-600">
                  Memuat work order...
                </span>
              </div>
            )}

            {/* Daftar Work Order Existing */}
            {!isLoadingWorkOrders && workOrders && workOrders.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Daftar Work Order</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {workOrders.map((wo) => (
                    <Card key={wo.id} className="p-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {wo.type === "sparepart" && "📦 Sparepart"}
                            {wo.type === "vendor" && "🏭 Vendor"}
                            {wo.type === "license" && "🔑 Lisensi"}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              wo.status === "requested"
                                ? "bg-yellow-100 text-yellow-800"
                                : wo.status === "in_procurement"
                                ? "bg-blue-100 text-blue-800"
                                : wo.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : wo.status === "unsuccessful"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {wo.status === "requested"
                              ? "Diajukan"
                              : wo.status === "in_procurement"
                              ? "Dalam Pengadaan"
                              : wo.status === "completed"
                              ? "Selesai"
                              : wo.status === "unsuccessful"
                              ? "Tidak Berhasil"
                              : wo.status}
                          </span>
                        </div>
                        {wo.type === "sparepart" && wo.items && (
                          <div className="text-gray-600">
                            {Array.isArray(wo.items) ? (
                              wo.items.map((item: any, idx: number) => (
                                <div key={idx}>
                                  {item.name} x{item.quantity} {item.unit}
                                </div>
                              ))
                            ) : (
                              <div>{JSON.stringify(wo.items)}</div>
                            )}
                          </div>
                        )}
                        {wo.type === "vendor" && (
                          <div className="text-gray-600">
                            <div>
                              {wo.vendor_name} - {wo.vendor_contact}
                            </div>
                            {wo.vendor_description && (
                              <div className="text-xs">
                                {wo.vendor_description}
                              </div>
                            )}
                          </div>
                        )}
                        {wo.type === "license" && (
                          <div className="text-gray-600">
                            <div>{wo.license_name}</div>
                            {wo.license_description && (
                              <div className="text-xs">
                                {wo.license_description}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Tampilkan alasan jika unsuccessful */}
                        {wo.status === "unsuccessful" && wo.failure_reason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <span className="font-medium text-red-700">
                              Alasan Tidak Berhasil:
                            </span>
                            <p className="text-red-600 mt-1">
                              {wo.failure_reason}
                            </p>
                          </div>
                        )}

                        {/* Tampilkan kondisi BMN yang diubah */}
                        {wo.asset_condition_change && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                            <span className="font-medium text-amber-700">
                              Kondisi BMN Diubah:
                            </span>
                            <p className="text-amber-900 mt-1">
                              {wo.asset_condition_change}
                            </p>
                          </div>
                        )}

                        {/* Button untuk ubah kondisi BMN - hanya untuk sparepart/vendor yang unsuccessful */}
                        {wo.status === "unsuccessful" &&
                          (wo.type === "sparepart" || wo.type === "vendor") &&
                          !wo.asset_condition_change && (
                            <div className="mt-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openBMNConditionDialog(wo)}
                                className="text-xs w-full"
                              >
                                Ubah Kondisi BMN
                              </Button>
                            </div>
                          )}
                      </div>
                    </Card>
                  ))}
                </div>
                <hr />
              </div>
            )}

            <form
              id="work-order-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Pilih Tipe Work Order */}
              <div className="space-y-3">
                <Label>Tipe Work Order</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(val) => setType(val as any)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sparepart" id="sparepart" />
                    <Label
                      htmlFor="sparepart"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="h-4 w-4" />
                      Sparepart
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vendor" id="vendor" />
                    <Label
                      htmlFor="vendor"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="h-4 w-4" />
                      Vendor Eksternal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="license" id="license" />
                    <Label
                      htmlFor="license"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Key className="h-4 w-4" />
                      Lisensi Software
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Form Sparepart */}
              {type === "sparepart" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Daftar Sparepart</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addSparepart}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Sparepart
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {spareparts.map((sparepart, index) => (
                      <Card key={sparepart.id} className="pb-4">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-12">
                                  <Label
                                    htmlFor={`name-${sparepart.id}`}
                                    className="mb-2 block"
                                  >
                                    Nama Sparepart {index + 1}
                                  </Label>
                                  <Input
                                    id={`name-${sparepart.id}`}
                                    placeholder="Contoh: Hard Disk 1TB"
                                    value={sparepart.name}
                                    onChange={(e) =>
                                      updateSparepart(
                                        sparepart.id,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    required
                                  />
                                </div>
                                <div className="col-span-6">
                                  <Label
                                    htmlFor={`quantity-${sparepart.id}`}
                                    className="mb-2 block"
                                  >
                                    Jumlah
                                  </Label>
                                  <Input
                                    id={`quantity-${sparepart.id}`}
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    value={sparepart.quantity}
                                    onChange={(e) =>
                                      updateSparepart(
                                        sparepart.id,
                                        "quantity",
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    required
                                  />
                                </div>
                                <div className="col-span-6">
                                  <Label
                                    htmlFor={`unit-${sparepart.id}`}
                                    className="mb-2 block"
                                  >
                                    Unit
                                  </Label>
                                  <Input
                                    id={`unit-${sparepart.id}`}
                                    placeholder="Contoh: paket, buah, set"
                                    value={sparepart.unit}
                                    onChange={(e) =>
                                      updateSparepart(
                                        sparepart.id,
                                        "unit",
                                        e.target.value
                                      )
                                    }
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            {spareparts.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => removeSparepart(sparepart.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Vendor */}
              {type === "vendor" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vendor-name">Nama Vendor</Label>
                    <Input
                      id="vendor-name"
                      placeholder="Contoh: PT Teknologi Maju"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-contact">Kontak Vendor</Label>
                    <Input
                      id="vendor-contact"
                      placeholder="Contoh: 081234567890 / email@vendor.com"
                      value={vendorContact}
                      onChange={(e) => setVendorContact(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-description">
                      Deskripsi Pekerjaan
                    </Label>
                    <Textarea
                      id="vendor-description"
                      placeholder="Jelaskan pekerjaan yang akan dilakukan oleh vendor..."
                      value={vendorDescription}
                      onChange={(e) => setVendorDescription(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Form Lisensi */}
              {type === "license" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="license-name">Nama Lisensi</Label>
                    <Input
                      id="license-name"
                      placeholder="Contoh: Microsoft Office 365 Business"
                      value={licenseName}
                      onChange={(e) => setLicenseName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="license-description">
                      Deskripsi Lisensi
                    </Label>
                    <Textarea
                      id="license-description"
                      placeholder="Jelaskan detail lisensi yang dibutuhkan..."
                      value={licenseDescription}
                      onChange={(e) => setLicenseDescription(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Action Buttons - Sticky Footer */}
          <div className="flex flex-col gap-3 px-6 py-4 border-t bg-white flex-shrink-0">
            <Button
              type="submit"
              form="work-order-form"
              disabled={isSubmitting}
              className="w-full cursor-pointer"
            >
              {isSubmitting && <Spinner className="h-4 w-4 mr-2" />}
              {isSubmitting ? "Menyimpan..." : "Simpan Work Order"}
            </Button>

            {/* Check if all work orders are completed */}
            {workOrders.length > 0 && (
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white w-full cursor-pointer"
                onClick={() => setShowContinueConfirm(true)}
                disabled={
                  isSubmitting ||
                  !workOrders.every((wo) =>
                    ["completed", "unsuccessful"].includes(wo.status)
                  )
                }
              >
                {isSubmitting ? "Melanjutkan..." : "Lanjutkan Perbaikan"}
              </Button>
            )}
          </div>

          {/* Confirmation Dialog */}
          {showContinueConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-96">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Konfirmasi Lanjutkan Perbaikan
                    </h3>
                    <p className="text-sm text-gray-600">
                      Anda yakin ingin melanjutkan perbaikan? Pastikan semua
                      work order sudah diterima.
                    </p>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowContinueConfirm(false)}
                      disabled={isSubmitting}
                      className="cursor-pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                      onClick={handleContinueRepair}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Spinner className="h-4 w-4 mr-2" />}
                      Ya, Lanjutkan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Confirm Save Work Order Dialog */}
          <AlertDialog
            open={showConfirmSubmit}
            onOpenChange={setShowConfirmSubmit}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Konfirmasi Simpan Work Order
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin dengan isian data dalam perbaikan barang BMN
                  tersebut? Pastikan semua informasi sudah benar sebelum
                  menyimpan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Tipe Work Order:</strong>{" "}
                  {pendingSubmitData?.type === "sparepart"
                    ? "Sparepart"
                    : pendingSubmitData?.type === "vendor"
                    ? "Vendor"
                    : "Lisensi"}
                </p>
                {pendingSubmitData?.type === "sparepart" &&
                  pendingSubmitData?.items && (
                    <div>
                      <p>
                        <strong>Jumlah Item:</strong>{" "}
                        {pendingSubmitData.items.length}
                      </p>
                    </div>
                  )}
                {pendingSubmitData?.type === "vendor" && (
                  <p>
                    <strong>Vendor:</strong> {pendingSubmitData.vendor_name}
                  </p>
                )}
                {pendingSubmitData?.type === "license" && (
                  <p>
                    <strong>Lisensi:</strong> {pendingSubmitData.license_name}
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <AlertDialogCancel
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmedSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  {isSubmitting && <Spinner className="h-4 w-4 mr-2" />}
                  Ya, Simpan Work Order
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </DialogContent>
      </Dialog>

      {/* Dialog Ubah Kondisi BMN */}
      <AlertDialog
        open={showBMNConditionDialog}
        onOpenChange={setShowBMNConditionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah Kondisi BMN</AlertDialogTitle>
            <AlertDialogDescription>
              Work order untuk{" "}
              {selectedWorkOrder?.type === "sparepart" ? "sparepart" : "vendor"}{" "}
              tidak berhasil. Pilih kondisi baru untuk barang BMN terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Label className="mb-3 block">Pilih Kondisi Baru BMN</Label>
            <RadioGroup value={bmnCondition} onValueChange={setBmnCondition}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Rusak Ringan" id="rusak-ringan" />
                <Label
                  htmlFor="rusak-ringan"
                  className="font-normal cursor-pointer"
                >
                  Rusak Ringan
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Rusak Berat" id="rusak-berat" />
                <Label
                  htmlFor="rusak-berat"
                  className="font-normal cursor-pointer"
                >
                  Rusak Berat
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={isChangingCondition}>
              Batal
            </AlertDialogCancel>
            <Button
              onClick={handleChangeBMNCondition}
              disabled={isChangingCondition || !bmnCondition}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isChangingCondition && <Spinner className="h-4 w-4 mr-2" />}
              {isChangingCondition ? "Menyimpan..." : "Ubah Kondisi"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
