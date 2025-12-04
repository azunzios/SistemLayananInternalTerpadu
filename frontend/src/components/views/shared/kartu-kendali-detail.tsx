import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Package,
  Building,
  CheckCircle,
  Stethoscope,
  User,
  Hash,
  KeyRound,
  X,
  FileText,
  Copy,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

// --- Interfaces ---
interface RelatedTicket {
  id: number;
  ticketNumber: string;
  title: string;
  status: string;
  createdAt: string | null;
}

interface DiagnosisData {
  problem_category: string | null;
  problem_description: string | null;
  repair_type: string | null;
  is_repairable: boolean;
  repair_description: string | null;
  unrepairable_reason: string | null;
  alternative_solution: string | null;
  technician_notes: string | null;
  estimasi_hari: string | null;
  diagnosed_at: string | null;
  technician_name: string | null;
}

// Sparepart item dari gabungan work orders
interface SparepartItem {
  name: string;
  quantity: number;
  completedAt: string | null;
  technicianName: string | null;
}

// Vendor item dengan catatan penyelesaian masing-masing
interface VendorItem {
  name: string | null;
  contact: string | null;
  description: string | null;
  completionNotes: string | null;
  completedAt: string | null;
  technicianName: string | null;
}

// License item
interface LicenseItem {
  name: string | null;
  description: string | null;
  completedAt: string | null;
  technicianName: string | null;
}

// Pending work order
interface PendingWorkOrder {
  id: number;
  type: string;
  status: string;
  createdAt: string | null;
}

// Data detail kartu kendali - info tiket perbaikan
interface KartuKendaliDetailData {
  id: number;
  ticketId: number;
  ticketNumber: string;
  ticketTitle: string;
  ticketStatus: string;
  createdAt: string | null;
  closedAt: string | null;
  lastCompletedAt: string | null;
  assetCode: string | null;
  assetName: string | null;
  assetNup: string | null;
  maintenanceCount: number;
  relatedTickets: RelatedTicket[];
  // Gabungan semua work orders completed
  spareparts: SparepartItem[];
  vendors: VendorItem[];
  licenses: LicenseItem[];
  totalWorkOrders: number;
  completedWorkOrders: number;
  pendingWorkOrders: PendingWorkOrder[];
  // Diagnosis
  diagnosis: DiagnosisData | null;
  // Info
  requesterId: number;
  requesterName: string | null;
  technicianName: string | null;
}

// Helper untuk status badge
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    submitted: "Pending",
    assigned: "Ditugaskan",
    in_progress: "Diproses",
    on_hold: "Ditunda",
    waiting_for_submitter: "Menunggu User",
    closed: "Selesai",
  };
  return map[status] || status;
};

interface KartuKendaliDetailProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
}

// --- Helper Components ---

// UPDATED: Menggunakan Grid agar Key dan Value lurus sempurna
const DetailRow = ({
  label,
  value,
  children,
  className = "",
}: {
  label: string;
  value?: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] gap-4 py-3 border-b border-slate-100 last:border-0 items-start ${className}`}
  >
    <div className="text-sm font-medium text-slate-500 shrink-0">{label}</div>
    <div className="text-sm font-medium text-slate-900 break-words leading-relaxed">
      {children || value || "-"}
    </div>
  </div>
);

const SectionCard = ({
  icon: Icon,
  title,
  children,
  iconColorClass = "text-slate-600",
  headerBgClass = "bg-slate-50/80",
  rightElement = null,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  iconColorClass?: string;
  headerBgClass?: string;
  rightElement?: React.ReactNode;
}) => (
  <Card className="shadow-sm border-slate-200 overflow-hidden !gap-0 ">
    <div
      className={`px-4 py-3 border-b flex items-center justify-between ${headerBgClass}`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColorClass}`} />
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
    {/* Padding yang cukup agar konten tidak mepet header */}
    <CardContent className="p-6">{children}</CardContent>
  </Card>
);

// --- Main Component ---
export const KartuKendaliDetail: React.FC<KartuKendaliDetailProps> = ({
  isOpen,
  onClose,
  ticketId,
}) => {
  const [item, setItem] = useState<KartuKendaliDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchDetail();
    }
  }, [isOpen, ticketId]);

  const fetchDetail = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const response: any = await api.get(`kartu-kendali/${ticketId}`);
      if (response.success) {
        setItem(response.data);
      }
    } catch (error) {
      console.error("Error fetching kartu kendali detail:", error);
      toast.error("Gagal memuat detail kartu kendali");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryLabel = (category: string | null) => {
    const map: Record<string, string> = {
      hardware: "Hardware",
      software: "Software",
      lainnya: "Lainnya",
    };
    return category ? map[category] || category : "-";
  };

  const getRepairTypeLabel = (repairType: string | null) => {
    const map: Record<string, string> = {
      direct_repair: "Bisa Diperbaiki Langsung",
      need_sparepart: "Butuh Sparepart",
      need_vendor: "Butuh Vendor",
      need_license: "Butuh Lisensi",
      unrepairable: "Tidak Dapat Diperbaiki",
    };
    return repairType ? map[repairType] || repairType : "-";
  };

  const handlePrint = () => {
    if (!item) return;
    
    const diagnosis = item.diagnosis;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kartu Kendali - ${item.ticketNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .header .subtitle { font-size: 12px; color: #666; }
          .ticket-info { background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 20px; text-align: center; }
          .ticket-info .number { font-family: monospace; font-size: 16px; font-weight: bold; }
          .ticket-info .title { font-size: 14px; margin-top: 5px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .row { display: flex; padding: 6px 0; border-bottom: 1px dotted #eee; }
          .row:last-child { border-bottom: none; }
          .label { width: 160px; font-size: 11px; color: #666; flex-shrink: 0; }
          .value { flex: 1; font-size: 11px; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { padding: 6px 8px; text-align: left; border: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: 600; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; }
          .signature { text-align: center; width: 200px; }
          .signature .line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; font-size: 11px; }
          .print-date { font-size: 10px; color: #999; text-align: right; margin-top: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KARTU KENDALI PEMELIHARAAN</h1>
          <div class="subtitle">Sistem Informasi Layanan Internal Terpadu</div>
        </div>
        
        <div class="ticket-info">
          <div class="number">#${item.ticketNumber}</div>
          <div class="title">${item.ticketTitle}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Informasi Aset & Personil</div>
          <div class="row"><span class="label">Kode Aset</span><span class="value">${item.assetCode || '-'}</span></div>
          <div class="row"><span class="label">NUP</span><span class="value">${item.assetNup || '-'}</span></div>
          <div class="row"><span class="label">Total Pemeliharaan</span><span class="value">${item.maintenanceCount} Kali</span></div>
          <div class="row"><span class="label">Pelapor</span><span class="value">${item.requesterName || '-'}</span></div>
          <div class="row"><span class="label">Teknisi</span><span class="value">${item.technicianName || '-'}</span></div>
        </div>
        
        ${diagnosis ? `
        <div class="section">
          <div class="section-title">Laporan Diagnosis</div>
          <div class="row"><span class="label">Dapat Diperbaiki</span><span class="value">${diagnosis.is_repairable ? 'Ya' : 'Tidak'}</span></div>
          <div class="row"><span class="label">Kategori</span><span class="value">${getCategoryLabel(diagnosis.problem_category)}</span></div>
          <div class="row"><span class="label">Deskripsi Masalah</span><span class="value">${diagnosis.problem_description || '-'}</span></div>
          <div class="row"><span class="label">Hasil Diagnosis</span><span class="value">${getRepairTypeLabel(diagnosis.repair_type)}</span></div>
          ${diagnosis.repair_description ? `<div class="row"><span class="label">Deskripsi Perbaikan</span><span class="value">${diagnosis.repair_description}</span></div>` : ''}
          ${diagnosis.technician_notes ? `<div class="row"><span class="label">Catatan Teknisi</span><span class="value">${diagnosis.technician_notes}</span></div>` : ''}
        </div>
        ` : ''}
        
        ${item.spareparts.length > 0 ? `
        <div class="section">
          <div class="section-title">Suku Cadang</div>
          <table>
            <thead><tr><th>Item</th><th style="width:60px;text-align:right">Qty</th></tr></thead>
            <tbody>
              ${item.spareparts.map((p) => `<tr><td>${p.name}</td><td style="text-align:right">${p.quantity}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${item.vendors.length > 0 ? `
        <div class="section">
          <div class="section-title">Detail Vendor</div>
          ${item.vendors.map((v, idx) => `
            <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed #ddd;">
              <div class="row"><span class="label">Vendor ${idx + 1}</span><span class="value">${v.name || '-'}</span></div>
              ${v.contact ? `<div class="row"><span class="label">Kontak</span><span class="value">${v.contact}</span></div>` : ''}
              ${v.description ? `<div class="row"><span class="label">Lingkup Pekerjaan</span><span class="value">${v.description}</span></div>` : ''}
              ${v.completionNotes ? `<div class="row"><span class="label">Catatan Penyelesaian</span><span class="value">${v.completionNotes}</span></div>` : ''}
              <div class="row"><span class="label">Selesai</span><span class="value">${formatDate(v.completedAt)}</span></div>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${item.licenses.length > 0 ? `
        <div class="section">
          <div class="section-title">Detail Lisensi</div>
          ${item.licenses.map((l, idx) => `
            <div style="margin-bottom:10px;">
              <div class="row"><span class="label">Lisensi ${idx + 1}</span><span class="value">${l.name || '-'}</span></div>
              ${l.description ? `<div class="row"><span class="label">Keterangan</span><span class="value">${l.description}</span></div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <div class="section">
          <div class="section-title">Status Penyelesaian</div>
          <div class="row"><span class="label">Total Work Order</span><span class="value">${item.totalWorkOrders} selesai</span></div>
          <div class="row"><span class="label">Terakhir Selesai</span><span class="value">${formatDate(item.lastCompletedAt)}</span></div>
        </div>
        
        <div class="footer">
          <div class="signature">
            <div class="line">Teknisi</div>
          </div>
          <div class="signature">
            <div class="line">Penerima</div>
          </div>
        </div>
        
        <div class="print-date">Dicetak: ${new Date().toLocaleString('id-ID')}</div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (!isOpen) return null;

  const diagnosis = item?.diagnosis;
  const hasSpareparts = (item?.spareparts?.length ?? 0) > 0;
  const hasVendors = (item?.vendors?.length ?? 0) > 0;
  const hasLicenses = (item?.licenses?.length ?? 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl min-w-[70vw] max-h-[90vh] flex flex-col p-0 gap-0 outline-none overflow-hidden bg-slate-50">
        {/* --- STICKY HEADER --- */}
        <div className="shrink-0 px-6 py-4 border-b bg-white z-20 flex items-start justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-700" />
                <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  {loading ? "Memuat..." : item?.ticketTitle || "Kartu Kendali"}
                </DialogTitle>
              </div>
              {item && (
                <>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="font-mono text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    #{item.ticketNumber}
                  </span>
                  <Badge 
                    variant={item.ticketStatus === 'closed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {getStatusLabel(item.ticketStatus)}
                  </Badge>
                </>
              )}
            </div>
            <DialogDescription className="flex items-center gap-3 text-xs pt-1">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                Dibuat: {item ? formatDate(item.createdAt) : '-'}
              </span>
              {item?.closedAt && (
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  Selesai: {formatDate(item.closedAt)}
                </span>
              )}
              {item && item.totalWorkOrders > 0 && (
                <Badge variant="outline" className="text-xs">
                  {item.completedWorkOrders}/{item.totalWorkOrders} WO Selesai
                </Badge>
              )}
            </DialogDescription>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-700"
              onClick={handlePrint}
              title="Cetak"
              disabled={loading || !item}
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-700"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* --- SCROLLABLE BODY --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !item ? (
            <div className="text-center py-20 text-muted-foreground">
              Data tidak ditemukan
            </div>
          ) : (
            <>
              {/* Section 1: Informasi Aset & Personil */}
              <SectionCard
                icon={Hash}
                title="Informasi Aset & Personil"
                iconColorClass="text-blue-600"
                headerBgClass="bg-blue-50/50"
              >
                <div className="flex flex-col">
                  <DetailRow label="Kode Aset" value={item.assetCode} />
                  <DetailRow label="NUP" value={item.assetNup} />
                  <DetailRow label="Pemeliharaan">
                    <span className="inline-flex items-center gap-1.5">
                      {item.maintenanceCount} Kali
                    </span>
                  </DetailRow>

                  <DetailRow label="Tiket Terkait">
                    <div className="flex flex-col gap-2">
                      {/* Current ticket */}
                      <div className="flex items-center justify-between gap-2 py-1 px-2 bg-slate-50 rounded border">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-xs font-normal">
                            {item.ticketNumber}
                          </Badge>
                          <span className="text-xs text-slate-500">(Tiket ini)</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                          onClick={() => {
                            navigator.clipboard.writeText(item.ticketNumber);
                            toast.success("Nomor tiket disalin");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Related tickets */}
                      {item.relatedTickets?.length > 0 ? (
                        item.relatedTickets.map((t) => (
                          <div key={t.id} className="flex items-center justify-between gap-2 py-1 px-2 bg-white rounded border">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Badge variant="outline" className="font-mono text-xs font-normal shrink-0">
                                {t.ticketNumber}
                              </Badge>
                              <span className="text-xs text-slate-500 truncate">{t.title}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(t.ticketNumber);
                                toast.success("Nomor tiket disalin");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Tidak ada tiket lain dengan aset yang sama</span>
                      )}
                    </div>
                  </DetailRow>

                  <DetailRow label="Pelapor (User)">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="h-3 w-3 text-slate-500" />
                      </span>
                      <span>{item.requesterName || "-"}</span>
                    </div>
                  </DetailRow>

                  <DetailRow label="Teknisi" className="border-0">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-3 w-3 text-blue-600" />
                      </span>
                      <span>{item.technicianName || "-"}</span>
                    </div>
                  </DetailRow>
                </div>
              </SectionCard>

              {/* Section 2: Laporan Diagnosis */}
              <SectionCard
                icon={Stethoscope}
                title="Laporan Diagnosis"
                iconColorClass="text-orange-600"
                headerBgClass="bg-orange-50/50"
              >
                {diagnosis ? (
                  <div className="flex flex-col">
                    <DetailRow
                      label="Kategori"
                      value={getCategoryLabel(diagnosis.problem_category)}
                    />
                    <DetailRow
                      label="Deskripsi Masalah"
                      value={diagnosis.problem_description}
                    />
                    <DetailRow
                      label="Status Perbaikan"
                      value={
                        diagnosis.is_repairable
                          ? "Dapat Diperbaiki"
                          : "Tidak Dapat Diperbaiki"
                      }
                    />
                    <DetailRow
                      label="Hasil Diagnosis"
                      value={getRepairTypeLabel(diagnosis.repair_type)}
                    />

                    {diagnosis.repair_description && (
                      <DetailRow
                        label="Tindakan"
                        value={diagnosis.repair_description}
                      />
                    )}

                    {diagnosis.unrepairable_reason && (
                      <DetailRow
                        label="Alasan Gagal"
                        value={diagnosis.unrepairable_reason}
                      />
                    )}

                    {diagnosis.alternative_solution && (
                      <DetailRow
                        label="Solusi Alternatif"
                        value={diagnosis.alternative_solution}
                      />
                    )}

                    {diagnosis.technician_notes && (
                      <DetailRow
                        label="Catatan Teknisi"
                        value={diagnosis.technician_notes}
                      />
                    )}

                    {diagnosis.estimasi_hari && (
                      <DetailRow
                        label="Estimasi Waktu"
                        value={diagnosis.estimasi_hari}
                      />
                    )}

                    {/* Timestamp Diagnosis */}
                    {diagnosis.diagnosed_at && (
                      <DetailRow
                        label="Waktu Diagnosis"
                        value={formatDate(diagnosis.diagnosed_at)}
                        className="border-0"
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-muted-foreground text-sm italic opacity-60">
                    Belum ada laporan diagnosis dari teknisi.
                  </div>
                )}
              </SectionCard>

              {/* --- Section 3: Detail Implementasi --- */}

              {/* Suku Cadang - menampilkan semua spareparts dari semua work orders */}
              <SectionCard
                icon={Package}
                title={`Penggunaan Suku Cadang (${item.spareparts?.length || 0})`}
                iconColorClass="text-purple-600"
                headerBgClass="bg-purple-50/50"
              >
                {hasSpareparts ? (
                  <div className="border rounded-md overflow-hidden bg-white">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 border-b">Item</th>
                          <th className="px-4 py-3 border-b text-right w-24">Qty</th>
                          <th className="px-4 py-3 border-b text-right w-32 hidden sm:table-cell">Selesai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {item.spareparts.map((part, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-slate-700">{part.name}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {part.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-slate-500 hidden sm:table-cell">
                              {formatDate(part.completedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-2 text-muted-foreground text-sm italic opacity-60">
                    Tidak ada suku cadang yang digunakan.
                  </div>
                )}
              </SectionCard>

              {/* Vendor - setiap vendor punya catatan penyelesaian sendiri */}
              <SectionCard
                icon={Building}
                title={`Detail Vendor (${item.vendors?.length || 0})`}
                iconColorClass="text-indigo-600"
                headerBgClass="bg-indigo-50/50"
              >
                {hasVendors ? (
                  <div className="space-y-4">
                    {item.vendors.map((vendor, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            Vendor {idx + 1}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {formatDate(vendor.completedAt)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <DetailRow label="Perusahaan" value={vendor.name} />
                          {vendor.contact && (
                            <DetailRow label="Kontak" value={vendor.contact} />
                          )}
                          {vendor.description && (
                            <DetailRow label="Pekerjaan" value={vendor.description} />
                          )}
                          {vendor.completionNotes && (
                            <DetailRow 
                              label="Catatan Penyelesaian" 
                              value={vendor.completionNotes}
                              className="border-0 bg-green-50/50 -mx-4 px-4 py-2 rounded-b-lg"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 text-muted-foreground text-sm italic opacity-60">
                    Tidak menggunakan jasa vendor.
                  </div>
                )}
              </SectionCard>

              {/* Lisensi */}
              <SectionCard
                icon={KeyRound}
                title={`Detail Lisensi (${item.licenses?.length || 0})`}
                iconColorClass="text-emerald-600"
                headerBgClass="bg-emerald-50/50"
              >
                {hasLicenses ? (
                  <div className="space-y-3">
                    {item.licenses.map((license, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            Lisensi {idx + 1}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {formatDate(license.completedAt)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <DetailRow label="Nama Lisensi" value={license.name} />
                          {license.description && (
                            <DetailRow 
                              label="Keterangan" 
                              value={license.description} 
                              className="border-0"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 text-muted-foreground text-sm italic opacity-60">
                    Tidak ada lisensi terkait.
                  </div>
                )}
              </SectionCard>

              {/* Ringkasan */}
              <SectionCard
                icon={CheckCircle}
                title="Ringkasan"
                iconColorClass="text-green-600"
                headerBgClass="bg-green-50/50"
              >
                <div className="flex flex-col">
                  <DetailRow label="Status Tiket" value={getStatusLabel(item.ticketStatus)} />
                  <DetailRow label="Dibuat" value={formatDate(item.createdAt)} />
                  {item.closedAt && (
                    <DetailRow label="Selesai" value={formatDate(item.closedAt)} />
                  )}
                  {item.totalWorkOrders > 0 && (
                    <DetailRow 
                      label="Work Order" 
                      value={`${item.completedWorkOrders} selesai dari ${item.totalWorkOrders} total`} 
                    />
                  )}
                  {item.pendingWorkOrders?.length > 0 && (
                    <DetailRow label="WO Pending">
                      <div className="flex flex-wrap gap-1">
                        {item.pendingWorkOrders.map((wo) => (
                          <Badge key={wo.id} variant="outline" className="text-xs">
                            {wo.type} ({wo.status})
                          </Badge>
                        ))}
                      </div>
                    </DetailRow>
                  )}
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};