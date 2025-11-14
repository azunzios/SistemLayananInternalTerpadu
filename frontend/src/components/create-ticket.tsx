import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Wrench, Video, ArrowLeft, X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { getTickets, saveTickets, generateTicketNumber, addNotification, getUsers } from '../lib/storage';
import type { User, Ticket, TicketType, UrgencyLevel, PriorityLevel } from '../types';

interface CreateTicketProps {
  currentUser: User;
  ticketType: TicketType;
  onTicketCreated: () => void;
  onCancel: () => void;
}

export const CreateTicket: React.FC<CreateTicketProps> = ({
  currentUser,
  ticketType,
  onTicketCreated,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'P3' as PriorityLevel,
    
    // Perbaikan - New fields
    assetCode: '',      // Kode Barang
    assetNUP: '',       // NUP
    assetLocation: '',  // Lokasi (manual input)
    
    // Zoom Meeting
    meetingDate: '',
    startTime: '',
    endTime: '',
    estimatedParticipants: 10,
    coHostName: '',
    breakoutRooms: 0,
    meetingCategory: '',
    unitKerja: currentUser.unitKerja,
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const getTicketIcon = () => {
    switch (ticketType) {
      case 'perbaikan':
        return Wrench;
      case 'zoom_meeting':
        return Video;
      default:
        return Wrench;
    }
  };

  const getTicketTitle = () => {
    switch (ticketType) {
      case 'perbaikan':
        return 'Ajukan Perbaikan Barang';
      case 'zoom_meeting':
        return 'Booking Zoom Meeting';
      default:
        return 'Buat Tiket';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Judul harus diisi');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Deskripsi harus diisi');
      return;
    }

    // Type-specific validation
    if (ticketType === 'perbaikan') {
      if (!formData.assetCode || !formData.assetNUP || !formData.assetLocation) {
        toast.error('Mohon lengkapi semua field yang wajib diisi');
        return;
      }
    }

    if (ticketType === 'zoom_meeting') {
      if (!formData.coHostName) {
        toast.error('Nama penerima akses co-host harus diisi');
        return;
      }

      if (!formData.meetingDate) {
        toast.error('Tanggal meeting harus dipilih');
        return;
      }

      if (!formData.startTime || !formData.endTime) {
        toast.error('Waktu mulai dan waktu selesai harus diisi');
        return;
      }

      // Validate start time is before end time
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        toast.error('Waktu selesai harus lebih besar dari waktu mulai');
        return;
      }

      if (formData.estimatedParticipants < 2) {
        toast.error('Jumlah peserta minimal 2 orang');
        return;
      }
    }

    setIsSubmitting(true);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create ticket
    const ticketNumber = generateTicketNumber(ticketType);
    const newTicket: Ticket = {
      id: `ticket_${Date.now()}`,
      ticketNumber,
      type: ticketType,
      title: formData.title,
      description: formData.description,
      status: ticketType === 'perbaikan' ? 'submitted' : 'menunggu_review',
      priority: formData.priority,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phone,
      unitKerja: currentUser.unitKerja,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Perbaikan specific fields
      assetCode: ticketType === 'perbaikan' ? formData.assetCode : undefined,
      assetNUP: ticketType === 'perbaikan' ? formData.assetNUP : undefined,
      assetLocation: ticketType === 'perbaikan' ? formData.assetLocation : undefined,
      
      data: {
        ...formData,
        attachmentCount: attachments.length,
      },
      attachments: [],
      timeline: [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          action: 'CREATED',
          actor: currentUser.name,
          details: ticketType === 'perbaikan' ? 'Tiket perbaikan diajukan' : 'Tiket dibuat',
        },
      ],
    };

    const tickets = getTickets();
    const updatedTickets = [...tickets, newTicket];
    saveTickets(updatedTickets);

    // Send notification to admin
    const users = getUsers();
    const admins = users.filter(u => u.role === 'admin_layanan');
    admins.forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'Tiket Baru',
        message: `${currentUser.name} mengajukan tiket: ${formData.title}`,
        type: 'info',
        read: false,
        link: 'tickets',
      });
    });

    toast.success(`Tiket ${ticketNumber} berhasil dibuat!`);
    setIsSubmitting(false);
    onTicketCreated();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (attachments.length + newFiles.length > 5) {
        toast.error('Maksimal 5 file');
        return;
      }
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };



  const Icon = getTicketIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>{getTicketTitle()}</CardTitle>
                <CardDescription>
                  Lengkapi form di bawah untuk mengajukan {ticketType.replace('_', ' ')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Common Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {ticketType === 'zoom_meeting' ? 'Judul Meeting *' : 'Judul *'}
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={
                      ticketType === 'perbaikan'
                        ? 'Contoh: Laptop tidak bisa booting'
                        : 'Contoh: Rapat Koordinasi Tim'
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {ticketType === 'zoom_meeting' ? 'Deskripsi Peminjaman Zoom *' : 'Deskripsi Detail *'}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={
                      ticketType === 'zoom_meeting'
                        ? 'Jelaskan tujuan dan agenda meeting...'
                        : 'Jelaskan detail masalah...'
                    }
                    rows={4}
                    required
                  />
                </div>

                {ticketType === 'perbaikan' && (
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioritas *</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value: PriorityLevel) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P1">P1 - Critical (Segera, kurang dari 4 jam)</SelectItem>
                        <SelectItem value="P2">P2 - High (1 hari kerja)</SelectItem>
                        <SelectItem value="P3">P3 - Medium (3 hari kerja)</SelectItem>
                        <SelectItem value="P4">P4 - Low (1 minggu)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Pilih prioritas sesuai tingkat urgensi perbaikan
                    </p>
                  </div>
                )}
              </div>

              {/* Type-specific Fields */}
              {ticketType === 'perbaikan' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Informasi Barang BMN</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="assetCode">Kode Barang *</Label>
                    <Input
                      id="assetCode"
                      value={formData.assetCode}
                      onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                      placeholder="Contoh: KB-2024-001"
                      required
                    />
                    <p className="text-xs text-gray-500">Ketik kode barang BMN yang akan diperbaiki</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetNUP">NUP (Nomor Urut Pendaftaran) *</Label>
                    <Input
                      id="assetNUP"
                      value={formData.assetNUP}
                      onChange={(e) => setFormData({ ...formData, assetNUP: e.target.value })}
                      placeholder="Contoh: 000001"
                      required
                    />
                    <p className="text-xs text-gray-500">Nomor urut pendaftaran barang</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetLocation">Lokasi Barang *</Label>
                    <Input
                      id="assetLocation"
                      value={formData.assetLocation}
                      onChange={(e) => setFormData({ ...formData, assetLocation: e.target.value })}
                      placeholder="Contoh: Ruang TU, Lantai 2"
                      required
                    />
                    <p className="text-xs text-gray-500">Ketik lokasi barang saat ini</p>
                  </div>
                </div>
              )}

              {ticketType === 'zoom_meeting' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Detail Booking Zoom</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meetingDate">Tanggal Meeting *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            selectedDate.toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          ) : (
                            <span className="text-gray-500">Pilih tanggal meeting</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            if (date) {
                              const dateStr = date.toISOString().split('T')[0];
                              setFormData({ ...formData, meetingDate: dateStr });
                            }
                          }}
                          disabled={(date) => {
                            // Disable past dates
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-gray-500">Pilih tanggal pelaksanaan meeting</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Waktu Mulai *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="pl-10"
                          min="07:00"
                          max="17:00"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">Jam operasional: 07:00 - 17:00</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">Waktu Selesai *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="pl-10"
                          min="07:00"
                          max="17:00"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">Jam operasional: 07:00 - 17:00</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coHostName">Nama Penerima Akses Co-Host *</Label>
                    <Input
                      id="coHostName"
                      value={formData.coHostName}
                      onChange={(e) => setFormData({ ...formData, coHostName: e.target.value })}
                      placeholder="Contoh: Budi Santoso"
                      required
                    />
                    <p className="text-xs text-gray-500">Nama lengkap orang yang akan menjadi co-host meeting</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="breakoutRooms">Jumlah Breakout Room *</Label>
                      <Input
                        id="breakoutRooms"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.breakoutRooms}
                        onChange={(e) => setFormData({ ...formData, breakoutRooms: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        required
                      />
                      <p className="text-xs text-gray-500">Isikan 0 jika tidak memerlukan breakout room</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedParticipants">Jumlah Peserta Zoom *</Label>
                      <Input
                        id="estimatedParticipants"
                        type="number"
                        min="2"
                        max="300"
                        value={formData.estimatedParticipants}
                        onChange={(e) => setFormData({ ...formData, estimatedParticipants: parseInt(e.target.value) || 10 })}
                        placeholder="10"
                        required
                      />
                      <p className="text-xs text-gray-500">Estimasi jumlah peserta yang akan hadir</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments */}
              <div className="space-y-3 border-t pt-4">
                <Label>Upload File Pendukung (Opsional)</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Maksimal 5 file. Format: JPG, PNG, PDF, DOC (Maks 2MB per file)
                  </p>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Mengirim...' : 'Ajukan Tiket'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};