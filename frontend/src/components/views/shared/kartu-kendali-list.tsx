import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

// Interface untuk list - 1 entry per tiket perbaikan
export interface KartuKendaliItem {
  id: number;
  ticketId: number;
  ticketNumber: string;
  ticketTitle: string;
  ticketStatus: string;
  completedAt: string | null;
  closedAt: string | null;
  assetCode: string | null;
  assetName: string | null;
  assetNup: string | null;
  maintenanceCount: number;
  workOrderCount: number;
  technicianName: string | null;
  requesterId: number;
  requesterName: string | null;
}

interface KartuKendaliListProps {
  onViewDetail: (ticketId: number) => void;
}

// Helper untuk status badge
const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    submitted: { label: "Pending", variant: "secondary" },
    assigned: { label: "Ditugaskan", variant: "outline" },
    in_progress: { label: "Diproses", variant: "default" },
    on_hold: { label: "Ditunda", variant: "secondary" },
    waiting_for_submitter: { label: "Menunggu", variant: "secondary" },
    closed: { label: "Selesai", variant: "default" },
  };
  const info = statusMap[status] || { label: status, variant: "outline" as const };
  return <Badge variant={info.variant} className="text-xs">{info.label}</Badge>;
};

export const KartuKendaliList: React.FC<KartuKendaliListProps> = ({
  onViewDetail,
}) => {
  const [items, setItems] = useState<KartuKendaliItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // Input sementara sebelum search
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

  // Handle search saat klik tombol atau tekan Enter
  const handleSearch = () => {
    setSearchTerm(searchInput);
    fetchKartuKendali(1, searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Card className="border-none shadow-sm pb-6">
      <CardHeader>
        <div className="flex items-start justify-between max-md:flex-col max-md:items-start max-md:gap-4">
          <div>
            <CardTitle>
              Kartu Kendali Pemeliharaan
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Klik pada salah satu baris untuk melihat detail
            </p>
          </div>
          <div className="flex items-center gap-2 max-md:w-full">
            <div className="relative flex items-center gap-2 max-md:flex-1">
              <div className="relative max-md:flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari NUP / kode aset..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 w-[250px] lg:w-[300px] h-9 text-sm max-md:w-full"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearch}
                className="h-9 px-3"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => fetchKartuKendali(pagination.currentPage, searchTerm)}
            >
              <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Ubah div pembungkus agar memiliki border penuh dan rounded corner */}
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b">
                <TableHead className="w-[50px] text-center border-r">No</TableHead>
                <TableHead className="w-[140px] border-r">No. Tiket</TableHead>
                <TableHead className="border-r">Judul Tiket</TableHead>
                <TableHead className="hidden md:table-cell w-[100px] border-r">Status</TableHead>
                <TableHead className="hidden lg:table-cell border-r">Teknisi</TableHead>
                <TableHead className="hidden xl:table-cell w-[120px]">Terakhir</TableHead>
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
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/30 border-b last:border-0 cursor-pointer"
                    onClick={() => onViewDetail(item.ticketId)}
                  >
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
                    <TableCell className="hidden md:table-cell border-r">
                      {getStatusBadge(item.ticketStatus)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground border-r">
                      {item.technicianName || "-"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {formatDate(item.closedAt || item.completedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.lastPage > 1 && (
          <div className="flex items-center justify-between pt-4 max-md:flex-col max-md:gap-4">
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