import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

// Diagnosis data dari teknisi
interface DiagnosisData {
  physicalCondition: string | null;
  visualInspection: string | null;
  problemDescription: string | null;
  problemCategory: string | null;
  testingResult: string | null;
  faultyComponents: string[];
  isRepairable: boolean;
  repairType: string | null;
  repairDifficulty: string | null;
  repairRecommendation: string | null;
  requiresSparepart: boolean;
  requiredSpareparts: any[];
  requiresVendor: boolean;
  vendorReason: string | null;
  technicianNotes: string | null;
  diagnosedAt: string | null;
  technicianName: string | null;
}

// Interface sesuai response dari WorkOrderController::kartuKendali
export interface KartuKendaliItem {
  id: number;
  ticketId: number;
  ticketNumber: string;
  ticketTitle: string;
  type: 'sparepart' | 'vendor' | 'license';
  completedAt: string;
  completionNotes: string | null;
  assetCode: string | null;
  assetName: string | null;
  assetNup: string | null;
  maintenanceCount: number;
  items: any[] | null;
  vendorName: string | null;
  vendorContact: string | null;
  vendorDescription: string | null;
  licenseName: string | null;
  licenseDescription: string | null;
  diagnosis: DiagnosisData | null;
  technicianId: number;
  technicianName: string;
  requesterId: number;
  requesterName: string;
}

interface KartuKendaliListProps {
  onViewDetail: (item: KartuKendaliItem) => void;
}

export const KartuKendaliList: React.FC<KartuKendaliListProps> = ({
  onViewDetail,
}) => {
  const [items, setItems] = useState<KartuKendaliItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    perPage: 15,
    currentPage: 1,
    lastPage: 1,
  });

  const fetchKartuKendali = async (page = 1, search = searchTerm) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("per_page", "15");
      if (search) params.append("search", search);

      const response: any = await api.get(`kartu-kendali?${params.toString()}`);
      setItems(Array.isArray(response.data) ? response.data : []);
      if (response.pagination) {
        setPagination({
          total: response.pagination.total,
          perPage: response.pagination.per_page,
          currentPage: response.pagination.current_page,
          lastPage: response.pagination.last_page,
        });
      }
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchKartuKendali(1, searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="border-none shadow-sm pb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle  >
            Kartu Kendali Pemeliharaan
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari tiket"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[250px] lg:w-[300px] h-9 text-sm"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9" 
              onClick={() => fetchKartuKendali(pagination.currentPage)}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent> 
        {/* Ubah div pembungkus agar memiliki border penuh dan rounded corner */}
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b">
                {/* Tambahkan border-r (kanan) pada setiap TableHead */}
                <TableHead className="w-[50px] text-center border-r">No</TableHead>
                <TableHead className="w-[140px] border-r">No. Tiket</TableHead>
                <TableHead className="border-r">Judul Tiket</TableHead>
                <TableHead className="hidden md:table-cell border-r">Teknisi</TableHead>
                <TableHead className="hidden lg:table-cell w-[120px] border-r">Selesai</TableHead>
                <TableHead className="w-[80px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 border-b last:border-0">
                    {/* Tambahkan border-r pada setiap TableCell */}
                    <TableCell className="text-center text-muted-foreground font-mono text-xs border-r">
                      {(pagination.currentPage - 1) * pagination.perPage + index + 1}
                    </TableCell>
                    <TableCell className="border-r">
                      <span className="font-mono text-xs font-medium">{item.ticketNumber}</span>
                    </TableCell>
                    <TableCell className="border-r">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate max-w-[300px]">
                          {item.ticketTitle}
                        </span>
                        {item.assetCode && (
                          <span className="text-xs text-muted-foreground">
                            Aset: {item.assetCode} {item.assetNup ? `/ ${item.assetNup}` : ''}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground border-r">
                      {item.technicianName || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground border-r">
                      {formatDate(item.completedAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onViewDetail(item)}
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.lastPage > 1 && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
              Menampilkan {items.length} dari {pagination.total} data
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchKartuKendali(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || loading}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchKartuKendali(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.lastPage || loading}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};