import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Users, Key, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

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
  onSuccess: () => void;
}

export const WorkOrderForm: React.FC<WorkOrderFormProps> = ({
  isOpen,
  onClose,
  ticketId,
  onSuccess,
}) => {
  const [type, setType] = useState<"sparepart" | "vendor" | "license">(
    "sparepart"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    try {
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

      await api.post("work-orders", requestData);

      toast.success("Work order berhasil dibuat");
      resetForm();
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Work Order</DialogTitle>
          <DialogDescription>
            Buat work order untuk pengadaan sparepart, vendor eksternal, atau
            lisensi software
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Card key={sparepart.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-12">
                              <Label htmlFor={`name-${sparepart.id}`}>
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
                              <Label htmlFor={`quantity-${sparepart.id}`}>
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
                              <Label htmlFor={`unit-${sparepart.id}`}>
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
                <Label htmlFor="vendor-description">Deskripsi Pekerjaan</Label>
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
                <Label htmlFor="license-description">Deskripsi Lisensi</Label>
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Work Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
