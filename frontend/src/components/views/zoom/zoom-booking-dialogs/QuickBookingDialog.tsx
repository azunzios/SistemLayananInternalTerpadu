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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DatePicker from '@/components/ui/date-picker';
import { Clock, Video } from 'lucide-react';
import type { QuickBookingFormState } from '@/components/views/zoom/zoom-booking-types';
import type { User } from '@/types';

type ChangeHandler<T> = (changes: Partial<T>) => void;
type ValueHandler<T> = (value: T) => void;
type VoidHandler = () => void;

interface QuickBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingForm: QuickBookingFormState;
  onBookingFormChange: ChangeHandler<QuickBookingFormState>;
  quickBookingDate: Date | undefined;
  onQuickBookingDateChange: ValueHandler<Date | undefined>;
  onSubmit: VoidHandler;
  onCancel: VoidHandler;
  isSubmitting: boolean;
  coHostQuery: string;
  onCoHostQueryChange: ValueHandler<string>;
  onSearchCoHosts: VoidHandler;
  isSearchingCoHost: boolean;
  coHostResults: User[];
  selectedCoHostIds: string[];
  onSelectCoHost: ValueHandler<string>;
  onRemoveCoHost: ValueHandler<string>;
  availableUsers: User[];
  attachments: File[];
  onAttachmentsChange: (files: File[]) => void;
}

export const QuickBookingDialog: React.FC<QuickBookingDialogProps> = ({
  open,
  onOpenChange,
  bookingForm,
  onBookingFormChange,
  quickBookingDate,
  onQuickBookingDateChange,
  onSubmit,
  onCancel,
  isSubmitting,
  coHostQuery,
  onCoHostQueryChange,
  onSearchCoHosts,
  isSearchingCoHost,
  coHostResults,
  selectedCoHostIds,
  onSelectCoHost,
  onRemoveCoHost,
  availableUsers,
  attachments,
  onAttachmentsChange,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File ${file.name} terlalu besar. Maksimal 10MB per file.`);
        return false;
      }
      return true;
    });

    // Gabungkan dengan file yang sudah ada
    const combined = [...attachments, ...validFiles];

    // Limit to 5 files
    if (combined.length > 5) {
      alert('Maksimal 5 file yang dapat diupload.');
      onAttachmentsChange(combined.slice(0, 5));
    } else {
      onAttachmentsChange(combined);
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(updated);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] md:max-w-2xl overflow-y-auto">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-100 p-2 rounded-lg">
              <Video className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <DialogTitle>Booking Zoom Meeting</DialogTitle>
              <DialogDescription>
                Lengkapi form di bawah untuk mengajukan zoom meeting
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quickTitle">Judul Meeting *</Label>
            <Input
              id="quickTitle"
              placeholder="Contoh: Rapat Koordinasi Tim"
              value={bookingForm.title}
              onChange={event => onBookingFormChange({ title: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quickPurpose">Deskripsi Peminjaman Zoom *</Label>
            <Textarea
              id="quickPurpose"
              placeholder="Jelaskan tujuan dan agenda meeting..."
              value={bookingForm.purpose}
              onChange={event => onBookingFormChange({ purpose: event.target.value })}
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm mb-3">Detail Booking Zoom</h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quickDate">Tanggal Meeting *</Label>
                <DatePicker
                  value={quickBookingDate}
                  onChange={onQuickBookingDateChange}
                  placeholder="Pilih tanggal meeting"
                  disabled={date => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
                <p className="text-xs text-blue-700">
                  Klik tanggal pada kalender untuk memilih. Kalender akan tertutup otomatis.
                </p>
                <p className="text-xs text-gray-500">Tanggal yang sudah lewat tidak dapat dipilih.</p>
                <p className="text-xs text-orange-600 font-medium">
                  ⚠️ Sistem menggunakan Waktu Indonesia Tengah (WITA - NTB). Pastikan waktu yang dipilih belum lewat.
                </p>
              </div>

              <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quickStartTime">Waktu Mulai *</Label>
                  <Input
                    id="quickStartTime"
                    type="time"
                    value={bookingForm.startTime}
                    onChange={event => onBookingFormChange({ startTime: event.target.value })}
                    className="[&::-webkit-calendar-picker-indicator]:order-first [&::-webkit-calendar-picker-indicator]:mr-2 !p-1"
                    style={{ direction: 'ltr' }}
                  />
                  <p className="text-xs text-gray-500">Waktu Indonesia Tengah (WITA)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quickEndTime">Waktu Selesai *</Label>
                  <Input
                    id="quickEndTime"
                    type="time"
                    value={bookingForm.endTime}
                    onChange={event => onBookingFormChange({ endTime: event.target.value })}
                    className="[&::-webkit-calendar-picker-indicator]:order-first [&::-webkit-calendar-picker-indicator]:mr-2 !p-1"
                    style={{ direction: 'ltr' }}
                  />
                  <p className="text-xs text-gray-500">Waktu Indonesia Tengah (WITA)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coHostSearch">Co-Host (opsional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="coHostSearch"
                    placeholder="Ketik minimal 4 huruf nama/email"
                    value={coHostQuery}
                    onChange={event => onCoHostQueryChange(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onSearchCoHosts}
                    disabled={coHostQuery.trim().length < 4 || isSearchingCoHost}
                  >
                    {isSearchingCoHost ? 'Mencari...' : 'Cari'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Hanya pegawai yang tampil. Klik tombol tambah (+) untuk memasukkan ke daftar.
                </p>
                {coHostResults.length > 0 && (
                  <div className="border rounded-md divide-y max-h-48 overflow-auto">
                    {coHostResults.map(user => {
                      const added = selectedCoHostIds.includes(String(user.id));
                      return (
                        <div key={user.id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-gray-500">{user.email}</div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={added ? 'secondary' : 'default'}
                            onClick={() => onSelectCoHost(String(user.id))}
                            disabled={added}
                          >
                            {added ? 'Ditambahkan' : '+'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedCoHostIds.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium mb-1">Daftar Co-Host:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCoHostIds.map(id => {
                        const user = availableUsers.find(candidate => String(candidate.id) === String(id));
                        if (!user) return null;
                        return (
                          <span key={id} className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-xs">
                            <span>{user.name}</span>
                            <button
                              type="button"
                              className="text-gray-500 hover:text-gray-700"
                              onClick={() => onRemoveCoHost(id)}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quickBreakoutRooms">Jumlah Breakout Room *</Label>
                  <Input
                    id="quickBreakoutRooms"
                    type="number"
                    placeholder="0"
                    value={bookingForm.breakoutRooms}
                    onChange={event => onBookingFormChange({ breakoutRooms: event.target.value })}
                    min="0"
                    max="50"
                  />
                  <p className="text-xs text-gray-500">Isikan 0 jika tidak memerlukan breakout room</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quickParticipants">Jumlah Peserta Zoom *</Label>
                  <Input
                    id="quickParticipants"
                    type="number"
                    placeholder="10"
                    value={bookingForm.participants}
                    onChange={event => onBookingFormChange({ participants: event.target.value })}
                    min="2"
                    max="300"
                  />
                  <p className="text-xs text-gray-500">Estimasi jumlah peserta yang akan hadir</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quickFile">Upload File Pendukung (Opsional)</Label>
                <Input
                  id="quickFile"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500">
                  Format: PDF, DOC, XLS, PPT, JPG, PNG (MAX: 2MB/file)
                </p>

                {attachments && attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Mengirim...' : 'Ajukan Tiket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
