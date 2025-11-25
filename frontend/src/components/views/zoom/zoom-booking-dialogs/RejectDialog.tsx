import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle } from 'lucide-react';

type ValueHandler<T> = (value: T) => void;
type VoidHandler = () => void;

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectionReason: string;
  onRejectionReasonChange: ValueHandler<string>;
  onSubmit: VoidHandler;
  onCancel: VoidHandler;
}

export const RejectDialog: React.FC<RejectDialogProps> = ({
  open,
  onOpenChange,
  rejectionReason,
  onRejectionReasonChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tolak Booking Zoom</DialogTitle>
          <DialogDescription>Masukkan alasan penolakan booking</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Alasan Penolakan *</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Contoh: Jadwal bentrok dengan kegiatan lain / Prioritas kegiatan rendah"
              value={rejectionReason}
              onChange={event => onRejectionReasonChange(event.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500">Jelaskan alasan penolakan dengan jelas</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onSubmit}>
            <XCircle className="h-4 w-4 mr-2" />
            Konfirmasi Tolak
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
