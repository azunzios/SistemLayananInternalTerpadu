import React, { useState, useEffect, useRef } from "react";
import {
  Package,
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-8 w-8" />
            Asset BMN
          </h1>
          <p className="text-gray-600 mt-1">Kelola data Barang Milik Negara</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} size="lg">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button variant="outline" onClick={handleDownloadAll} size="lg">
            <Download className="h-4 w-4 mr-2" />
            Download Semua
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            disabled={importing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? "Importing..." : "Import Excel"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
          />
          <Button onClick={() => handleOpenDialog()} size="lg">
            <Plus className="h-4 w-4 mr-2" />
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

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Barang</TableHead>
              <TableHead>NUP</TableHead>
              <TableHead>Nama Barang</TableHead>
              <TableHead>Merek</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead>Ruangan</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  Tidak ada data asset
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-mono">
                    {asset.kodeBarang}
                  </TableCell>
                  <TableCell className="font-mono">{asset.nup}</TableCell>
                  <TableCell>{asset.namaBarang}</TableCell>
                  <TableCell>{asset.merek}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        asset.kondisi === "Baik"
                          ? "bg-green-100 text-green-800"
                          : asset.kondisi === "Rusak Ringan"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {asset.kondisi}
                    </span>
                  </TableCell>
                  <TableCell>{asset.ruangan}</TableCell>
                  <TableCell>{asset.pengguna || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(asset)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(asset.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
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
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
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
