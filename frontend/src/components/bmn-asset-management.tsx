import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Asset BMN interface
interface AssetBMN {
  id: number;
  kodeSatker: string;
  namaSatker: string;
  kodeBarang: string;
  namaBarang: string;
  nup: string;
  kondisi: string;
  merek: string;
  ruangan: string;
  serialNumber?: string;
  pengguna?: string;
  createdAt: string;
  updatedAt: string;
}

interface BmnAssetManagementProps {
  currentUser: { id: string; role: string };
}

export const BmnAssetManagement: React.FC<BmnAssetManagementProps> = () => {
  // State management
  const [assets, setAssets] = useState<AssetBMN[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKodeBarang, setSearchKodeBarang] = useState("");
  const [searchNup, setSearchNup] = useState("");
  const [kondisiFilter, setKondisiFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetBMN | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    kodeSatker: "",
    namaSatker: "",
    kodeBarang: "",
    namaBarang: "",
    nup: "",
    kondisi: "",
    merek: "",
    ruangan: "",
    serialNumber: "",
    pengguna: "",
  });

  // Fetch kondisi options on mount
  useEffect(() => {
    fetchAssets();
  }, [searchKodeBarang, searchNup, kondisiFilter, currentPage]);

  // Fetch assets dari backend
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: "15",
      });
      if (searchKodeBarang) params.append("kode_barang", searchKodeBarang);
      if (searchNup) params.append("nup", searchNup);
      if (kondisiFilter) params.append("kondisi", kondisiFilter);

      const response: any = await api.get(`/bmn-assets?${params.toString()}`);
      console.log("API Response:", response);
      console.log("Response data:", response.data);
      console.log("Assets array:", response.data);

      // Response langsung adalah data, bukan wrapped dalam .data lagi
      setAssets(response.data || []);
      const paginationData = response.meta;
      setTotalPages(paginationData?.last_page || 1);
    } catch (error: any) {
      console.error("Error fetching assets:", error);
      toast.error("Gagal memuat data asset");
      setAssets([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Handle create/edit dialog
  const handleOpenDialog = (asset?: AssetBMN) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        kodeSatker: asset.kodeSatker,
        namaSatker: asset.namaSatker,
        kodeBarang: asset.kodeBarang,
        namaBarang: asset.namaBarang,
        nup: asset.nup,
        kondisi: asset.kondisi,
        merek: asset.merek,
        ruangan: asset.ruangan,
        serialNumber: asset.serialNumber || "",
        pengguna: asset.pengguna || "",
      });
    } else {
      setEditingAsset(null);
      setFormData({
        kodeSatker: "",
        namaSatker: "",
        kodeBarang: "",
        namaBarang: "",
        nup: "",
        kondisi: "",
        merek: "",
        ruangan: "",
        serialNumber: "",
        pengguna: "",
      });
    }
    setShowDialog(true);
  };

  // Handle submit form (create/update)
  const handleSubmit = async () => {
    try {
      if (editingAsset) {
        await api.put(`/bmn-assets/${editingAsset.id}`, formData);
        toast.success("Asset berhasil diperbarui");
      } else {
        await api.post("/bmn-assets", formData);
        toast.success("Asset berhasil ditambahkan");
      }
      setShowDialog(false);
      fetchAssets();
    } catch (error: any) {
      console.error("Error saving asset:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan asset");
    }
  };

  // Handle delete asset
  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus asset ini?")) return;

    try {
      await api.delete(`/bmn-assets/${id}`);
      toast.success("Asset berhasil dihapus");
      fetchAssets();
    } catch (error: any) {
      console.error("Error deleting asset:", error);
      toast.error(error.response?.data?.message || "Gagal menghapus asset");
    }
  };

  // Handle download template
  const handleDownloadTemplate = async () => {
    try {
      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        toast.error("Token tidak ditemukan. Silakan login kembali");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API}/bmn-assets/template`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "template_asset_bmn.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Template berhasil diunduh");
    } catch (error: any) {
      console.error("Error downloading template:", error);
      toast.error(error.message || "Gagal mengunduh template");
    }
  };

  // Handle download all assets
  const handleDownloadAll = async () => {
    try {
      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        toast.error("Token tidak ditemukan. Silakan login kembali");
        return;
      }

      const loadingToast = toast.loading("Mengunduh data...");
      const response = await fetch(`${import.meta.env.VITE_API}/bmn-assets/export/all`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.dismiss(loadingToast);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `asset_bmn_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success("Berhasil mengunduh data asset");
    } catch (error: any) {
      console.error("Error downloading all assets:", error);
      toast.error(error.message || "Gagal mengunduh data");
    }
  };

  // Handle import Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("File harus berformat Excel (.xlsx atau .xls)");
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response: any = await api.post("/bmn-assets/import", formData);
      toast.success(response.message || "Import berhasil");
      if (response.data?.errors && response.data.errors.length > 0) {
        console.warn("Import warnings:", response.data.errors);
        toast.info(
          `${response.data.imported} berhasil, ${response.data.skipped} dilewati`
        );
      }
      fetchAssets();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Error importing Excel:", error);
      toast.error(error.response?.data?.message || "Gagal import Excel");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold  text-gray-900 flex items-center gap-2">
            Asset BMN
          </h1>
          <p className="text-gray-600 mt-1">Kelola data Barang Milik Negara</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} size="lg" className="rounded-full w-30 !outline !outline-black !outline-2" >
            <Download className="h-4 w-4" />
            Template
          </Button>
          <Button variant="outline" onClick={handleDownloadAll} size="lg" className="rounded-full w-30 !outline !outline-black !outline-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            className="rounded-full w-30 !outline !outline-black !outline-2"
            disabled={importing}
          >
            <Upload className="h-4 w-4" />
            {importing ? "Importing..." : "Import Excel"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
          />
          <Button onClick={() => handleOpenDialog()} size="lg" className="rounded-full w-30 !outline !outline-black !outline-2">
            <Plus className="h-4 w-4" />
            Tambah Asset
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari Kode Barang..."
                value={searchKodeBarang}
                onChange={(e) => {
                  setSearchKodeBarang(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari NUP..."
                value={searchNup}
                onChange={(e) => {
                  setSearchNup(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={kondisiFilter}
            onChange={(e) => {
              setKondisiFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-[200px] h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kondisi</option>
            <option value="Baik">Baik</option>
            <option value="Rusak Ringan">Rusak Ringan</option>
            <option value="Rusak Berat">Rusak Berat</option>
          </select>
        </div>
      </div>

{/* Table Section */}
      <div className="bg-white rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100/80">
            <TableRow>
              <TableHead className="w-[140px] border-r border-b font-semibold text-gray-900 whitespace-nowrap pl-4">
                Kode Barang
              </TableHead>
              <TableHead className="w-[80px] border-r border-b font-semibold text-gray-900 whitespace-nowrap text-center">
                NUP
              </TableHead>
              <TableHead className="min-w-[200px] border-r border-b font-semibold text-gray-900 whitespace-nowrap">
                Nama Barang
              </TableHead>
              <TableHead className="w-[150px] border-r border-b font-semibold text-gray-900 whitespace-nowrap">
                Merek
              </TableHead>
              <TableHead className="w-[120px] border-r border-b font-semibold text-gray-900 whitespace-nowrap text-center">
                Kondisi
              </TableHead>
              <TableHead className="w-[150px] border-r border-b font-semibold text-gray-900 whitespace-nowrap">
                Ruangan
              </TableHead>
              <TableHead className="w-[150px] border-r border-b font-semibold text-gray-900 whitespace-nowrap">
                Pengguna
              </TableHead>
              <TableHead className="w-[1%] border-b font-semibold text-gray-900 whitespace-nowrap text-center px-2">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 border-b">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                    <span className="text-sm">Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-500 border-b">
                  <div className="flex flex-col items-center justify-center">
                    <p className="font-medium text-gray-900">Tidak ada data asset</p>
                    <p className="text-sm">Sesuaikan filter pencarian Anda</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow 
                  key={asset.id} 
                  className="group hover:bg-blue-50/40 transition-colors"
                >
                  {/* Kode Barang */}
                  <TableCell className="border-r border-b font-mono text-sm pl-4 align-middle bg-gray-50/50 group-hover:bg-blue-50/40">
                    {asset.kodeBarang}
                  </TableCell>
                  
                  {/* NUP */}
                  <TableCell className="border-r border-b font-mono text-sm text-center align-middle">
                    {asset.nup}
                  </TableCell>
                  
                  {/* Nama Barang */}
                  <TableCell className="border-r border-b font-medium align-middle">
                    {asset.namaBarang}
                  </TableCell>
                  
                  {/* Merek */}
                  <TableCell className="border-r border-b text-sm text-gray-600 align-middle">
                    {asset.merek || "-"}
                  </TableCell>
                  
                  {/* Kondisi */}
                  <TableCell className="border-r border-b text-center align-middle p-2">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        asset.kondisi === "Baik"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : asset.kondisi === "Rusak Ringan"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {asset.kondisi}
                    </span>
                  </TableCell>
                  
                  {/* Ruangan */}
                  <TableCell className="border-r border-b text-sm text-gray-600 align-middle">
                    {asset.ruangan || "-"}
                  </TableCell>
                  
                  {/* Pengguna */}
                  <TableCell className="border-r border-b text-sm text-gray-600 align-middle">
                    {asset.pengguna || "-"}
                  </TableCell>
                  
                  {/* Aksi - Compact Width */}
                  <TableCell className="border-b px-2 py-1 align-middle text-center whitespace-nowrap bg-white/50 group-hover:bg-blue-50/40">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-sm"
                        onClick={() => handleOpenDialog(asset)}
                        title="Edit Asset"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-sm"
                        onClick={() => handleDelete(asset.id)}
                        title="Hapus Asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
            <div className="text-xs text-gray-500">
              Halaman <span className="font-medium text-gray-900">{currentPage}</span> dari {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 text-xs bg-white hover:bg-gray-100"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 text-xs bg-white hover:bg-gray-100"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? "Edit Asset BMN" : "Tambah Asset BMN"}
            </DialogTitle>
            <DialogDescription>
              {editingAsset
                ? "Perbarui informasi asset BMN"
                : "Masukkan data asset BMN baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kodeSatker">Kode Satker</Label>
              <Input
                id="kodeSatker"
                value={formData.kodeSatker}
                onChange={(e) =>
                  setFormData({ ...formData, kodeSatker: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namaSatker">Nama Satker</Label>
              <Input
                id="namaSatker"
                value={formData.namaSatker}
                onChange={(e) =>
                  setFormData({ ...formData, namaSatker: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kodeBarang">Kode Barang *</Label>
              <Input
                id="kodeBarang"
                value={formData.kodeBarang}
                onChange={(e) =>
                  setFormData({ ...formData, kodeBarang: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nup">NUP *</Label>
              <Input
                id="nup"
                value={formData.nup}
                onChange={(e) =>
                  setFormData({ ...formData, nup: e.target.value })
                }
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="namaBarang">Nama Barang *</Label>
              <Input
                id="namaBarang"
                value={formData.namaBarang}
                onChange={(e) =>
                  setFormData({ ...formData, namaBarang: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merek">Merek</Label>
              <Input
                id="merek"
                value={formData.merek}
                onChange={(e) =>
                  setFormData({ ...formData, merek: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kondisi">Kondisi *</Label>
              <select
                id="kondisi"
                value={formData.kondisi}
                onChange={(e) =>
                  setFormData({ ...formData, kondisi: e.target.value })
                }
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Pilih kondisi</option>
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruangan">Ruangan</Label>
              <Input
                id="ruangan"
                value={formData.ruangan}
                onChange={(e) =>
                  setFormData({ ...formData, ruangan: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="pengguna">Pengguna</Label>
              <Input
                id="pengguna"
                value={formData.pengguna}
                onChange={(e) =>
                  setFormData({ ...formData, pengguna: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingAsset ? "Simpan Perubahan" : "Tambah Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
