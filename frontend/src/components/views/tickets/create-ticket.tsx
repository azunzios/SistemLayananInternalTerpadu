import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Wrench,
  Video,
  ArrowLeft,
  X,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User, TicketType, SeverityLevel } from "@/types";

interface CreateTicketProps {
  currentUser: User;
  ticketType: TicketType;
  onTicketCreated: () => void;
  onCancel: () => void;
}

export const CreateTicket: React.FC<CreateTicketProps> = ({
  currentUser,
  ticketType,
  onTicketCreated,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "normal" as SeverityLevel,

    // Perbaikan - New fields
    assetCode: "", // Kode Barang
    assetNUP: "", // NUP
    assetLocation: "", // Lokasi (manual input)

    // Zoom Meeting
    meetingDate: "",
    startTime: "",
    endTime: "",
    estimatedParticipants: 10,
    coHostName: "",
    breakoutRooms: 0,
    unitKerja: currentUser.unitKerja,
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Asset check state
  const [assetInfo, setAssetInfo] = useState<any>(null);
  const [isCheckingAsset, setIsCheckingAsset] = useState(false);
  const [assetChecked, setAssetChecked] = useState(false);

  const getTicketIcon = () => {
    switch (ticketType) {
      case "perbaikan":
        return Wrench;
      case "zoom_meeting":
        return Video;
      default:
        return Wrench;
    }
  };

  const getTicketTitle = () => {
    switch (ticketType) {
      case "perbaikan":
        return "Ajukan Perbaikan Barang";
      case "zoom_meeting":
        return "Booking Zoom Meeting";
      default:
        return "Buat Tiket";
    }
  };

  const handleAssetCheck = async () => {
    if (!formData.assetCode.trim() || !formData.assetNUP.trim()) {
      toast.error("Mohon isi kode barang dan NUP terlebih dahulu");
      return;
    }

    setIsCheckingAsset(true);
    setAssetInfo(null);
    setAssetChecked(false);

    try {
      const assetCheck = await api.get<any>(
        `/assets/search/by-code-nup?asset_code=${encodeURIComponent(
          formData.assetCode
        )}&asset_nup=${encodeURIComponent(formData.assetNUP)}`
      );

      if (assetCheck && assetCheck.asset) {
        setAssetInfo(assetCheck.asset);
        setAssetChecked(true);

        // Auto-fill location if available
        if (assetCheck.asset.location && !formData.assetLocation) {
          setFormData((prev) => ({
            ...prev,
            assetLocation: assetCheck.asset.location,
          }));
        }

        toast.success("Barang ditemukan! Silakan lanjutkan pengajuan tiket.");
      } else {
        toast.error("Barang dengan kode dan NUP ini tidak ditemukan");
        setAssetChecked(false);
      }
    } catch (err: any) {
      console.error("Asset check failed:", err);
      const errorMsg =
        err?.body?.message || "Gagal memeriksa barang. Silakan coba lagi.";
      toast.error(errorMsg);
      setAssetChecked(false);
    } finally {
      setIsCheckingAsset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Judul harus diisi");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Deskripsi harus diisi");
      return;
    }

    // Type-specific validation
    if (ticketType === "perbaikan") {
      if (
        !formData.assetCode ||
        !formData.assetNUP ||
        !formData.assetLocation
      ) {
        toast.error("Mohon lengkapi semua field yang wajib diisi");
        return;
      }

      if (!assetChecked) {
        toast.error(
          'Mohon cek barang terlebih dahulu dengan tombol "Cek Barang"'
        );
        return;
      }
    }

    if (ticketType === "zoom_meeting") {
      if (!formData.coHostName) {
        toast.error("Nama penerima akses co-host harus diisi");
        return;
      }

      if (!formData.meetingDate) {
        toast.error("Tanggal meeting harus dipilih");
        return;
      }

      if (!formData.startTime || !formData.endTime) {
        toast.error("Waktu mulai dan waktu selesai harus diisi");
        return;
      }

      // Validate start time is before end time
      const [startHour, startMin] = formData.startTime.split(":").map(Number);
      const [endHour, endMin] = formData.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        toast.error("Waktu selesai harus lebih besar dari waktu mulai");
        return;
      }

      if (formData.estimatedParticipants < 2) {
        toast.error("Jumlah peserta minimal 2 orang");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.append("type", ticketType);
      form.append("title", formData.title);
      form.append("description", formData.description);

      if (ticketType === "perbaikan") {
        form.append("kode_barang", formData.assetCode);
        form.append("nup", formData.assetNUP);
        if (formData.assetLocation)
          form.append("asset_location", formData.assetLocation);
        form.append("severity", formData.severity);
        attachments.forEach((file) => form.append("attachments[]", file));
      } else if (ticketType === "zoom_meeting") {
        form.append("zoom_date", formData.meetingDate);
        form.append("zoom_start_time", formData.startTime);
        form.append("zoom_end_time", formData.endTime);
        form.append(
          "zoom_estimated_participants",
          String(formData.estimatedParticipants)
        );
        form.append("zoom_breakout_rooms", String(formData.breakoutRooms));
        if (formData.coHostName) {
          form.append(
            "zoom_co_hosts",
            JSON.stringify([
              { name: formData.coHostName, email: currentUser.email },
            ])
          );
        }
        attachments.forEach((file) => form.append("zoom_attachments[]", file));
      }

      const response = await api.post<any>("/tickets", form);

      toast.success(
        `Tiket berhasil dibuat! Nomor tiket: ${response?.ticketNumber || "N/A"}`
      );
      setIsSubmitting(false);
      setAttachments([]);

      // Refresh ticket list by triggering callback
      onTicketCreated();
    } catch (error: any) {
      console.error("Failed to create ticket:", error);
      const errors = error?.body?.errors;
      let firstError =
        error?.body?.message || "Gagal membuat tiket. Silakan coba lagi.";
      if (errors && typeof errors === "object") {
        const firstKey = Object.keys(errors)[0];
        if (
          firstKey &&
          Array.isArray(errors[firstKey]) &&
          errors[firstKey][0]
        ) {
          firstError = errors[firstKey][0];
        }
      }
      toast.error(firstError);
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (attachments.length + newFiles.length > 5) {
        toast.error("Maksimal 5 file");
        return;
      }
      const oversized = newFiles.find((f) => f.size > 2 * 1024 * 1024);
      if (oversized) {
        toast.error("Ukuran file maksimal 2MB per file");
        return;
      }
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const Icon = getTicketIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onCancel}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <Card className="pb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>{getTicketTitle()}</CardTitle>
                <CardDescription>
                  Lengkapi form di bawah untuk mengajukan{" "}
                  {ticketType.replace("_", " ")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Common Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {ticketType === "zoom_meeting"
                      ? "Judul Meeting *"
                      : "Judul *"}
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder={
                      ticketType === "perbaikan"
                        ? "Contoh: Laptop tidak bisa booting"
                        : "Contoh: Rapat Koordinasi Tim"
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {ticketType === "zoom_meeting"
                      ? "Deskripsi Peminjaman Zoom *"
                      : "Deskripsi Detail *"}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={
                      ticketType === "zoom_meeting"
                        ? "Jelaskan tujuan dan agenda meeting..."
                        : "Jelaskan detail masalah..."
                    }
                    rows={4}
                    required
                  />
                </div>

                {ticketType === "perbaikan" && (
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioritas *</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value: SeverityLevel) =>
                        setFormData({ ...formData, severity: value })
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">
                          Critical (Genting)
                        </SelectItem>
                        <SelectItem value="high">
                          High
                        </SelectItem>
                        <SelectItem value="normal">
                          Normal
                        </SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Pilih prioritas sesuai tingkat urgensi perbaikan
                    </p>
                  </div>
                )}
              </div>

              {/* Type-specific Fields */}
              {ticketType === "perbaikan" && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Informasi Barang BMN</h3>

                  <div className="space-y-2">
                    <Label htmlFor="assetCode">Kode Barang *</Label>
                    <Input
                      id="assetCode"
                      value={formData.assetCode}
                      onChange={(e) => {
                        setFormData({ ...formData, assetCode: e.target.value });
                        setAssetChecked(false);
                        setAssetInfo(null);
                      }}
                      placeholder="Contoh: KB-2024-001"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Ketik kode barang BMN yang akan diperbaiki
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetNUP">
                      NUP (Nomor Urut Pendaftaran) *
                    </Label>
                    <Input
                      id="assetNUP"
                      value={formData.assetNUP}
                      onChange={(e) => {
                        setFormData({ ...formData, assetNUP: e.target.value });
                        setAssetChecked(false);
                        setAssetInfo(null);
                      }}
                      placeholder="Contoh: 000001"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Nomor urut pendaftaran barang
                    </p>
                  </div>

                  {/* Asset Check Button */}
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAssetCheck}
                      disabled={
                        isCheckingAsset ||
                        !formData.assetCode.trim() ||
                        !formData.assetNUP.trim()
                      }
                      className="w-full"
                    >
                      {isCheckingAsset ? "Memeriksa..." : "Cek Barang"}
                    </Button>

                    {/* Asset Information Display */}
                    {assetInfo && assetChecked && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-green-800 font-semibold">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Barang Ditemukan
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Nama Barang:</span>
                            <p className="font-medium">
                              {assetInfo.asset_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Merk/Tipe:</span>
                            <p className="font-medium">
                              {assetInfo.merek || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Kondisi:</span>
                            <p className="font-medium">
                              {assetInfo.condition || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">
                              Lokasi Terdaftar:
                            </span>
                            <p className="font-medium">
                              {assetInfo.location || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetLocation">Lokasi Barang *</Label>
                    <Input
                      id="assetLocation"
                      value={formData.assetLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          assetLocation: e.target.value,
                        })
                      }
                      placeholder="Contoh: Ruang TU, Lantai 2"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Ketik lokasi barang saat ini
                    </p>
                  </div>
                </div>
              )}

              {ticketType === "zoom_meeting" && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Detail Booking Zoom</h3>

                  <div className="space-y-2">
                    <Label htmlFor="meetingDate">Tanggal Meeting *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            selectedDate.toLocaleDateString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          ) : (
                            <span className="text-gray-500">
                              Pilih tanggal meeting
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            if (date) {
                              const dateStr = date.toISOString().split("T")[0];
                              setFormData({
                                ...formData,
                                meetingDate: dateStr,
                              });
                            }
                          }}
                          disabled={(date) => {
                            // Disable past dates
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-gray-500">
                      Pilih tanggal pelaksanaan meeting
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Waktu Mulai *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startTime: e.target.value,
                            })
                          }
                          className="pl-10"
                          min="07:00"
                          max="17:00"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Jam operasional: 07:00 - 17:00
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">Waktu Selesai *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endTime: e.target.value,
                            })
                          }
                          className="pl-10"
                          min="07:00"
                          max="17:00"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Jam operasional: 07:00 - 17:00
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coHostName">
                      Nama Penerima Akses Co-Host *
                    </Label>
                    <Input
                      id="coHostName"
                      value={formData.coHostName}
                      onChange={(e) =>
                        setFormData({ ...formData, coHostName: e.target.value })
                      }
                      placeholder="Contoh: Budi Santoso"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Nama lengkap orang yang akan menjadi co-host meeting
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="breakoutRooms">
                        Jumlah Breakout Room *
                      </Label>
                      <Input
                        id="breakoutRooms"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.breakoutRooms}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            breakoutRooms: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Isikan 0 jika tidak memerlukan breakout room
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedParticipants">
                        Jumlah Peserta Zoom *
                      </Label>
                      <Input
                        id="estimatedParticipants"
                        type="number"
                        min="2"
                        max="300"
                        value={formData.estimatedParticipants}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estimatedParticipants:
                              parseInt(e.target.value) || 10,
                          })
                        }
                        placeholder="10"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Estimasi jumlah peserta yang akan hadir
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments */}
              <div className="space-y-3 border-t pt-4">
                <Label>Upload File Pendukung (Opsional)</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Maksimal 5 file. Format: JPG, PNG, PDF, DOC (Maks 2MB per
                    file)
                  </p>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm truncate flex-1">
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="flex-1 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 cursor-pointer"
                >
                  {isSubmitting ? "Mengirim..." : "Ajukan Tiket"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
