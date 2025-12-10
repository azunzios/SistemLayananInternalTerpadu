import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Package,
  FolderKanban,
  ArrowUpRight,
  Loader,
  Wrench,
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';
import { Spinner } from '@/components/ui/spinner';

interface AdminPenyediaDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

interface DashboardStats {
  total: number;
  byStatus: {
    requested: number;
    in_procurement: number;
    completed: number;
    unsuccessful: number;
  };
  byType: {
    sparepart: number;
    vendor: number;
    license: number;
  };
  recentWorkOrders: Array<{
    id: string;
    type: string;
    status: string;
    ticketNumber: string;
    ticketTitle: string;
    createdAt: string;
  }>;
}

export const AdminPenyediaDashboard: React.FC<AdminPenyediaDashboardProps> = ({
  currentUser: _currentUser,
  onNavigate,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await api.get<any>('/work-orders/stats/summary');
        // Transform response
        setStats({
          total: response.data?.total || 0,
          byStatus: response.data?.by_status || { requested: 0, in_procurement: 0, completed: 0, unsuccessful: 0 },
          byType: response.data?.by_type || { sparepart: 0, vendor: 0, license: 0 },
          recentWorkOrders: response.data?.recent || [],
        });
      } catch (err) {
        console.error('Failed to load admin penyedia dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            Admin Penyedia Dashboard
          </h1>
          <div className="flex flex-row gap-4">
            <p className="text-black-500 mt-1">Memuat data dashboard...</p>
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sparepart': return Package;
      case 'vendor': return Wrench;
      case 'license': return FolderKanban;
      default: return Package;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sparepart': return 'Sparepart';
      case 'vendor': return 'Vendor';
      case 'license': return 'Lisensi';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section - matching admin-layanan style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-500 rounded-3xl p-8 text-white border border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.5),0_10px_20px_rgba(0,0,0,0.2)]"
      >
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="max-md:text-2xl text-3xl mb-2 font-bold">
              Admin Penyedia Dashboard
            </h1>
            <p className="text-blue-100 max-md:text-sm md:text-base">
              Kelola work order dan pengadaan dari teknisi
            </p>
          </div>
          {/* Icon Package: Sesuai style user-dashboard */}
          <div className="block shrink-0">
            <Package className="hidden md:block max-md:h-14 max-md:w-14 md:h-20 md:w-20 text-black-300 opacity-50" />
          </div>
        </div>

        <Separator className="my-6 bg-blue-300" />

        {/* Statistics Grid (formerly Table) */}
        {stats ? (
          <div className="grid md:grid-cols-5 max-md:grid-cols-1">
            {/* Item 1: Total */}
            <div className="px-4 py-4 text-center border-b border-blue-300 md:border-none md:border-r">
              <p className="text-blue-100 text-sm">Total Work Order</p>
              <p className="text-3xl mt-1 font-bold">{stats.total}</p>
              <p className="text-xs text-blue-200 mt-1">Semua work order</p>
            </div>

            {/* Item 2: Requested */}
            <div className="px-4 py-4 text-center border-b border-blue-300 md:border-none md:border-r">
              <p className="text-blue-100 text-sm">Requested</p>
              <p className="text-3xl mt-1 font-bold">{stats.byStatus.requested}</p>
              <p className="text-xs text-blue-200 mt-1">Menunggu proses</p>
            </div>

            {/* Item 3: In Procurement */}
            <div className="px-4 py-4 text-center border-b border-blue-300 md:border-none md:border-r">
              <p className="text-blue-100 text-sm">In Procurement</p>
              <p className="text-3xl mt-1 font-bold">{stats.byStatus.in_procurement}</p>
              <p className="text-xs text-blue-200 mt-1">Sedang pengadaan</p>
            </div>

            {/* Item 4: Completed */}
            <div className="px-4 py-4 text-center border-b border-blue-300 md:border-none md:border-r">
              <p className="text-blue-100 text-sm">Completed</p>
              <p className="text-3xl mt-1 font-bold">{stats.byStatus.completed}</p>
              <p className="text-xs text-blue-200 mt-1">Selesai</p>
            </div>

            {/* Item 5: Unsuccessful */}
            <div className="px-4 py-4 text-center">
              <p className="text-blue-100 text-sm">Unsuccessful</p>
              <p className="text-3xl mt-1 font-bold">{stats.byStatus.unsuccessful}</p>
              <p className="text-xs text-blue-200 mt-1">Tidak berhasil</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-black-600" />
          </div>
        )}
      </motion.div>

      {/* Work Order by Type - simple cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sparepart</p>
                  <p className="text-4xl font-bold">{stats?.byType.sparepart || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Work order sparepart</p>
                </div>
                <div className="h-14 w-14 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="h-7 w-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vendor</p>
                  <p className="text-4xl font-bold">{stats?.byType.vendor || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Work order vendor</p>
                </div>
                <div className="h-14 w-14 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Wrench className="h-7 w-7 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Lisensi</p>
                  <p className="text-4xl font-bold">{stats?.byType.license || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Work order lisensi</p>
                </div>
                <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderKanban className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Work Orders */}
      <Card className="pb-6">
        <CardHeader>
          <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-4">
            <div>
              <CardTitle>Work Order Terbaru</CardTitle>
              <CardDescription>
                Menampilkan 5 work order terbaru • {stats?.byStatus.requested || 0} work order menunggu diproses
              </CardDescription>
            </div>
            <Button
              onClick={() => onNavigate('work-orders')}
              className="
    relative overflow-hidden rounded-full 
    bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 
    text-white 
    border-2 border-blue-300/50
    shadow-[inset_0px_4px_8px_rgba(255,255,255,0.4),inset_0px_-4px_8px_rgba(0,0,0,0.2),0px_4px_10px_rgba(59,130,246,0.5)]
    hover:brightness-110 transition-all duration-300
    group px-6 max-md:w-full
  "
            >
              {/* Efek Kilau Putih (Soap Shine Overlay) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-80 pointer-events-none" />

              {/* Kilau kecil tambahan di pojok */}
              <div className="absolute top-1 right-4 w-4 h-2 bg-white/40 blur-sm rounded-full pointer-events-none" />

              <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-sm font-semibold">
                Lihat Semua
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recentWorkOrders && stats.recentWorkOrders.length > 0 ? (
            <div className="space-y-2">
              {stats.recentWorkOrders.slice(0, 5).map((wo, index) => {
                const TypeIcon = getTypeIcon(wo.type);

                return (
                  <motion.div
                    key={wo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TypeIcon className="h-5 w-5 text-black-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {getTypeLabel(wo.type)} - {wo.ticketTitle || wo.ticketNumber}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-black-500 mt-1">
                        <span className="font-mono text-black-700">{wo.ticketNumber}</span>
                        <span>•</span>
                        <span>{new Date(wo.createdAt).toLocaleDateString('id-ID')}</span>
                        <span>•</span>
                        <span className="font-medium text-black-700">
                          {wo.status === 'requested' ? 'Requested' :
                            wo.status === 'in_procurement' ? 'In Procurement' :
                              wo.status === 'completed' ? 'Completed' : 'Unsuccessful'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-black-500">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-black-400" />
              <p className="text-lg">Belum ada work order!</p>
              <p className="text-sm mt-1">Work order dari teknisi akan muncul di sini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};