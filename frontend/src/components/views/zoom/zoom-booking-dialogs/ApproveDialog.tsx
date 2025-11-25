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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';
import type { ApprovalFormState } from '@/components/views/zoom/zoom-booking-types';

type ChangeHandler<T> = (changes: Partial<T>) => void;
type VoidHandler = () => void;

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvalForm: ApprovalFormState;
  onApprovalFormChange: ChangeHandler<ApprovalFormState>;
  onSubmit: VoidHandler;
  onCancel: VoidHandler;
  zoomProAccounts: any[]; // ZoomAccountUi[] dari database
}

export const ApproveDialog: React.FC<ApproveDialogProps> = ({
  open,
  onOpenChange,
  approvalForm,
  onApprovalFormChange,
  onSubmit,
  onCancel,
  zoomProAccounts,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Setujui Booking Zoom</DialogTitle>
          <DialogDescription>
            Masukkan link meeting dan passcode yang telah dibuat di Portal Web Zoom
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Catatan:</strong> Sebelum menyetujui, pastikan Anda sudah membuat meeting di Portal Web Zoom terlebih dahulu.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingLink">Link Meeting Zoom *</Label>
            <Input
              id="meetingLink"
              placeholder="https://zoom.us/j/123456789"
              value={approvalForm.meetingLink}
              onChange={event => onApprovalFormChange({ meetingLink: event.target.value })}
            />
            <p className="text-xs text-gray-500">Contoh: https://zoom.us/j/123456789</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode Meeting *</Label>
            <Input
              id="passcode"
              placeholder="ABC123"
              value={approvalForm.passcode}
              onChange={event => onApprovalFormChange({ passcode: event.target.value })}
            />
            <p className="text-xs text-gray-500">Masukkan passcode yang telah dibuat</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoomAccount">Akun Zoom *</Label>
            <Select
              value={approvalForm.zoomAccount}
              onValueChange={value => onApprovalFormChange({ zoomAccount: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun Zoom Pro" />
              </SelectTrigger>
              <SelectContent>
                {zoomProAccounts.map(account => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Pilih akun Zoom Pro yang digunakan untuk meeting ini</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button onClick={onSubmit}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Konfirmasi Setujui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
