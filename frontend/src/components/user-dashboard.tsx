import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
  Wrench,
  Video,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Activity,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getTickets } from '../lib/storage';
import { UserOnboarding } from './user-onboarding';
import type { User } from '../types';
import type { ViewType } from './main-layout';

interface UserDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onNavigate }) => {
  const tickets = getTickets();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if this is first time user (no tickets created yet)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${currentUser.id}`);
    const userTickets = tickets.filter(t => t.userId === currentUser.id);
    
    if (!hasSeenOnboarding && userTickets.length === 0) {
      setShowOnboarding(true);
    }
  }, [currentUser.id]);

  const handleCompleteOnboarding = () => {
    localStorage.setItem(`onboarding_seen_${currentUser.id}`, 'true');
    setShowOnboarding(false);
  };

  // Filter user's tickets
  const myTickets = tickets.filter(t => t.userId === currentUser.id);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: myTickets.length,
      pending: myTickets.filter(t =>
        ['submitted', 'menunggu_review', 'pending_approval', 'menunggu_verifikasi_penyedia'].includes(t.status)
      ).length,
      inProgress: myTickets.filter(t =>
        ['assigned', 'in_progress', 'on_hold', 'resolved', 'waiting_for_user', 'ditugaskan', 'diterima_teknisi', 'sedang_diagnosa', 'dalam_perbaikan', 'diproses_persiapan_pengiriman', 'dalam_pengiriman'].includes(t.status)
      ).length,
      completed: myTickets.filter(t => ['closed', 'selesai', 'approved'].includes(t.status)).length,
      rejected: myTickets.filter(t => ['closed_unrepairable', 'ditolak', 'rejected', 'dibatalkan'].includes(t.status)).length,
      perbaikan: myTickets.filter(t => t.type === 'perbaikan').length,
      zoom: myTickets.filter(t => t.type === 'zoom_meeting').length,
    };
  }, [myTickets]);

  // Quick actions
  const quickActions = [
    {
      id: 'create-ticket-perbaikan',
      title: 'Perbaikan Barang',
      description: 'Laporkan kerusakan peralatan',
      icon: Wrench,
      color: 'from-orange-500 to-orange-600',
      action: () => onNavigate('create-ticket-perbaikan'),
    },
    {
      id: 'create-ticket-zoom',
      title: 'Booking Zoom',
      description: 'Pesan ruang meeting online',
      icon: Video,
      color: 'from-purple-500 to-purple-600',
      action: () => onNavigate('create-ticket-zoom'),
    },
  ];

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <>
      <UserOnboarding open={showOnboarding} onComplete={handleCompleteOnboarding} />
      
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">
              Selamat Datang, {currentUser.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100">
              {currentUser.unitKerja} • {currentUser.role === 'user' ? 'Pegawai' : currentUser.role}
            </p>
          </div>
          <div className="hidden md:block">
            <Sparkles className="h-20 w-20 text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-blue-100 text-sm">Total Tiket</p>
            <p className="text-3xl mt-1">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-blue-100 text-sm">Sedang Proses</p>
            <p className="text-3xl mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-blue-100 text-sm">Selesai</p>
            <p className="text-3xl mt-1">{stats.completed}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-blue-100 text-sm">Completion Rate</p>
            <p className="text-3xl mt-1">{completionRate.toFixed(0)}%</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Layanan Cepat
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-500"
                  onClick={action.action}
                >
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{action.description}</p>
                    <Button variant="ghost" className="w-full gap-2">
                      Buat Tiket <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Butuh Bantuan?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Jika Anda memiliki pertanyaan atau kendala dalam menggunakan sistem, silakan hubungi tim IT support kami.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  📞 Hubungi Support
                </Button>
                <Button variant="outline" size="sm">
                  📖 Panduan Pengguna
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
};
