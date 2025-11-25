import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface KartuKendaliAsset {
  id: number;
  assetCode: string;
  assetNup: string;
  assetName: string;
  assetMerk: string;
  condition: string;
  location: string;
  maintenanceCount: number;
  createdAt: string;
  updatedAt: string;
}

interface KartuKendaliListProps {
  onViewDetail: (asset: KartuKendaliAsset) => void;
}

export const KartuKendaliList: React.FC<KartuKendaliListProps> = ({
  onViewDetail,
}) => {
  const [assets, setAssets] = useState<KartuKendaliAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchKartuKendali = async () => {
    try {
      setLoading(true);
      const response: any = await api.get("kartu-kendali?per_page=100");
      setAssets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching kartu kendali:", error);
      toast.error("Gagal memuat data kartu kendali");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKartuKendali();
  }, []);

  const filteredAssets = assets.filter(
    (asset) =>
      asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetNup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Kartu Kendali Aset
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari kode, NUP, atau nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Tidak ada kartu kendali</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-lg">
                            {asset.assetName}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>
                              Kode:{" "}
                              <span className="font-mono">
                                {asset.assetCode}
                              </span>
                            </div>
                            <div>
                              NUP:{" "}
                              <span className="font-mono">
                                {asset.assetNup}
                              </span>
                            </div>
                          </div>
                        </div>
                        {getConditionBadge(asset.condition)}
                      </div>

                      <div className="text-sm text-gray-600">
                        <div>Merek: {asset.assetMerk || "-"}</div>
                        <div>Lokasi: {asset.location || "-"}</div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {asset.maintenanceCount}
                          </span>{" "}
                          pemeliharaan
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetail(asset)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
