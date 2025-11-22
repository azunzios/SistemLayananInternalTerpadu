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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Wrench,
  Video,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export const UserOnboarding: React.FC<UserOnboardingProps> = ({ open, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Selamat Datang di Sistem Ticketing BPS NTB! 🎉',
      description: 'Mari kami bantu Anda memahami cara menggunakan sistem ini',
      icon: Sparkles,
      color: 'from-blue-500 to-purple-600',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Sistem ini memudahkan Anda untuk mengajukan berbagai layanan internal seperti perbaikan peralatan dan booking Zoom meeting.
          </p>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">Mudah & Cepat</p>
                <p className="text-xs text-green-700">Buat tiket hanya dalam beberapa klik</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Tracking Real-time</p>
                <p className="text-xs text-blue-700">Pantau progress tiket kapan saja</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-900">Notifikasi Otomatis</p>
                <p className="text-xs text-purple-700">Dapatkan update setiap ada perubahan</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Jenis Layanan yang Tersedia',
      description: 'Pilih layanan sesuai kebutuhan Anda',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      content: (
        <div className="space-y-3">
          <Card className="border-2 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Perbaikan Barang</h4>
                  <p className="text-sm text-gray-600">
                    Laporkan kerusakan peralatan. Teknisi kami akan mendiagnosa dan memperbaiki.
                  </p>
                  <Badge className="mt-2">Estimasi: 1-3 hari kerja</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Booking Zoom Meeting</h4>
                  <p className="text-sm text-gray-600">
                    Pesan ruang meeting virtual untuk acara atau rapat penting Anda.
                  </p>
                  <Badge className="mt-2">Estimasi: Approval dalam 1 hari</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      title: 'Cara Membuat Tiket',
      description: 'Langkah mudah untuk mengajukan layanan',
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-blue-600">1</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Pilih Jenis Layanan</h4>
              <p className="text-sm text-gray-600">
                Klik tombol "Buat Tiket" di header atau pilih layanan di dashboard
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-blue-600">2</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Isi Form dengan Lengkap</h4>
              <p className="text-sm text-gray-600">
                Berikan detail yang jelas agar tiket Anda dapat diproses dengan cepat
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-blue-600">3</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Pantau Progress</h4>
              <p className="text-sm text-gray-600">
                Lihat status real-time di halaman "Tiket Saya" dan dapatkan notifikasi update
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-blue-600">4</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Konfirmasi Penyelesaian</h4>
              <p className="text-sm text-gray-600">
                Berikan rating dan feedback setelah layanan selesai
              </p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
            <p className="text-sm text-yellow-900">
              <strong>💡 Tips:</strong> Sertakan foto atau dokumen pendukung untuk mempercepat proses review
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Siap Memulai! 🚀',
      description: 'Anda sudah siap menggunakan sistem',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-600',
      content: (
        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="h-20 w-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Semua Sudah Siap!</h3>
            <p className="text-gray-600">
              Sekarang Anda dapat mulai menggunakan sistem ticketing BPS NTB
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>📍 Quick Tip:</strong> Gunakan tombol "Buat Tiket" di header untuk akses cepat
              </p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                <strong>🔔 Notifikasi:</strong> Aktifkan notifikasi browser untuk update real-time
              </p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900">
                <strong>❓ Bantuan:</strong> Hubungi IT Support jika ada kendala
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onComplete(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className={`h-12 w-12 bg-gradient-to-br ${currentStepData.color} rounded-lg flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle>{currentStepData.title}</DialogTitle>
              <DialogDescription>{currentStepData.description}</DialogDescription>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="py-4"
          >
            {currentStepData.content}
          </motion.div>
        </AnimatePresence>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} dari {steps.length}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Sebelumnya
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? (
                <>
                  Selanjutnya <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Mulai Menggunakan <CheckCircle className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
