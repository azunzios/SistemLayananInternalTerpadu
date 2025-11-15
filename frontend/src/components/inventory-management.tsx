import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getInventory, saveInventory } from '../lib/storage';
import type { User, InventoryItem } from '../types';

interface InventoryManagementProps {
  currentUser: User;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  currentUser,
}) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(getInventory());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProcurementDialog, setShowProcurementDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    stock: 0,
    location: '',
    condition: 'baru',
    minimumStock: 0,
  });
  
  // Procurement form state
  const [procurementData, setProcurementData] = useState({
    jumlahPengadaan: 0,
    estimasiHargaSatuan: '',
    sumberPengadaan: '',
    estimasiWaktu: '',
    alasanPengadaan: '',
  });

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(inventory.map(item => item.category)));

  // Low stock items
  const lowStockItems = inventory.filter(item => item.stock <= item.minimumStock);

  const handleAdd = () => {
    if (!formData.name || !formData.category || formData.stock === undefined) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    const newItem: InventoryItem = {
      id: `inv_${Date.now()}`,
      name: formData.name,
      category: formData.category,
      stock: formData.stock,
      location: formData.location || '',
      condition: formData.condition || 'baru',
      minimumStock: formData.minimumStock || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...inventory, newItem];
    setInventory(updated);
    saveInventory(updated);
    toast.success('Item berhasil ditambahkan ke inventory');
    resetForm();
    setShowAddDialog(false);
  };

  const handleEdit = () => {
    if (!selectedItem) return;

    const updated = inventory.map(item =>
      item.id === selectedItem.id
        ? { ...item, ...formData, updatedAt: new Date().toISOString() }
        : item
    );

    setInventory(updated);
    saveInventory(updated);
    toast.success('Item berhasil diperbarui');
    resetForm();
    setShowEditDialog(false);
  };

  const handleDelete = () => {
    if (!selectedItem) return;

    const updated = inventory.filter(item => item.id !== selectedItem.id);
    setInventory(updated);
    saveInventory(updated);
    toast.success('Item berhasil dihapus');
    setSelectedItem(null);
    setShowDeleteDialog(false);
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      stock: item.stock,
      location: item.location,
      condition: item.condition,
      minimumStock: item.minimumStock,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      stock: 0,
      location: '',
      condition: 'baru',
      minimumStock: 0,
    });
    setSelectedItem(null);
  };

  // Procurement handlers
  const openProcurementDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    // Suggest quantity based on deficit + buffer
    const suggestedQuantity = Math.max(item.minimumStock - item.stock + 10, 1);
    setProcurementData({
      jumlahPengadaan: suggestedQuantity,
      estimasiHargaSatuan: '',
      sumberPengadaan: '',
      estimasiWaktu: '',
      alasanPengadaan: '',
    });
    setShowProcurementDialog(true);
  };

  const handleProcurement = () => {
    if (!selectedItem) return;

    // Validation
    if (!procurementData.jumlahPengadaan || procurementData.jumlahPengadaan <= 0) {
      toast.error('Jumlah pengadaan harus lebih dari 0');
      return;
    }
    if (!procurementData.estimasiHargaSatuan || !procurementData.sumberPengadaan || 
        !procurementData.estimasiWaktu || !procurementData.alasanPengadaan) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    // Here you would typically create a procurement request ticket or record
    // For now, we'll just show a success message
    const totalBiaya = parseInt(procurementData.estimasiHargaSatuan.replace(/\D/g, '')) * procurementData.jumlahPengadaan;

    toast.success(`Pengadaan berhasil dibuat untuk ${selectedItem.name}!`, {
      description: `${procurementData.jumlahPengadaan} unit - Total: Rp ${totalBiaya.toLocaleString('id-ID')}`
    });

    setShowProcurementDialog(false);
    setProcurementData({
      jumlahPengadaan: 0,
      estimasiHargaSatuan: '',
      sumberPengadaan: '',
      estimasiWaktu: '',
      alasanPengadaan: '',
    });
    setSelectedItem(null);
  };

  // Calculate total estimated cost
  const totalEstimasiBiaya = useMemo(() => {
    if (!procurementData.estimasiHargaSatuan || !procurementData.jumlahPengadaan) return 0;
    const hargaSatuan = parseInt(procurementData.estimasiHargaSatuan.replace(/\D/g, '')) || 0;
    return hargaSatuan * procurementData.jumlahPengadaan;
  }, [procurementData.estimasiHargaSatuan, procurementData.jumlahPengadaan]);

  // Format currency
  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '');
    if (!number) return '';
    return parseInt(number).toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Inventory</h1>
          <p className="text-gray-500 mt-1">Kelola stok barang, sparepart, dan proses pengadaan</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Item
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Semua Item ({inventory.length})</TabsTrigger>
          <TabsTrigger value="low-stock" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Stock Menipis ({lowStockItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Cari Item</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nama atau kategori..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Item</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Min. Stock</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Kondisi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        {inventory.length === 0 ? 'Belum ada item di inventory' : 'Tidak ada hasil'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <span className={item.stock <= item.minimumStock ? 'text-red-600 font-semibold' : ''}>
                            {item.stock}
                          </span>
                        </TableCell>
                        <TableCell>{item.minimumStock}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>
                          <Badge variant={item.condition === 'baru' ? 'default' : 'secondary'}>
                            {item.condition === 'baru' ? 'Baru' : 'Bekas Baik'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.stock <= item.minimumStock ? (
                            <Badge variant="destructive" className="gap-1">
                              <TrendingDown className="h-3 w-3" />
                              Menipis
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1 bg-green-600">
                              <TrendingUp className="h-3 w-3" />
                              Tersedia
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(item)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Item dengan Stock Menipis
              </CardTitle>
              <CardDescription>
                Item yang stock-nya sudah mencapai atau di bawah minimum stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 text-green-300" />
                  <p>Semua item memiliki stock yang cukup</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          Stock: {item.stock} / Min: {item.minimumStock}
                        </p>
                        <p className="text-xs text-gray-500">Kategori: {item.category}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openProcurementDialog(item)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Buat Pengadaan
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Item Baru</DialogTitle>
            <DialogDescription>Tambahkan item baru ke inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Item *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Mouse Wireless Logitech"
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Contoh: Elektronik"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock *</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Min. Stock</Label>
                <Input
                  type="number"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Contoh: Gudang Lantai 2"
              />
            </div>
            <div className="space-y-2">
              <Label>Kondisi</Label>
              <Select
                value={formData.condition}
                onValueChange={(value: 'baru' | 'bekas_baik') => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baru">Baru</SelectItem>
                  <SelectItem value="bekas_baik">Bekas Baik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleAdd}>Tambah Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Perbarui informasi item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Item *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock *</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Min. Stock</Label>
                <Input
                  type="number"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Kondisi</Label>
              <Select
                value={formData.condition}
                onValueChange={(value: 'baru' | 'bekas_baik') => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baru">Baru</SelectItem>
                  <SelectItem value="bekas_baik">Bekas Baik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleEdit}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus item "{selectedItem?.name}"? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItem(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Procurement Dialog */}
      <Dialog open={showProcurementDialog} onOpenChange={setShowProcurementDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Buat Pengadaan
            </DialogTitle>
            <DialogDescription>
              Buat rencana pengadaan untuk {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Item Info */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Item</p>
                  <p className="font-medium">{selectedItem?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Stock Saat Ini</p>
                  <p className="font-medium text-red-600">{selectedItem?.stock}</p>
                </div>
                <div>
                  <p className="text-gray-600">Minimum Stock</p>
                  <p className="font-medium">{selectedItem?.minimumStock}</p>
                </div>
              </div>
            </div>

            {/* Jumlah Pengadaan */}
            <div className="space-y-2">
              <Label>Jumlah Pengadaan (Unit) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                placeholder="0"
                min="1"
                value={procurementData.jumlahPengadaan || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setProcurementData({ ...procurementData, jumlahPengadaan: value });
                }}
              />
              <p className="text-xs text-gray-500">
                Saran: {selectedItem ? (selectedItem.minimumStock - selectedItem.stock + 10) : 0} unit (kekurangan + buffer)
              </p>
            </div>

            {/* Estimasi Harga Satuan */}
            <div className="space-y-2">
              <Label>Estimasi Harga Satuan <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">Rp</span>
                <Input
                  type="text"
                  placeholder="0"
                  value={procurementData.estimasiHargaSatuan}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setProcurementData({ ...procurementData, estimasiHargaSatuan: formatted });
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Total Estimasi Biaya (Read-only, calculated) */}
            <div className="space-y-2">
              <Label>Total Estimasi Biaya</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">Rp</span>
                <Input
                  type="text"
                  value={totalEstimasiBiaya.toLocaleString('id-ID')}
                  readOnly
                  className="pl-10 bg-gray-50 font-semibold text-blue-600"
                />
              </div>
              <p className="text-xs text-gray-500">
                Dihitung otomatis: Jumlah Pengadaan × Harga Satuan
              </p>
            </div>

            {/* Sumber Pengadaan */}
            <div className="space-y-2">
              <Label>Sumber Pengadaan <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Contoh: Toko ABC, PT. XYZ, dll"
                value={procurementData.sumberPengadaan}
                onChange={(e) => setProcurementData({ ...procurementData, sumberPengadaan: e.target.value })}
              />
            </div>

            {/* Estimasi Waktu Pengadaan */}
            <div className="space-y-2">
              <Label>Estimasi Waktu Pengadaan <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={procurementData.estimasiWaktu}
                onChange={(e) => setProcurementData({ ...procurementData, estimasiWaktu: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Alasan Pengadaan */}
            <div className="space-y-2">
              <Label>Alasan Pengadaan <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Jelaskan alasan pengadaan barang ini..."
                value={procurementData.alasanPengadaan}
                onChange={(e) => setProcurementData({ ...procurementData, alasanPengadaan: e.target.value })}
                rows={4}
              />
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ Data pengadaan ini akan dicatat dalam sistem untuk tracking dan approval.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowProcurementDialog(false);
                setProcurementData({
                  jumlahPengadaan: 0,
                  estimasiHargaSatuan: '',
                  sumberPengadaan: '',
                  estimasiWaktu: '',
                  alasanPengadaan: '',
                });
                setSelectedItem(null);
              }}
            >
              Batal
            </Button>
            <Button onClick={handleProcurement}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buat Pengadaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
