import React from "react";
import type { TicketDiagnosis } from "@/types";

interface TicketDiagnosisDisplayProps {
  diagnosis: TicketDiagnosis | any;
}

export const TicketDiagnosisDisplay: React.FC<TicketDiagnosisDisplayProps> = ({
  diagnosis: rawDiagnosis,
}) => {
  // Convert snake_case dari backend ke camelCase untuk konsistensi
  const diagnosis: TicketDiagnosis = {
    id: rawDiagnosis.id,
    ticketId: rawDiagnosis.ticket_id || rawDiagnosis.ticketId,
    technicianId: rawDiagnosis.technician_id || rawDiagnosis.technicianId,
    technician: rawDiagnosis.technician,
    problemDescription: rawDiagnosis.problem_description || rawDiagnosis.problemDescription,
    problemCategory: rawDiagnosis.problem_category || rawDiagnosis.problemCategory,
    repairType: rawDiagnosis.repair_type || rawDiagnosis.repairType,
    repairDescription: rawDiagnosis.repair_description || rawDiagnosis.repairDescription,
    unrepairableReason: rawDiagnosis.unrepairable_reason || rawDiagnosis.unrepairableReason,
    alternativeSolution: rawDiagnosis.alternative_solution || rawDiagnosis.alternativeSolution,
    technicianNotes: rawDiagnosis.technician_notes || rawDiagnosis.technicianNotes,
    estimasiHari: rawDiagnosis.estimasi_hari || rawDiagnosis.estimasiHari,
    createdAt: rawDiagnosis.created_at || rawDiagnosis.createdAt,
    updatedAt: rawDiagnosis.updated_at || rawDiagnosis.updatedAt,
  };

  const getCategoryLabel = () => {
    const map = {
      hardware: "Hardware",
      software: "Software",
      lainnya: "Lainnya",
    };
    return map[diagnosis.problemCategory] || diagnosis.problemCategory;
  };

  const getRepairTypeLabel = () => {
    const map = {
      direct_repair: "Bisa Diperbaiki Langsung",
      need_sparepart: "Butuh Sparepart",
      need_vendor: "Butuh Vendor",
      need_license: "Butuh Lisensi",
      unrepairable: "Tidak Dapat Diperbaiki",
    };
    return map[diagnosis.repairType] || diagnosis.repairType;
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
          {diagnosis.problemDescription}
        </p>
      </div>

      <hr className="my-3" />

      {/* Hasil Diagnosis */}
      <div>
        <h4 className="font-semibold mb-1">Hasil Diagnosis</h4>
        <p className="text-gray-700">{getRepairTypeLabel()}</p>
      </div>

      <hr className="my-3" />

      {/* Status Perbaikan */}
      <div>
        <h4 className="font-semibold mb-1">Status Perbaikan</h4>
        {diagnosis.repairType === "direct_repair" && (
          <p className="text-gray-700">Dapat diperbaiki</p>
        )}
        {diagnosis.repairType === "unrepairable" && (
          <p className="text-gray-700">Tidak dapat diperbaiki</p>
        )}
        {["need_sparepart", "need_vendor", "need_license"].includes(diagnosis.repairType) && (
          <p className="text-gray-700">Membutuhkan pihak eksternal</p>
        )}
      </div>

      {/* Deskripsi Perbaikan */}
      {diagnosis.repairDescription && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Deskripsi Perbaikan</h4>
            <p className="text-gray-700">{diagnosis.repairDescription}</p>
          </div>
        </>
      )}

      {/* Alasan Tidak Dapat Diperbaiki */}
      {diagnosis.unrepairableReason && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Alasan Tidak Dapat Diperbaiki</h4>
            <p className="text-gray-700">{diagnosis.unrepairableReason}</p>
          </div>
        </>
      )}

      {/* Solusi Alternatif */}
      {diagnosis.alternativeSolution && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Solusi Alternatif</h4>
            <p className="text-gray-700">{diagnosis.alternativeSolution}</p>
          </div>
        </>
      )}

      {/* Catatan Teknisi */}
      {diagnosis.technicianNotes && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Catatan Teknisi</h4>
            <p className="text-gray-700">{diagnosis.technicianNotes}</p>
          </div>
        </>
      )}

      {/* Estimasi Pengerjaan */}
      {diagnosis.estimasiHari && (
        <>
          <hr className="my-3" />
          <div>
            <h4 className="font-semibold mb-1">Estimasi Pengerjaan</h4>
            <p className="text-gray-700">{diagnosis.estimasiHari}</p>
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
