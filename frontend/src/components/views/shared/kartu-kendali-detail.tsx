import React from "react";
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
  Calendar,
  Package,
  Building,
  Wrench,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  User,
  Hash,
  KeyRound,
  X,
  FileText
} from "lucide-react";

// --- Interfaces ---
interface KartuKendaliItem {
  id: number;
  ticketNumber: string;
  ticketTitle: string;
  type: string;
  maintenanceCount: number;
  assetCode?: string;
  assetNup?: string;
  requesterName?: string;
  technicianName?: string;
  diagnosis: any;
  items: any;
  vendorName?: string;
  vendorContact?: string;
  vendorDescription?: string;
  licenseName?: string;
  licenseDescription?: string;
  completedAt: string | null;
  completionNotes?: string;
  [key: string]: any;
}

interface KartuKendaliDetailProps {
  isOpen: boolean;
  onClose: () => void;
  item: KartuKendaliItem | null;
}

// --- Helper Components ---

// 1. Komponen Baris Data (Label & Value)
const DetailItem = ({
  label,
  value,
  children,
  className = ""
}: {
  label: string,
  value?: string | React.ReactNode,
  children?: React.ReactNode,
  className?: string
}) => (
  <div className={`space-y-1 ${className}`}>
    <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</dt>
    <dd className="text-sm font-medium text-slate-800 leading-snug">{children || value || "-"}</dd>
  </div>
);

// 2. Komponen Wrapper Card dengan Header Standar (Enterprise Style)
const SectionCard = ({
  icon: Icon,
  title,
  children,
  iconColorClass = "text-slate-600",
  headerBgClass = "bg-slate-50/80",
  rightElement = null,
  className = "gap-0"
}: {
  icon: any,
  title: string,
  children: React.ReactNode,
  iconColorClass?: string,
  headerBgClass?: string,
  rightElement?: React.ReactNode,
  className?: string
}) => (
  <Card className={`shadow-sm border-slate-200 overflow-hidden pb-6 ${className}`}>
    <div className={`px-4 py-3 border-b flex items-center justify-between ${headerBgClass}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColorClass}`} />
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
    <CardContent className="pt-4 px-4">
      {children}
    </CardContent>
  </Card>
);

// --- Main Component ---

export const KartuKendaliDetail: React.FC<KartuKendaliDetailProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  // Utility Functions
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric", hour: '2-digit', minute: '2-digit'
    });
  };

  const parseItems = (items: any): any[] => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    }
    return [];
  };

  if (!item) return null;

  const diagnosis = item.diagnosis || {};
  const parsedItems = parseItems(item.items);

  // Logic Visibility Section
  const hasSpareparts = parsedItems.length > 0;
  const hasVendor = item.vendorName || item.vendorContact || item.vendorDescription;
  const hasLicense = item.licenseName || item.licenseDescription;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* LAYOUT STICKY:
         DialogContent dibuat flex-col dengan max-h tertentu.
         Header diberi shrink-0 (tidak mengecil).
         Body diberi flex-1 dan overflow-y-auto (scrollable).
      */}
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 outline-none overflow-hidden">

        {/* --- STICKY HEADER --- */}
        <div className="shrink-0 px-6 py-4 border-b bg-white z-20 flex items-start justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-700" />
                <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  {item.ticketTitle}
                </DialogTitle>
              </div>
              <Separator orientation="vertical" className="h-5" />
              <span className="font-mono text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                #{item.ticketNumber}
              </span>
            </div>
            <DialogDescription className="flex items-center gap-3 text-xs pt-1">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Calendar className="h-3.5 w-3.5" />
                {item.completedAt ? `Selesai: ${formatDate(item.completedAt)}` : "Status: Dalam Pengerjaan"}
              </span>
            </DialogDescription>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* --- SCROLLABLE BODY --- */}
        <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6 space-y-6">

          {/* Section 1: Informasi Aset & Personil */}
          <SectionCard
            icon={Hash}
            title="Informasi Aset & Personil"
            iconColorClass="text-blue-600"
            headerBgClass="bg-blue-50/50"
          >
            <div className="flex flex-col gap-6">

              {/* --- BAGIAN 1: INFO ASET (Grid 3 Kolom agar pas) --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <DetailItem label="Kode Aset" value={item.assetCode} />

                <DetailItem label="NUP" value={item.assetNup} />

                <DetailItem label="Total Pemeliharaan">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                    <Wrench className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">{item.maintenanceCount} Kali</span>
                  </div>
                </DetailItem>
              </div>

              {/* Separator di luar grid agar margin atas-bawah konsisten */}
              <Separator className="bg-slate-200" />

              {/* --- BAGIAN 2: INFO PERSONIL (Grid 2 Kolom) --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem label="Pelapor (User)">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {item.requesterName || "-"}
                    </span>
                  </div>
                </DetailItem>

                <DetailItem label="Teknisi Penanggungjawab">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {item.technicianName || "-"}
                    </span>
                  </div>
                </DetailItem>
              </div>

            </div>
          </SectionCard>

          {/* Section 2: Laporan Diagnosis */}
          <SectionCard
            icon={Stethoscope}
            title="Laporan Diagnosis"
            iconColorClass="text-orange-600"
            headerBgClass="bg-orange-50/50"
            rightElement={
              diagnosis.isRepairable !== undefined && (
                <Badge variant={diagnosis.isRepairable ? "outline" : "destructive"} className={`h-5 gap-1 ${diagnosis.isRepairable ? "border-green-500 text-green-700 bg-green-50" : ""}`}>
                  {diagnosis.isRepairable ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {diagnosis.isRepairable ? "Repairable" : "Not Repairable"}
                </Badge>
              )
            }
          >
            {Object.keys(diagnosis).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <DetailItem label="Masalah Utama" value={diagnosis.problemDescription} className="md:col-span-2 p-3 bg-slate-50 rounded border border-slate-100" />

                <DetailItem label="Kondisi Fisik" value={diagnosis.physicalCondition} />
                <DetailItem label="Inspeksi Visual" value={diagnosis.visualInspection} />
                <DetailItem label="Hasil Pengujian" value={diagnosis.testingResult} />
                <DetailItem label="Rekomendasi" value={diagnosis.repairRecommendation} />

                {diagnosis.faultyComponents?.length > 0 && (
                  <DetailItem label="Komponen Bermasalah" className="md:col-span-2">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {diagnosis.faultyComponents.map((comp: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="font-mono text-[10px] text-red-600 bg-red-50 border-red-100">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </DetailItem>
                )}

                {diagnosis.technicianNotes && (
                  <div className="md:col-span-2 mt-2">
                    <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Catatan Teknisi</dt>
                    <dd className="text-sm p-3 bg-yellow-50/40 border border-yellow-100 rounded text-slate-700 italic">
                      "{diagnosis.technicianNotes}"
                    </dd>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm italic opacity-60">
                Belum ada laporan diagnosis dari teknisi.
              </div>
            )}
          </SectionCard>

          {/* Section 3: Detail Implementasi (Stack Layout) */}
          <div className="space-y-6">
            
            {/* Suku Cadang */}
            <SectionCard 
              icon={Package} 
              title="Penggunaan Suku Cadang" 
              iconColorClass="text-purple-600"
              headerBgClass="bg-purple-50/50"
            >
              {hasSpareparts ? (
                <div className="border rounded-md overflow-hidden bg-white">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Item</th>
                        <th className="px-3 py-2 font-semibold text-right">Qty</th>
                        <th className="px-3 py-2 font-semibold text-center">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedItems.map((part: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium text-slate-700">{part.name || part.item_name}</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600">{part.quantity}</td>
                          <td className="px-3 py-2 text-center text-xs text-slate-400">{part.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm italic opacity-60">
                  Tidak ada suku cadang yang digunakan.
                </div>
              )}
            </SectionCard>

            {/* Vendor */}
            <SectionCard 
              icon={Building} 
              title="Detail Vendor" 
              iconColorClass="text-indigo-600"
              headerBgClass="bg-indigo-50/50"
            >
              {hasVendor ? (
                <div className="space-y-4">
                  <DetailItem label="Perusahaan" value={item.vendorName} />
                  <DetailItem label="Kontak Person" value={item.vendorContact} />
                  <Separator />
                  <DetailItem label="Lingkup Pekerjaan" value={item.vendorDescription} className="bg-slate-50 p-2 rounded border border-slate-100" />
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm italic opacity-60">
                  Tidak menggunakan jasa vendor.
                </div>
              )}
            </SectionCard>

            {/* Lisensi */}
            <SectionCard 
              icon={KeyRound} 
              title="Detail Lisensi" 
              iconColorClass="text-emerald-600"
              headerBgClass="bg-emerald-50/50"
            >
              {hasLicense ? (
                <div className="space-y-4">
                  <DetailItem label="Nama Lisensi" value={item.licenseName} />
                  <DetailItem label="Keterangan" value={item.licenseDescription} className="bg-slate-50 p-2 rounded border border-slate-100" />
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm italic opacity-60">
                  Tidak ada lisensi terkait.
                </div>
              )}
            </SectionCard>

            {/* Status Penyelesaian */}
            <SectionCard 
              icon={CheckCircle} 
              title="Status Penyelesaian" 
              iconColorClass="text-green-600"
              headerBgClass="bg-green-50/50"
              className="!gap-0"
            >
              <div className="!mt-0 space-y-5">
                <div className="flex items-center justify-between p-3 bg-green-50/30 border border-green-100 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Tanggal Selesai</span>
                  <span className="font-mono text-sm font-semibold text-green-700">
                    {formatDate(item.completedAt)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Catatan Penyelesaian</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pl-1">
                    {item.completionNotes || "Tidak ada catatan khusus."}
                  </p>
                </div>
              </div>
            </SectionCard>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};