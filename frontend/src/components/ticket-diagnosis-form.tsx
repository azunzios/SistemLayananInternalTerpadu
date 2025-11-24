import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { TicketDiagnosis } from "../types";

interface TicketDiagnosisFormProps {
  ticketId: string;
  ticketNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingDiagnosis?: TicketDiagnosis | null;
  onDiagnosisSubmitted: () => void;
  onCreateWorkOrder?: (type: "sparepart" | "vendor" | "license") => void;
}

export const TicketDiagnosisForm: React.FC<TicketDiagnosisFormProps> = ({
  ticketId,
  ticketNumber,
  open,
  onOpenChange,
  existingDiagnosis,
  onDiagnosisSubmitted,
  onCreateWorkOrder,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    problem_description: "",
    problem_category: "hardware" as "hardware" | "software" | "lainnya",
    repair_type: "direct_repair" as
      | "direct_repair"
      | "need_sparepart"
      | "need_vendor"
      | "need_license"
      | "unrepairable",
    repair_description: "",
    unrepairable_reason: "",
    alternative_solution: "",
    technician_notes: "",
  });

  useEffect(() => {
    if (existingDiagnosis) {
      setFormData({
        problem_description: existingDiagnosis.problemDescription || "",
        problem_category: existingDiagnosis.problemCategory || "hardware",
        repair_type: existingDiagnosis.repairType || "direct_repair",
        repair_description: existingDiagnosis.repairDescription || "",
        unrepairable_reason: existingDiagnosis.unrepairableReason || "",
        alternative_solution: existingDiagnosis.alternativeSolution || "",
        technician_notes: existingDiagnosis.technicianNotes || "",
      });
    }
  }, [existingDiagnosis]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.problem_description.trim()) {
      toast.error("Deskripsi masalah harus diisi");
      return;
    }

    if (
      formData.repair_type === "direct_repair" &&
      !formData.repair_description.trim()
    ) {
      toast.error("Deskripsi perbaikan harus diisi");
      return;
    }

    if (
      formData.repair_type === "unrepairable" &&
      !formData.unrepairable_reason.trim()
    ) {
      toast.error("Alasan tidak dapat diperbaiki harus diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post(
        `tickets/${ticketId}/diagnosis`,
        formData
      );

      toast.success("Diagnosis berhasil disimpan");

      // Check if needs work order
      if (
        ["need_sparepart", "need_vendor", "need_license"].includes(
          formData.repair_type
        )
      ) {
        onOpenChange(false);
        onDiagnosisSubmitted();

        // Open work order form
        if (onCreateWorkOrder) {
          const woType =
            formData.repair_type === "need_sparepart"
              ? "sparepart"
              : formData.repair_type === "need_vendor"
              ? "vendor"
              : "license";
          onCreateWorkOrder(woType);
        }
      } else {
        onOpenChange(false);
        onDiagnosisSubmitted();
      }
    } catch (error: any) {
      console.error("Failed to submit diagnosis:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan diagnosis");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Form Diagnosa Barang - {ticketNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Identifikasi Masalah */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identifikasi Masalah</CardTitle>
                <CardDescription>
                  Jelaskan masalah yang ditemukan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="problem_description">
                    Deskripsi Masalah *
                  </Label>
                  <Textarea
                    id="problem_description"
                    placeholder="Jelaskan masalah yang ditemukan secara detail..."
                    value={formData.problem_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        problem_description: e.target.value,
                      })
                    }
                    rows={4}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Kategori Masalah *</Label>
                  <RadioGroup
                    value={formData.problem_category}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, problem_category: value })
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hardware" id="hw" />
                      <Label
                        htmlFor="hw"
                        className="font-normal cursor-pointer"
                      >
                        Hardware
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="software" id="sw" />
                      <Label
                        htmlFor="sw"
                        className="font-normal cursor-pointer"
                      >
                        Software
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lainnya" id="other" />
                      <Label
                        htmlFor="other"
                        className="font-normal cursor-pointer"
                      >
                        Lainnya
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Hasil Diagnosis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hasil Diagnosis</CardTitle>
                <CardDescription>
                  Tentukan jenis perbaikan yang diperlukan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Dapat Diperbaiki? *</Label>
                  <RadioGroup
                    value={formData.repair_type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, repair_type: value })
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="direct_repair" id="direct" />
                      <Label
                        htmlFor="direct"
                        className="font-normal cursor-pointer"
                      >
                        Bisa diperbaiki langsung
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="need_sparepart" id="sparepart" />
                      <Label
                        htmlFor="sparepart"
                        className="font-normal cursor-pointer"
                      >
                        Butuh Sparepart
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="need_vendor" id="vendor" />
                      <Label
                        htmlFor="vendor"
                        className="font-normal cursor-pointer"
                      >
                        Butuh Vendor
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="need_license" id="license" />
                      <Label
                        htmlFor="license"
                        className="font-normal cursor-pointer"
                      >
                        Butuh Lisensi
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unrepairable" id="unrepairable" />
                      <Label
                        htmlFor="unrepairable"
                        className="font-normal cursor-pointer"
                      >
                        Tidak dapat diperbaiki
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Jika bisa diperbaiki langsung */}
                {formData.repair_type === "direct_repair" && (
                  <div>
                    <Label htmlFor="repair_description">
                      Deskripsi Perbaikan *
                    </Label>
                    <Textarea
                      id="repair_description"
                      placeholder="Jelaskan apa yang akan/telah diperbaiki..."
                      value={formData.repair_description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          repair_description: e.target.value,
                        })
                      }
                      rows={3}
                      className="mt-1.5"
                    />
                  </div>
                )}

                {/* Jika tidak dapat diperbaiki */}
                {formData.repair_type === "unrepairable" && (
                  <>
                    <div>
                      <Label htmlFor="unrepairable_reason">
                        Alasan Tidak Dapat Diperbaiki *
                      </Label>
                      <Textarea
                        id="unrepairable_reason"
                        placeholder="Jelaskan mengapa tidak dapat diperbaiki..."
                        value={formData.unrepairable_reason}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            unrepairable_reason: e.target.value,
                          })
                        }
                        rows={3}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="alternative_solution">
                        Solusi Alternatif
                      </Label>
                      <Textarea
                        id="alternative_solution"
                        placeholder="Saran solusi alternatif (ganti baru, pinjam unit, dll)..."
                        value={formData.alternative_solution}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alternative_solution: e.target.value,
                          })
                        }
                        rows={2}
                        className="mt-1.5"
                      />
                    </div>
                  </>
                )}

                {/* Info untuk work order */}
                {["need_sparepart", "need_vendor", "need_license"].includes(
                  formData.repair_type
                ) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Catatan:</strong> Setelah menyimpan diagnosis,
                      Anda akan diminta untuk mengisi Work Order untuk{" "}
                      {formData.repair_type === "need_sparepart" &&
                        "pengadaan sparepart"}
                      {formData.repair_type === "need_vendor" &&
                        "vendor eksternal"}
                      {formData.repair_type === "need_license" &&
                        "lisensi software"}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="technician_notes">Catatan Teknisi</Label>
                  <Textarea
                    id="technician_notes"
                    placeholder="Catatan tambahan..."
                    value={formData.technician_notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        technician_notes: e.target.value,
                      })
                    }
                    rows={2}
                    className="mt-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4 flex-shrink-0">
          <div className="flex gap-2 w-full justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              Simpan Diagnosis
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
