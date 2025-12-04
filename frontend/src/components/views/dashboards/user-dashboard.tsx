import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Wrench,
  Video,
  ArrowRight,
  IdCardLanyard,
  ArrowUpRight,
  Loader,
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import { getActiveRole } from '@/lib/storage';
import { UserOnboarding } from '@/components/views/shared';
import { QuickBookingDialog } from '@/components/views/zoom/zoom-booking-dialogs';
import type { User, UserRole } from '@/types';
import type { ViewType } from '@/components/main-layout';

interface DashboardStats {
  total: number;
  in_progress: number;
  completed: number;
  rejected: number;
  completion_rate: number;
  perbaikan: number;
  zoom: number;
}

interface UserDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

const INITIAL_BOOKING_FORM = {
  title: '',
  purpose: '',
  participants: '',
  breakoutRooms: '0',
  startTime: '',
  endTime: '',
};

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin_layanan: 'Admin Layanan',
  admin_penyedia: 'Admin Penyedia',
  teknisi: 'Teknisi',
  pegawai: 'Pegawai',
};

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onNavigate }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [quickBookingDate, setQuickBookingDate] = useState<Date | undefined>(undefined);
  const [bookingForm, setBookingForm] = useState(INITIAL_BOOKING_FORM);
  const [selectedCoHostIds, setSelectedCoHostIds] = useState<string[]>([]);
  const [coHostQuery, setCoHostQuery] = useState('');
  const [isSearchingCoHost, setIsSearchingCoHost] = useState(false);
  const [coHostResults, setCoHostResults] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const activeRole = (getActiveRole(currentUser.id) || currentUser.role) as UserRole;

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ success: boolean; stats: DashboardStats }>(
          'tickets/stats/dashboard?scope=my'
        );
        if (response.success && response.stats) {
          setStats(response.stats);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const hasSeenOnboarding = sessionStorage.getItem(`onboarding_seen_${currentUser.id}`);

    if (!hasSeenOnboarding && stats && stats.total === 0) {
      setShowOnboarding(true);
    }
  }, [currentUser.id, stats]);

  const handleCompleteOnboarding = () => {
    sessionStorage.setItem(`onboarding_seen_${currentUser.id}`, 'true');
    setShowOnboarding(false);
  };

  const resetQuickBookingState = () => {
    setQuickBookingDate(undefined);
    setBookingForm(INITIAL_BOOKING_FORM);
    setSelectedCoHostIds([]);
    setCoHostQuery('');
    setCoHostResults([]);
    setIsSubmittingQuick(false);
    setAttachments([]);
  };

  const handleQuickBookingDialogOpenChange = (open: boolean) => {
    setShowQuickBooking(open);
    if (!open) {
      resetQuickBookingState();
    }
  };

  const handleQuickBookingCancel = () => {
    resetQuickBookingState();
    setShowQuickBooking(false);
  };

  const handleBookingFormChange = (changes: Partial<typeof bookingForm>) => {
    setBookingForm(prev => ({ ...prev, ...changes }));
  };

  const handleCoHostSelect = (id: string) => {
    setSelectedCoHostIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleCoHostRemove = (id: string) => {
    setSelectedCoHostIds(prev => prev.filter(existing => existing !== id));
  };

  const searchCoHosts = async () => {
    if (coHostQuery.trim().length < 4) return;
    setIsSearchingCoHost(true);
    try {
      const response: any = await api.get(`users?search=${encodeURIComponent(coHostQuery)}`).catch(() => null);
      const raw = Array.isArray(response) ? response : response?.data || [];
      const normalized: User[] = raw.map((record: any) => ({
        id: String(record.id ?? ''),
        email: String(record.email ?? ''),
        name: String(record.name ?? ''),
        nip: String(record.nip ?? ''),
        jabatan: String(record.jabatan ?? ''),
        role: (Array.isArray(record.roles) ? (record.roles[0] ?? 'pegawai') : (record.role ?? 'pegawai')) as any,
        roles: (Array.isArray(record.roles) ? record.roles : record.role ? [record.role] : ['pegawai']) as any,
        unitKerja: String(record.unitKerja ?? record.unit_kerja ?? ''),
        phone: String(record.phone ?? ''),
        avatar: record.avatar ?? undefined,
        createdAt: String(record.createdAt ?? record.created_at ?? new Date().toISOString()),
        isActive: Boolean(record.isActive ?? record.is_active ?? true),
        failedLoginAttempts: Number(record.failedLoginAttempts ?? record.failed_login_attempts ?? 0),
        lockedUntil: record.lockedUntil ?? record.locked_until ?? undefined,
      }));
      const pegawaiOnly = normalized.filter(user => (user.roles || []).includes('pegawai') && user.email);
      setCoHostResults(pegawaiOnly);
      const map = new Map(availableUsers.map(u => [String(u.id), u] as const));
      for (const user of pegawaiOnly) {
        map.set(String(user.id), user);
      }
      setAvailableUsers(Array.from(map.values()));
    } finally {
      setIsSearchingCoHost(false);
    }
  };

  const handleSubmitQuickBooking = async () => {
    if (!quickBookingDate) {
      return;
    }

    if (!bookingForm.title.trim()) {
      return;
    }
    if (!bookingForm.purpose.trim()) {
      return;
    }
    if (!bookingForm.startTime) {
      return;
    }
    if (!bookingForm.endTime) {
      return;
    }
    if (!bookingForm.participants.trim() || parseInt(bookingForm.participants, 10) <= 0) {
      return;
    }

    const [startHour, startMin] = bookingForm.startTime.split(':').map(Number);
    const [endHour, endMin] = bookingForm.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return;
    }

    const yyyy = quickBookingDate.getFullYear();
    const mm = String(quickBookingDate.getMonth() + 1).padStart(2, '0');
    const dd = String(quickBookingDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const payload: any = {
      type: 'zoom_meeting',
      title: bookingForm.title,
      description: bookingForm.purpose,
      zoom_date: dateStr,
      zoom_start_time: bookingForm.startTime,
      zoom_end_time: bookingForm.endTime,
      zoom_estimated_participants: parseInt(bookingForm.participants, 10),
      zoom_breakout_rooms: parseInt(bookingForm.breakoutRooms, 10),
    };

    const hosts = selectedCoHostIds
      .map(id => availableUsers.find(user => String(user.id) === String(id)))
      .filter((user): user is User => Boolean(user && user.email))
      .map(user => ({ name: user.name, email: user.email }));

    if (hosts.length > 0) {
      payload.zoom_co_hosts = hosts;
    }

    try {
      setIsSubmittingQuick(true);
      await api.post('tickets', payload);
      resetQuickBookingState();
      setShowQuickBooking(false);
      onNavigate('my-tickets');
    } catch (err: any) {
      console.error('Failed to submit booking:', err);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

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
      action: () => {
        setShowQuickBooking(true);
        setQuickBookingDate(new Date());
      },
    },
  ];

  return (
    <>
      <UserOnboarding open={showOnboarding} onComplete={handleCompleteOnboarding} />

      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="    
          bg-blue-500
          rounded-3xl 
          p-8 
          text-white
          border border-white/30
          shadow-[inset_0_0_20px_rgba(255,255,255,0.5),0_10px_20px_rgba(0,0,0,0.2)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2">
                Selamat Datang, {currentUser.name.split(' ')[0]}!
              </h1>
              <p className="text-blue-100">
                {currentUser.unitKerja} • {roleLabels[activeRole] || 'Pegawai'}
              </p>
            </div>
            <div className="hidden md:block">
              <IdCardLanyard className="h-20 w-20 text-blue-200 opacity-50" />
            </div>
          </div>

          <Separator className="my-6 bg-blue-300" />

          {/* Statistics Grid */}
          <div className="flex items-center justify-between">
            {loading ? (
              <div className="w-full flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-white" />
              </div>
            ) : stats ? (
              <>
                <div className="flex-1 px-4 py-4 text-center border-r border-blue-300">
                  <p className="text-blue-100 text-sm">Total Tiket</p>
                  <p className="text-3xl mt-1 font-bold">{stats.total}</p>
                </div>
                <div className="flex-1 px-4 py-4 text-center border-r border-blue-300">
                  <p className="text-blue-100 text-sm">Sedang Proses</p>
                  <p className="text-3xl mt-1 font-bold">{stats.in_progress}</p>
                </div>
                <div className="flex-1 px-4 py-4 text-center border-r border-blue-300">
                  <p className="text-blue-100 text-sm">Selesai</p>
                  <p className="text-3xl mt-1 font-bold">{stats.completed}</p>
                </div>
                <div className="flex-1 px-4 py-4 text-center">
                  <p className="text-blue-100 text-sm">Completion Rate</p>
                  <p className="text-3xl mt-1 font-bold">{stats.completion_rate.toFixed(0)}%</p>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div>
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
                      <Button
                        className="
                          w-full rounded-full group relative overflow-hidden
                          bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600
                          text-white font-medium
                          border border-blue-200/50
                          shadow-[inset_0px_3px_3px_rgba(255,255,255,0.5),inset_0px_-3px_3px_rgba(0,0,0,0.1),0px_2px_5px_rgba(59,130,246,0.3)]
                          hover:brightness-105 transition-all duration-300
                        "
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-md">
                          Buat Tiket
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>

                        {/* Layer kilau tambahan agar makin terasa 'sabun' (Opsional) */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <QuickBookingDialog
        open={showQuickBooking}
        onOpenChange={handleQuickBookingDialogOpenChange}
        bookingForm={bookingForm}
        onBookingFormChange={handleBookingFormChange}
        quickBookingDate={quickBookingDate}
        onQuickBookingDateChange={setQuickBookingDate}
        onSubmit={handleSubmitQuickBooking}
        onCancel={handleQuickBookingCancel}
        isSubmitting={isSubmittingQuick}
        coHostQuery={coHostQuery}
        onCoHostQueryChange={setCoHostQuery}
        onSearchCoHosts={searchCoHosts}
        isSearchingCoHost={isSearchingCoHost}
        coHostResults={coHostResults}
        selectedCoHostIds={selectedCoHostIds}
        onSelectCoHost={handleCoHostSelect}
        onRemoveCoHost={handleCoHostRemove}
        availableUsers={availableUsers}
        attachments={attachments}
        onAttachmentsChange={setAttachments}
      />
    </>
  );
};
