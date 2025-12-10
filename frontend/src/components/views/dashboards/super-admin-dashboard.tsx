import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "motion/react";
import {
  Shield,
  Users,
  Package,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSuperAdminDashboard } from '@/hooks/use-super-admin-dashboard';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';

interface SuperAdminDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onNavigate,
}) => {
  const { stats, ticketsByType, usersByRole, loading, error } =
    useSuperAdminDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="h-6 w-6" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section - Modified to Blue Theme */}
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
            <h1 className="max-md:text-2xl text-3xl mb-2 flex items-center gap-3 font-bold">
              Super Admin Dashboard
            </h1>
            <p className="text-blue-100 max-md:text-sm md:text-base">
              Overview sistem dan monitoring lengkap
            </p>
          </div>
          <div className="hidden md:block">
            <Shield className="h-20 w-20 text-blue-100 opacity-50" />
          </div>
        </div>

        {/* Shortcuts Grid - Modified to Indigo Theme (to match Blue) */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 px-0 md:px-40 mt-10">

          {/* BUTTON 1: User Management */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('users')}
            className="
            relative group w-full md:flex-1 py-4 px-8 rounded-full transition-all duration-300
            
            /* Base Color: Changed from Green to Indigo/Dark Blue */
            bg-gradient-to-b from-indigo-600 to-indigo-700
            
            /* Soap/Glassy Effect */
            shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]
            border-t border-white/40 border-b border-indigo-700/20
            
            /* Hover Action */
            hover:brightness-105 hover:shadow-[inset_0_2px_6px_rgba(255,255,255,0.6),0_6px_12px_rgba(0,0,0,0.15)]
          "
          >
            {/* Shine Reflection */}
            <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4 z-10">
              <div className="text-left pl-2">
                <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider drop-shadow-sm">User Management</p>
                <p className="text-white font-bold text-lg mt-0.5 drop-shadow-md">{stats?.totalUsers ?? 0} Users</p>
              </div>
              {/* Icon Circle: Darker Indigo */}
              <div className="h-10 w-10 bg-indigo-900 rounded-full flex items-center justify-center shadow-inner border border-white/10">
                <Users className="h-5 w-5 text-white drop-shadow-sm" />
              </div>
            </div>
          </motion.button>

          {/* BUTTON 2: Asset Management */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('bmn-assets')}
            className="
            relative group w-full md:flex-1 py-4 px-8 rounded-full transition-all duration-300
            
            /* Base Color: Changed from Green to Indigo/Dark Blue */
            bg-gradient-to-b from-indigo-600 to-indigo-700
            
            /* Soap/Glassy Effect */
            shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]
            border-t border-white/40 border-b border-indigo-700/20
            
            /* Hover Action */
            hover:brightness-105 hover:shadow-[inset_0_2px_6px_rgba(255,255,255,0.6),0_6px_12px_rgba(0,0,0,0.15)]
          "
          >
            {/* Shine Reflection */}
            <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4 z-10">
              <div className="text-left pl-2">
                <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider drop-shadow-sm">Asset Management</p>
                <p className="text-white font-bold text-lg mt-0.5 drop-shadow-md">Kelola Aset</p>
              </div>
              {/* Icon Circle: Darker Indigo */}
              <div className="h-10 w-10 bg-indigo-900 rounded-full flex items-center justify-center shadow-inner border border-white/10">
                <Package className="h-5 w-5 text-white drop-shadow-sm" />
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Remaining Charts Section (Tidak berubah) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 w-full">
        {/* Users by Role - Full width */}
        <Card className="col-span-1 md:col-span-2 w-full !p-0">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center !m-0 !p-4">
            <CardTitle className="text-white ">Distribusi Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usersByRole}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center !p-4">
            <CardTitle className="text-white">Distribusi Jenis Tiket</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-6">

            <div className="h-[280px] w-full relative">

              <div className="absolute inset-0 flex items-center justify-center">

                {/* Cek apakah ada data tiket */}
                {ticketsByType.some(item => item.value > 0) ? (
                  <ResponsiveContainer width="99%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketsByType.filter(item => item.value > 0) as any}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        outerRadius={70}
                        innerRadius={0}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        style={{ fontSize: '11px' }}
                      >
                        {ticketsByType.filter(item => item.value > 0).map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Jumlah']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <AlertCircle className="h-10 w-10 mb-2" />
                    <p className="text-sm">Belum ada data tiket</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset BMN Card */}
        <Card className="col-span-1">
          <CardHeader className="bg-gradient-to-r !p-4 from-emerald-500 to-teal-500 flex items-center">
            <CardTitle className="text-white">Total Asset BMN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-32 w-32 rounded-full border-4 border-emerald-500 flex items-center justify-center">
                    <p className="text-4xl font-bold text-emerald-600">
                      {stats?.totalAssets ?? 0}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Asset terdaftar di sistem
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
