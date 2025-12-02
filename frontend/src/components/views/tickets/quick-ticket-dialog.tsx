import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wrench, Video, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { ViewType } from '@/components/main-layout';

interface QuickTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: ViewType) => void;
}

export const QuickTicketDialog: React.FC<QuickTicketDialogProps> = ({
  open,
  onOpenChange,
  onNavigate,
}) => {
  const ticketTypes = [
    {
      id: 'create-ticket-perbaikan' as ViewType,
      title: 'Perbaikan Barang',
      description: 'Laporkan kerusakan peralatan atau infrastruktur',
      icon: Wrench,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      id: 'create-ticket-zoom' as ViewType,
      title: 'Booking Zoom Meeting',
      description: 'Pesan ruang meeting virtual untuk acara/rapat',
      icon: Video,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  const handleSelect = (view: ViewType) => {
    onOpenChange(false);
    onNavigate(view);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Tiket Baru</DialogTitle>
          <DialogDescription>
            Pilih jenis layanan yang ingin Anda ajukan
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 py-4">
          {ticketTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => handleSelect(type.id)}
                  className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 group"
                >
                  <div className={`h-12 w-12 bg-gradient-to-br ${type.color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                    {type.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {type.description}
                  </p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    Pilih <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
          <p className="text-sm text-blue-900">
            <strong>💡 Tips:</strong> Pastikan Anda melengkapi semua informasi yang diperlukan agar tiket dapat diproses dengan cepat.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
