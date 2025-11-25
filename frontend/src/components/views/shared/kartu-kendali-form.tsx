import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface KartuKendaliFormProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: number;
  assetCode: string;
  assetNup: string;
  onSuccess: () => void;
}

export const KartuKendaliForm: React.FC<KartuKendaliFormProps> = ({
  isOpen,
  onClose,
  workOrderId,
  assetCode,
  assetNup,
  onSuccess,
}) => {
  const [assetData, setAssetData] = useState<any>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maintenanceDate, setMaintenanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Fetch asset data from database
  useEffect(() => {
    const fetchAsset = async () => {
      if (!assetCode || !assetNup || !isOpen) {
        console.log("Skipping fetch - missing data:", {
          assetCode,
          assetNup,
          isOpen,
        });
        return;
      }

      try {
        setLoadingAsset(true);
        console.log("Fetching asset with:", { assetCode, assetNup });
        const response: any = await api.get(
          `assets/search/by-code-nup?asset_code=${assetCode}&asset_nup=${assetNup}`
        );

        console.log("Asset search response:", response);

        if (response.asset) {
          setAssetData(response.asset);
          console.log("Asset data loaded:", response.asset);
        } else {
          console.error("Asset not found in response");
          toast.error("Data aset tidak ditemukan");
        }
      } catch (error) {
        console.error("Error fetching asset:", error);
        toast.error("Gagal memuat data aset");
      } finally {
        setLoadingAsset(false);
      }
    };

    fetchAsset();
  }, [assetCode, assetNup, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assetData) {
      toast.error("Data aset belum dimuat");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("kartu-kendali/from-work-order", {
        work_order_id: workOrderId,
        asset_code: assetData.asset_code,
        asset_nup: assetData.asset_nup,
        asset_name: assetData.asset_name,
        asset_merk: assetData.merk_tipe || "",
        maintenance_date: maintenanceDate,
      });

      toast.success("Kartu Kendali berhasil dibuat");
      onSuccess();
      onClose();
      setAssetData(null);
    } catch (error: any) {
      console.error("Error creating kartu kendali:", error);
      toast.error(
        error.body?.message || error.message || "Gagal membuat kartu kendali"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAssetData(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kartu Kendali</DialogTitle>
          <DialogDescription>
            Data aset dan work order akan otomatis tercatat dalam kartu kendali
          </DialogDescription>
        </DialogHeader>

        {loadingAsset ? (
          <div className="py-8 text-center text-gray-500">
            Memuat data aset...
          </div>
        ) : !assetData ? (
          <div className="py-8 text-center text-red-500">
            Data aset tidak ditemukan
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data Aset - Read Only */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700">Data Aset</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kode Barang</Label>
                  <Input
                    value={assetData.asset_code}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>NUP</Label>
                  <Input
                    value={assetData.asset_nup}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nama Barang</Label>
                <Input
                  value={assetData.asset_name}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Merek Barang</Label>
                  <Input
                    value={assetData.merk_tipe || "-"}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ruang</Label>
                  <Input
                    value={assetData.location || "-"}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Tanggal Pemeliharaan */}
            <div className="space-y-2">
              <Label htmlFor="maintenance_date">Tanggal Pemeliharaan *</Label>
              <Input
                id="maintenance_date"
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                required
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p className="font-medium">ℹ️ Informasi</p>
              <p className="mt-1">
                Data work order dan pemeliharaan akan otomatis tercatat dari
                sistem.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || loadingAsset || !assetData}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Kartu Kendali"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
