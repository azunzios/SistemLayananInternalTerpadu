import React, { useState } from "react";
import { KartuKendaliList } from "@/components/views/shared/kartu-kendali-list";
import { KartuKendaliDetail } from "@/components/views/shared/kartu-kendali-detail";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resolveApiUrl } from "@/lib/api";
import type { User } from "@/types";

interface ReportsViewProps {
  currentUser: User;
}

export const ReportsView: React.FC<ReportsViewProps> = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Export semua kartu kendali ke Excel
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await fetch(resolveApiUrl("/kartu-kendali/export"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `kartu_kendali_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Berhasil mengexport Kartu Kendali");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengexport data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            Kartu Kendali
          </h1>
          <p className="text-gray-500">
            Riwayat pemeliharaan aset yang telah selesai
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline" // Gunakan variant bawaan shadcn untuk base style
          className="rounded-full gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          ) : (
            // Menggunakan ikon FileSpreadsheet lebih spesifik untuk Excel dibanding Download biasa
            <Download className="h-4 w-4 text-slate-500" />
          )}
          <span>Unduh Laporan (.xlsx)</span>
        </Button>
      </div>

      <KartuKendaliList
        onViewDetail={(ticketId) => {
          setSelectedTicketId(ticketId);
          setShowDetailDialog(true);
        }}
      />

      <KartuKendaliDetail
        isOpen={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          setSelectedTicketId(null);
        }}
        ticketId={selectedTicketId}
      />
    </div>
  );
};
