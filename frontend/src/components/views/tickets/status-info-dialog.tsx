import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Video, Info, CheckCircle2, Clock, Loader2, X, Circle } from "lucide-react";

interface StatusInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StatusInfoDialog: React.FC<StatusInfoDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden outline-none">

        {/* === STICKY HEADER === */}
        <DialogHeader
          className="
            p-4 sm:p-6 border-b bg-background z-10 relative
            flex flex-row items-start justify-between space-y-0
            gap-2 text-left
          "
        >
          {/* Container Teks: Gunakan flex-1 agar mengambil sisa ruang sebelah kiri */}
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary shrink-0" />
              <DialogTitle className="leading-tight">Penjelasan Status Tiket</DialogTitle>
            </div>
            <DialogDescription>
              Panduan lengkap mengenai alur status tiket.
            </DialogDescription>
          </div>

          {/* Tombol X Close: Hapus absolute, gunakan flex normal agar rapi */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>


        {/* === SCROLLABLE CONTENT === */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">

          {/* BAGIAN 1: PERBAIKAN */}
          <section>
            {/* Header Section Icon */}
            <div className="flex items-center gap-3 z-10 relative">
              <div className="h-9 w-9 flex items-center justify-center bg-orange-100 rounded-lg shrink-0">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">
                Tiket Perbaikan
              </h3>
            </div>

            {/* Content dengan Garis Vertikal */}
            <div className="ml-[1.125rem] pl-8 border-l-2 border-orange-100 pt-6 pb-2 grid gap-6">

              {/* Item: Pending */}
              <div className="relative">
                <div className="absolute -left-[37px] top-1 h-2.5 w-2.5 rounded-full bg-orange-200 border border-white"></div>

                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm">Pending</span>
                  <Badge variant="outline" className="text-[10px] bg-slate-50">submitted</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tiket baru menunggu antrean teknisi.
                </p>
              </div>

              {/* Item: Diproses */}
              <div className="relative">
                <div className="absolute -left-[37px] top-1 h-2.5 w-2.5 rounded-full bg-orange-200 border border-white"></div>

                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin-slow" />
                  <span className="font-medium text-foreground text-sm">Diproses</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Sedang ditangani teknisi dengan status:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <StatusBadge label="assigned" desc="Ditugaskan" color="bg-blue-50 text-blue-700 border-blue-200" />
                  <StatusBadge label="in_progress" desc="Dikerjakan" color="bg-blue-50 text-blue-700 border-blue-200" />
                  <StatusBadge label="on_hold" desc="Menunggu part" color="bg-yellow-50 text-yellow-700 border-yellow-200" />
                  <StatusBadge label="waiting for submitter..." desc="menunggu submitter untuk mengonfirmasi" color="bg-orange-50 text-orange-700 border-orange-200" />
                </div>
              </div>

              {/* Item: Selesai */}
              <div className="relative">
                <div className="absolute -left-[37px] top-1 h-2.5 w-2.5 rounded-full bg-orange-400 border border-white"></div>

                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-foreground text-sm">Selesai</span>
                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">closed</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Perbaikan selesai dan tiket ditutup.
                </p>
              </div>
            </div>
          </section>

          {/* BAGIAN 2: ZOOM MEETING */}
          <section>
            {/* Header Section Icon */}
            <div className="flex items-center gap-3 z-10 relative">
              <div className="h-9 w-9 flex items-center justify-center bg-purple-100 rounded-lg shrink-0">
                <Video className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">
                Tiket Zoom Meeting
              </h3>
            </div>

            {/* Content dengan Garis Vertikal */}
            <div className="ml-[1.125rem] pl-8 border-l-2 border-purple-100 pt-6 pb-2 grid gap-6">

              {/* Item: Review */}
              <div className="relative">
                <div className="absolute -left-[37px] top-1 h-2.5 w-2.5 rounded-full bg-purple-200 border border-white"></div>

                <div className="flex items-center gap-2 mb-1">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm">Review</span>
                  <Badge variant="outline" className="text-[10px] bg-slate-50">pending_review</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Menunggu pengecekan jadwal oleh admin.
                </p>
              </div>

              {/* Item: Keputusan */}
              <div className="relative">
                <div className="absolute -left-[37px] top-1 h-2.5 w-2.5 rounded-full bg-purple-400 border border-white"></div>

                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-foreground" />
                  <span className="font-medium text-foreground text-sm">Keputusan</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <StatusBadge label="approved" desc="Disetujui" color="bg-green-50 text-green-700 border-green-200" />
                  <StatusBadge label="rejected" desc="Ditolak" color="bg-red-50 text-red-700 border-red-200" />
                </div>
              </div>
            </div>
          </section>

        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper Badge Kecil
const StatusBadge = ({ label, desc, color }: { label: string; desc: string; color: string }) => (
  <div className={`flex flex-col items-start px-2 py-1.5 rounded border ${color} min-w-[100px]`}>
    <span className="font-mono text-[10px] font-bold uppercase mb-0.5">{label}</span>
    <span className="text-[10px] opacity-90 leading-tight">{desc}</span>
  </div>
);