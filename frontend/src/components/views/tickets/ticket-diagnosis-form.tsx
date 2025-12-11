import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { TicketDiagnosis } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";

interface TicketDiagnosisFormProps {
  ticketId: string;
  ticketNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingDiagnosis?: TicketDiagnosis | null;
  onDiagnosisSubmitted: () => void;
  ticketStatus?: string;
  onRequestStatusChange?: (callback: () => Promise<void>) => void;
}

export const TicketDiagnosisForm: React.FC<TicketDiagnosisFormProps> = ({
  ticketId,
  ticketNumber,
  open,
  onOpenChange,
  existingDiagnosis,
  onDiagnosisSubmitted,
  ticketStatus,
  onRequestStatusChange,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);
  const [fetchedDiagnosis, setFetchedDiagnosis] =
    useState<TicketDiagnosis | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationType, setConfirmationType] = useState<"change" | "save">(
    "save"
  );

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
    estimasi_hari: "",
    asset_condition_change: "",
  });

  // Fetch diagnosis data dari backend saat modal dibuka
  useEffect(() => {
    if (open && ticketId) {
      fetchDiagnosisData();
    }
  }, [open, ticketId]);

  const fetchDiagnosisData = async () => {
    setIsLoadingDiagnosis(true);
    try {
      const response: any = await api.get(`/tickets/${ticketId}/diagnosis`);
      if (response?.success && response?.data) {
        const data = response.data;
        setFetchedDiagnosis(data);
        setFormData({
          problem_description: data.problem_description || "",
          problem_category: data.problem_category || "hardware",
          repair_type: data.repair_type || "direct_repair",
          repair_description: data.repair_description || "",
          unrepairable_reason: data.unrepairable_reason || "",
          alternative_solution: data.alternative_solution || "",
          technician_notes: data.technician_notes || "",
          estimasi_hari: data.estimasi_hari || "",
          asset_condition_change: data.asset_condition_change || "",
        });
      }
    } catch (error) {
      console.error("Error fetching diagnosis data:", error);
      // Form stays empty if no diagnosis exists yet
    } finally {
      setIsLoadingDiagnosis(false);
    }
  };

  // Fallback ke existingDiagnosis jika di-pass sebagai prop
  useEffect(() => {
    if (!fetchedDiagnosis && existingDiagnosis) {
      setFormData({
        problem_description: existingDiagnosis.problem_description || "",
        problem_category: existingDiagnosis.problem_category || "hardware",
        repair_type: existingDiagnosis.repair_type || "direct_repair",
        repair_description: existingDiagnosis.repair_description || "",
        unrepairable_reason: existingDiagnosis.unrepairable_reason || "",
        alternative_solution: existingDiagnosis.alternative_solution || "",
        technician_notes: existingDiagnosis.technician_notes || "",
        estimasi_hari: existingDiagnosis.estimasi_hari || "",
        asset_condition_change: existingDiagnosis.asset_condition_change || "",
      });
    }
  }, [existingDiagnosis, fetchedDiagnosis]);

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
      !formData.unrepairable_reason
    ) {
      toast.error("Alasan tidak dapat diperbaiki harus diisi");
      return;
    }

    // Check if diagnosis is being changed (not first time)
    if (fetchedDiagnosis) {
      setConfirmationType("change");
      setShowConfirmDialog(true);
    } else {
      // First time saving diagnosis
      setConfirmationType("save");
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);

    // Tutup form diagnosis SEBELUM submit untuk mencegah perubahan state yang tidak konsisten
    // saat refresh terjadi
    onOpenChange(false);

    // If status is assigned, show status change confirmation dialog before submitting
    if (ticketStatus === "assigned" && onRequestStatusChange) {
      onRequestStatusChange(performDiagnosisSubmit);
      return;
    }

    // Otherwise submit directly
    await performDiagnosisSubmit();
  };

  const performDiagnosisSubmit = async () => {
    setIsSubmitting(true);

    try {
      await api.post(`tickets/${ticketId}/diagnosis`, formData);

      toast.success("Diagnosis berhasil disimpan");

      // Panggil callback untuk update parent state (akan trigger refresh)
      onDiagnosisSubmitted();
    } catch (error: any) {
      console.error("Failed to submit diagnosis:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan diagnosis");
      // Jika gagal, buka kembali form diagnosis
      onOpenChange(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="md:max-w-full max-md:!w-[90vw] md:min-w-2xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <DialogTitle className="flex flex-col justify-start align-start">
                Form Diagnosis Barang <div className="text-left"> {ticketNumber} </div>
              </DialogTitle>
            </div>
            <div className="flex items-center gap-3">
              {formData.repair_type === "unrepairable" && (
                <div className="bg-red-100 border border-red-300 text-red-700 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  Tidak Dapat Diperbaiki
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoadingDiagnosis ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col justify-center items-center gap-4">
                  <Spinner />
                  <p className="text-sm text-gray-600">Memuat diagnosis...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Identifikasi Masalah */}
                <Card className="pb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Identifikasi Masalah
                    </CardTitle>
                    <CardDescription className="text-sm">
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

                    <Separator className="my-4" />

                    <div>
                      <Label className="mb-3 block font-semibold">Kategori Masalah *</Label>
                      <RadioGroup
                        value={formData.problem_category}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, problem_category: value })
                        }
                        className="space-y-2"
                      >
                        <div 
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.problem_category === 'hardware' 
                              ? 'bg-orange-300 border-orange-400' 
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, problem_category: 'hardware' })}
                        >
                          <RadioGroupItem value="hardware" id="hw" />
                          <Label
                            htmlFor="hw"
                            className="font-normal cursor-pointer flex-1"
                          >
                            Hardware
                          </Label>
                        </div>
                        <div 
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.problem_category === 'software' 
                              ? 'bg-orange-300 border-orange-400' 
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, problem_category: 'software' })}
                        >
                          <RadioGroupItem value="software" id="sw" />
                          <Label
                            htmlFor="sw"
                            className="font-normal cursor-pointer flex-1"
                          >
                            Software
                          </Label>
                        </div>
                        <div 
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.problem_category === 'lainnya' 
                              ? 'bg-orange-300 border-orange-400' 
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, problem_category: 'lainnya' })}
                        >
                          <RadioGroupItem value="lainnya" id="other" />
                          <Label
                            htmlFor="other"
                            className="font-normal cursor-pointer flex-1"
                          >
                            Lainnya
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>

                <Separator className="my-2" />

                {/* Hasil Diagnosis */}
                <Card className="pb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Hasil Diagnosis</CardTitle>
                    <CardDescription className="text-sm">
                      Tentukan jenis perbaikan yang diperlukan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="mb-3 block font-semibold">Dapat Diperbaiki? *</Label>
                      <RadioGroup
                        value={formData.repair_type}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, repair_type: value })
                        }
                        className="space-y-2"
                      >
                        <div 
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.repair_type === 'direct_repair' 
                              ? 'bg-orange-300 border-orange-400' 
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, repair_type: 'direct_repair' })}
                        >
                          <RadioGroupItem value="direct_repair" id="direct" />
                          <Label
                            htmlFor="direct"
                            className="font-normal cursor-pointer flex-1"
                          >
                            Bisa diperbaiki langsung
                          </Label>
                        </div>
                        <div 
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.repair_type === 'need_sparepart' 
                              ? 'bg-orange-300 border-orange-400' 
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, repair_type: 'need_sparepart' })}
                        >
                          <RadioGroupItem
                            value="need_sparepart"
                            id="sparepart"
                          />
                          <Label
                            htmlFor="sparepart"
                            className="font-normal cursor-pointer flex-1"
                          >
                            Butuh Sparepart
                          </Label>
                        </div>
                        <div 
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.repair_type === 'need_vendor' 
                              ? 'bg-orange-300 border-orange-400' 
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, repair_type: 'need_vendor' })}
                        >
                          <RadioGroupItem value="need_vendor" id="vendor" />
                          <Label
                            htmlFor="vendor"
                            className="font-normal cursor-pointer flex-1"
                          >
                            Butuh Vendor
                          </Label>
                        </div>
                        <div 
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.repair_type === 'need_license' 
                              ? 'bg-orange-300 border-orange-400' 
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, repair_type: 'need_license' })}
                        >
                          <RadioGroupItem value="need_license" id="license" />
                          <Label
                            htmlFor="license"
                            className="font-normal cursor-pointer flex-1"
                          >
                            Butuh Lisensi
                          </Label>
                        </div>
                        <div 
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.repair_type === 'unrepairable' 
                              ? 'bg-orange-300 border-orange-400' 
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, repair_type: 'unrepairable' })}
                        >
                          <RadioGroupItem
                            value="unrepairable"
                            id="unrepairable"
                          />
                          <Label
                            htmlFor="unrepairable"
                            className="font-normal cursor-pointer flex-1"
                          >
                            Tidak dapat diperbaiki
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Separator className="my-4" />

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

                        <Separator className="my-4" />

                        <div>
                          <Label htmlFor="asset_condition_change" className="font-semibold mb-3 block">
                            Ubah Kondisi BMN (Opsional)
                          </Label>
                          <RadioGroup
                            value={formData.asset_condition_change}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                asset_condition_change: value,
                              })
                            }
                            className="space-y-2"
                          >
                            <div 
                              className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                formData.asset_condition_change === 'Rusak Ringan' 
                                  ? 'bg-orange-300 border-orange-400' 
                                  : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                              }`}
                              onClick={() => setFormData({ ...formData, asset_condition_change: 'Rusak Ringan' })}
                            >
                              <RadioGroupItem
                                value="Rusak Ringan"
                                id="rusak_ringan"
                              />
                              <Label
                                htmlFor="rusak_ringan"
                                className="font-normal cursor-pointer flex-1"
                              >
                                Rusak Ringan
                              </Label>
                            </div>
                            <div 
                              className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                formData.asset_condition_change === 'Rusak Berat' 
                                  ? 'bg-orange-300 border-orange-400' 
                                  : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                              }`}
                              onClick={() => setFormData({ ...formData, asset_condition_change: 'Rusak Berat' })}
                            >
                              <RadioGroupItem
                                value="Rusak Berat"
                                id="rusak_berat"
                              />
                              <Label
                                htmlFor="rusak_berat"
                                className="font-normal cursor-pointer flex-1"
                              >
                                Rusak Berat
                              </Label>
                            </div>
                          </RadioGroup>
                          <p className="text-xs text-muted-foreground mt-2">
                            Kondisi BMN akan otomatis diubah di database asset
                          </p>
                        </div>

                        <Separator className="my-4" />

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
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
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

                    <Separator className="my-4" />

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

                    <div>
                      <Label htmlFor="estimasi_hari">
                        Estimasi Hari Pengerjaan
                      </Label>
                      <Input
                        id="estimasi_hari"
                        placeholder="Contoh: 2 hari, 1 minggu, dll"
                        value={formData.estimasi_hari}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estimasi_hari: e.target.value,
                          })
                        }
                        className="mt-1.5"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="border-t px-6 py-4 flex-shrink-0">
            <div className="flex gap-2 w-full justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                <Send className="h-4 w-4 mr-2" />
                Simpan Diagnosis
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmationType === "change"
                ? "Ubah Diagnosis?"
                : "Simpan Diagnosis?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationType === "change"
                ? "Anda akan mengubah diagnosis yang sudah ada sebelumnya. Pastikan informasi baru sudah benar."
                : "Diagnosis akan disimpan dan status tiket akan berubah ke 'In Progress'. Pastikan semua data sudah benar."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              className="cursor-pointer"
            >
              {confirmationType === "change"
                ? "Ya, Ubah Diagnosis"
                : "Ya, Simpan Diagnosis"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
