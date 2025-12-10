import React from "react";
import type { TicketDiagnosis } from "@/types";

interface TicketDiagnosisDisplayProps {
  diagnosis: TicketDiagnosis | any;
}

export const TicketDiagnosisDisplay: React.FC<TicketDiagnosisDisplayProps> = ({
  diagnosis: rawDiagnosis,
}) => {
  // Data sudah dalam format snake_case dari backend
  const diagnosis = rawDiagnosis as TicketDiagnosis;

  const getCategoryLabel = () => {
    const map: Record<string, string> = {
      hardware: "Hardware",
      software: "Software",
      lainnya: "Lainnya",
    };
    return map[diagnosis.problem_category] || diagnosis.problem_category;
  };

  const getRepairTypeLabel = () => {
    const map: Record<string, string> = {
      direct_repair: "Bisa Diperbaiki Langsung",
      need_sparepart: "Butuh Sparepart",
      need_vendor: "Butuh Vendor",
      need_license: "Butuh Lisensi",
      unrepairable: "Tidak Dapat Diperbaiki",
    };
    return map[diagnosis.repair_type] || diagnosis.repair_type;
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Identifikasi Masalah */}
      <div>
        <h4 className="font-semibold mb-1">Identifikasi Masalah</h4>
        <p className="text-gray-700">
          <span className="text-gray-500">Kategori: </span>
          {getCategoryLabel()}
        </p>
        <p className="text-gray-700 mt-2">
          <span className="text-gray-500">Deskripsi: </span>
          {diagnosis.problem_description}
        </p>
      </div>

      <hr className="my-3" />

      {/* Hasil Diagnosis */}
      <div>
        <h4 className="font-semibold mb-1">Hasil Diagnosis</h4>
        <p className="text-gray-700">{getRepairTypeLabel()}</p>
      </div>

      {/* Deskripsi Perbaikan */}
      {diagnosis.repair_description && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Deskripsi Perbaikan</h4>
            <p className="text-gray-700">{diagnosis.repair_description}</p>
          </div>
        </>
      )}

      {/* Alasan Tidak Dapat Diperbaiki */}
      {diagnosis.unrepairable_reason && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">
              Alasan Tidak Dapat Diperbaiki
            </h4>
            <p className="text-gray-700">{diagnosis.unrepairable_reason}</p>
          </div>
        </>
      )}

      {/* Kondisi BMN yang Diubah */}
      {diagnosis.asset_condition_change && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Perubahan Kondisi BMN</h4>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-gray-700">
                <span className="text-amber-700 font-medium">
                  ⚠️ Kondisi barang diubah menjadi:{" "}
                </span>
                <span className="font-semibold text-amber-900">
                  {diagnosis.asset_condition_change}
                </span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Solusi Alternatif */}
      {diagnosis.alternative_solution && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Solusi Alternatif</h4>
            <p className="text-gray-700">{diagnosis.alternative_solution}</p>
          </div>
        </>
      )}

      {/* Catatan Teknisi */}
      {diagnosis.technician_notes && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Catatan Teknisi</h4>
            <p className="text-gray-700">{diagnosis.technician_notes}</p>
          </div>
        </>
      )}

      {/* Estimasi Pengerjaan */}
      {diagnosis.estimasi_hari && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Estimasi Pengerjaan</h4>
            <p className="text-gray-700">{diagnosis.estimasi_hari}</p>
          </div>
        </>
      )}

      {/* Teknisi Info */}
      {diagnosis.technician && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Teknisi</h4>
            <p className="text-gray-700">{diagnosis.technician.name}</p>
          </div>
        </>
      )}
    </div>
  );
};
