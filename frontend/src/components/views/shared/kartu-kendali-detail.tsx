import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  ArrowLeft,
  Calendar,
  User,
  Wrench,
  Package,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface KartuKendaliEntry {
  id: number;
  maintenanceDate: string;
  maintenanceType: string;
  vendorName: string | null;
  vendorContact: string | null;
  vendorDescription: string | null;
  licenseName: string | null;
  licenseDescription: string | null;
  spareparts: any[];
  technicianName: string;
  assetConditionAfter: string;
  workOrderId: number;
  ticketId: number;
  createdAt: string;
}

interface KartuKendaliAsset {
  id: number;
  assetCode: string;
  assetNup: string;
  assetName: string;
  assetMerk: string;
  condition: string;
  location: string;
  maintenanceCount: number;
}

interface KartuKendaliDetailProps {
  isOpen: boolean;
  onClose: () => void;
  asset: KartuKendaliAsset | null;
}

export const KartuKendaliDetail: React.FC<KartuKendaliDetailProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const [entries, setEntries] = useState<KartuKendaliEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (asset && isOpen) {
      fetchEntries();
    }
  }, [asset, isOpen]);

  const fetchEntries = async () => {
    if (!asset) return;

    try {
      setLoading(true);
      const response: any = await api.get(`kartu-kendali/${asset.id}`);
      setEntries(response.data?.entries || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast.error("Gagal memuat riwayat pemeliharaan");
    } finally {
      setLoading(false);
    }
  };

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      baik: { variant: "default", label: "Baik" },
      rusak_ringan: { variant: "secondary", label: "Rusak Ringan" },
      rusak_berat: { variant: "destructive", label: "Rusak Berat" },
    };
    const config = variants[condition] || {
      variant: "secondary",
      label: condition,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMaintenanceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      preventive: "Preventif",
      corrective: "Korektif",
      repair: "Perbaikan",
    };
    return types[type] || type;
  };

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Kartu Kendali - {asset.assetName}
          </DialogTitle>
          <DialogDescription>
            Riwayat pemeliharaan dan perbaikan aset
          </DialogDescription>
        </DialogHeader>

        {/* Asset Info */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Kode Barang</div>
                <div className="font-mono font-semibold">{asset.assetCode}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">NUP</div>
                <div className="font-mono font-semibold">{asset.assetNup}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Nama Barang</div>
                <div className="font-semibold">{asset.assetName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Merek</div>
                <div>{asset.assetMerk || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Lokasi</div>
                <div>{asset.location || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Kondisi Terakhir</div>
                <div>{getConditionBadge(asset.condition)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Maintenance History */}
        <div>
          <h3 className="font-semibold mb-3">
            Riwayat Pemeliharaan ({entries.length})
          </h3>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Memuat riwayat...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada riwayat pemeliharaan
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <Card key={entry.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {getMaintenanceTypeLabel(entry.maintenanceType)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            WO #{entry.workOrderId}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(entry.maintenanceDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {entry.technicianName}
                          </div>
                        </div>
                      </div>
                      {getConditionBadge(entry.assetConditionAfter)}
                    </div>

                    {entry.vendorName && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">Vendor:</span>
                        </div>
                        <div className="text-sm text-gray-700 ml-5">
                          <div className="font-medium">{entry.vendorName}</div>
                          {entry.vendorContact && (
                            <div className="text-gray-600 mt-1">
                              Kontak: {entry.vendorContact}
                            </div>
                          )}
                          {entry.vendorDescription && (
                            <div className="text-gray-600 mt-1">
                              {entry.vendorDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {entry.licenseName && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">Lisensi:</span>
                        </div>
                        <div className="text-sm text-gray-700 ml-5">
                          <div className="font-medium">{entry.licenseName}</div>
                          {entry.licenseDescription && (
                            <div className="text-gray-600 mt-1">
                              {entry.licenseDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {entry.spareparts && entry.spareparts.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">Sparepart:</span>
                        </div>
                        <ul className="text-sm text-gray-600 ml-5 list-disc">
                          {entry.spareparts.map((part: any, idx: number) => (
                            <li key={idx}>
                              {part.name} - {part.quantity} {part.unit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
