import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Truck, Plus, Trash2 } from 'lucide-react';
import type { WorkOrderType } from '@/types';

interface CreateWorkOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: WorkOrderType;
    spareparts?: { name: string; qty: number; unit: string; remarks?: string }[];
    vendorInfo?: { name?: string; contact?: string; description?: string };
  }) => void;
}

export const CreateWorkOrderDialog: React.FC<CreateWorkOrderDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [workOrderType, setWorkOrderType] = useState<WorkOrderType>('sparepart');
  
  // Sparepart state
  const [spareparts, setSpareparts] = useState([
    { name: '', qty: 1, unit: 'unit', remarks: '' }
  ]);
  
  // Vendor state
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorDescription, setVendorDescription] = useState('');

  const handleAddSparepart = () => {
    setSpareparts([...spareparts, { name: '', qty: 1, unit: 'unit', remarks: '' }]);
  };

  const handleRemoveSparepart = (index: number) => {
    if (spareparts.length > 1) {
      setSpareparts(spareparts.filter((_, i) => i !== index));
    }
  };

  const handleSparepartChange = (index: number, field: string, value: any) => {
    const updated = [...spareparts];
    updated[index] = { ...updated[index], [field]: value };
    setSpareparts(updated);
  };

  const handleSubmit = () => {
    if (workOrderType === 'sparepart') {
      // Validate spareparts
      const validSpareparts = spareparts.filter(sp => sp.name.trim() !== '');
      if (validSpareparts.length === 0) {
        alert('Harap isi minimal satu sparepart');
        return;
      }
      onSubmit({ type: 'sparepart', spareparts: validSpareparts });
    } else {
      // Validate vendor
      if (!vendorDescription.trim()) {
        alert('Harap isi deskripsi pekerjaan vendor');
        return;
      }
      onSubmit({
        type: 'vendor',
        vendorInfo: {
          name: vendorName,
          contact: vendorContact,
          description: vendorDescription,
        }
      });
    }
  };

  const resetForm = () => {
    setWorkOrderType('sparepart');
    setSpareparts([{ name: '', qty: 1, unit: 'unit', remarks: '' }]);
    setVendorName('');
    setVendorContact('');
    setVendorDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Work Order</DialogTitle>
          <DialogDescription>
            Pilih jenis work order yang diperlukan untuk menyelesaikan perbaikan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Work Order Type Selection */}
          <div className="space-y-3">
            <Label>Jenis Work Order</Label>
            <RadioGroup value={workOrderType} onValueChange={(v) => setWorkOrderType(v as WorkOrderType)}>
              <div className="grid grid-cols-2 gap-3">
                <Card className={workOrderType === 'sparepart' ? 'border-blue-500 border-2' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sparepart" id="sparepart" />
                      <Label htmlFor="sparepart" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Package className="h-5 w-5 text-blue-600" />
                        <div>
                          <div>Sparepart</div>
                          <div className="text-xs text-gray-500">Pengadaan suku cadang</div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={workOrderType === 'vendor' ? 'border-purple-500 border-2' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vendor" id="vendor" />
                      <Label htmlFor="vendor" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Truck className="h-5 w-5 text-purple-600" />
                        <div>
                          <div>Vendor</div>
                          <div className="text-xs text-gray-500">Pekerjaan pihak ketiga</div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>
          </div>

          {/* Sparepart Form */}
          {workOrderType === 'sparepart' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Daftar Sparepart</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddSparepart}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Item
                </Button>
              </div>

              <div className="space-y-3">
                {spareparts.map((sp, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Item #{index + 1}</Label>
                        {spareparts.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="link"
                            onClick={() => handleRemoveSparepart(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label htmlFor={`name-${index}`}>Nama Sparepart *</Label>
                          <Input
                            id={`name-${index}`}
                            placeholder="Contoh: Hard Disk 1TB"
                            value={sp.name}
                            onChange={(e) => handleSparepartChange(index, 'name', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`qty-${index}`}>Jumlah *</Label>
                          <Input
                            id={`qty-${index}`}
                            type="number"
                            min="1"
                            value={sp.qty}
                            onChange={(e) => handleSparepartChange(index, 'qty', parseInt(e.target.value) || 1)}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`unit-${index}`}>Satuan</Label>
                          <Input
                            id={`unit-${index}`}
                            placeholder="unit/pcs/buah"
                            value={sp.unit}
                            onChange={(e) => handleSparepartChange(index, 'unit', e.target.value)}
                          />
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor={`remarks-${index}`}>Keterangan</Label>
                          <Input
                            id={`remarks-${index}`}
                            placeholder="Spesifikasi atau catatan tambahan"
                            value={sp.remarks}
                            onChange={(e) => handleSparepartChange(index, 'remarks', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Vendor Form */}
          {workOrderType === 'vendor' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="vendor-name">Nama Vendor (Opsional)</Label>
                <Input
                  id="vendor-name"
                  placeholder="Contoh: CV. Maju Jaya"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="vendor-contact">Kontak Vendor (Opsional)</Label>
                <Input
                  id="vendor-contact"
                  placeholder="No. telepon atau email"
                  value={vendorContact}
                  onChange={(e) => setVendorContact(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="vendor-description">Deskripsi Pekerjaan *</Label>
                <Textarea
                  id="vendor-description"
                  placeholder="Jelaskan pekerjaan yang perlu dilakukan vendor..."
                  rows={5}
                  value={vendorDescription}
                  onChange={(e) => setVendorDescription(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit}>
            Submit Work Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
