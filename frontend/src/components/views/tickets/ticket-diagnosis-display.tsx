import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  Package,
  Users,
  FileText,
  Calendar,
  Key,
} from "lucide-react";
import type { TicketDiagnosis } from "@/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TicketDiagnosisDisplayProps {
  diagnosis: TicketDiagnosis;
}

export const TicketDiagnosisDisplay: React.FC<TicketDiagnosisDisplayProps> = ({
  diagnosis,
}) => {
  // Problem category badge
  const getCategoryBadge = () => {
    const categoryMap = {
      hardware: { label: "Hardware", color: "bg-blue-100 text-blue-800" },
      software: { label: "Software", color: "bg-green-100 text-green-800" },
      lainnya: { label: "Lainnya", color: "bg-gray-100 text-gray-800" },
    };
    const cat = categoryMap[diagnosis.problemCategory];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${cat.color}`}>
        {cat.label}
      </span>
    );
  };

  // Repair type badge
  const getRepairTypeBadge = () => {
    const typeMap = {
      direct_repair: {
        label: "Bisa Diperbaiki Langsung",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      need_sparepart: {
        label: "Butuh Sparepart",
        color: "bg-blue-100 text-blue-800",
        icon: Package,
      },
      need_vendor: {
        label: "Butuh Vendor",
        color: "bg-purple-100 text-purple-800",
        icon: Users,
      },
      need_license: {
        label: "Butuh Lisensi",
        color: "bg-indigo-100 text-indigo-800",
        icon: Key,
      },
      unrepairable: {
        label: "Tidak Dapat Diperbaiki",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };

    const type = typeMap[diagnosis.repairType as keyof typeof typeMap];
    if (!type) return null;

    const Icon = type.icon;
    return (
      <Badge variant="outline" className={`${type.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {type.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Hasil Diagnosa
          </CardTitle>
          {getRepairTypeBadge()}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <Calendar className="h-4 w-4" />
          {format(new Date(diagnosis.createdAt), "dd MMMM yyyy HH:mm", {
            locale: id,
          })}
        </div>
        {diagnosis.technician && (
          <div className="text-sm text-gray-600">
            Teknisi:{" "}
            <span className="font-medium">{diagnosis.technician.name}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identifikasi Masalah */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Identifikasi Masalah
          </h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Kategori:</span>{" "}
              {getCategoryBadge()}
            </div>
            <div>
              <span className="text-sm text-gray-500">Deskripsi:</span>
              <p className="text-sm mt-1 bg-gray-50 p-3 rounded">
                {diagnosis.problemDescription}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Hasil Diagnosis */}
        <div>
          <h4 className="font-semibold mb-3">Hasil Diagnosis</h4>

          {/* Jika bisa diperbaiki langsung */}
          {diagnosis.repairType === "direct_repair" &&
            diagnosis.repairDescription && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Perbaikan Langsung
                </h5>
                <p className="text-sm text-green-800">
                  {diagnosis.repairDescription}
                </p>
              </div>
            )}

          {/* Jika butuh work order */}
          {["need_sparepart", "need_vendor", "need_license"].includes(
            diagnosis.repairType
          ) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                {diagnosis.repairType === "need_sparepart" && (
                  <Package className="h-4 w-4" />
                )}
                {diagnosis.repairType === "need_vendor" && (
                  <Users className="h-4 w-4" />
                )}
                {diagnosis.repairType === "need_license" && (
                  <Key className="h-4 w-4" />
                )}
                Membutuhkan{" "}
                {diagnosis.repairType === "need_sparepart"
                  ? "Sparepart"
                  : diagnosis.repairType === "need_vendor"
                  ? "Vendor Eksternal"
                  : "Lisensi Software"}
              </h5>
              <p className="text-sm text-blue-800">
                Work Order perlu dibuat untuk pengadaan/perbaikan oleh pihak
                eksternal.
              </p>
            </div>
          )}

          {/* Jika tidak dapat diperbaiki */}
          {diagnosis.repairType === "unrepairable" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <div>
                <h5 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Tidak Dapat Diperbaiki
                </h5>
                {diagnosis.unrepairableReason && (
                  <div>
                    <span className="text-sm text-red-700 font-medium">
                      Alasan:
                    </span>
                    <p className="text-sm text-red-800 mt-1">
                      {diagnosis.unrepairableReason}
                    </p>
                  </div>
                )}
              </div>
              {diagnosis.alternativeSolution && (
                <div>
                  <span className="text-sm text-red-700 font-medium">
                    Solusi Alternatif:
                  </span>
                  <p className="text-sm text-red-800 mt-1">
                    {diagnosis.alternativeSolution}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Catatan Teknisi */}
        {diagnosis.technicianNotes && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Catatan Teknisi
              </h4>
              <p className="text-sm bg-gray-50 p-3 rounded">
                {diagnosis.technicianNotes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
