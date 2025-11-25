import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  ShoppingCart,
  BarChart3,
  ArrowRight,
  Package,
  FolderKanban,
  Clock,
  Truck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { getSparepartRequests, getWorkOrders } from '@/lib/storage';
import type { User } from '@/types';
import type { ViewType } from '@/components/main-layout';

interface AdminPenyediaDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

export const AdminPenyediaDashboard: React.FC<AdminPenyediaDashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const sparepartRequests = getSparepartRequests();
  const workOrders = getWorkOrders();

  // Admin Penyedia Stats - focus on work orders and sparepart requests
  const stats = useMemo(() => {
    const pendingSparepartRequests = sparepartRequests.filter(r => r.status === 'pending');
    const approvedSparepartRequests = sparepartRequests.filter(r => r.status === 'approved');
    const rejectedSparepartRequests = sparepartRequests.filter(r => r.status === 'rejected');
    
    const pendingWorkOrders = workOrders.filter(w => w.status === 'requested');
    const inProcurementWorkOrders = workOrders.filter(w => w.status === 'in_procurement');
    const completedWorkOrders = workOrders.filter(w => w.status === 'completed' || w.status === 'delivered');

    return {
      pendingSparepartRequests: pendingSparepartRequests.length,
      approvedSparepartRequests: approvedSparepartRequests.length,
      rejectedSparepartRequests: rejectedSparepartRequests.length,
      totalSparepartRequests: sparepartRequests.length,
      pendingWorkOrders: pendingWorkOrders.length,
      inProcurementWorkOrders: inProcurementWorkOrders.length,
      completedWorkOrders: completedWorkOrders.length,
      totalWorkOrders: workOrders.length,
    };
  }, [sparepartRequests, workOrders]);

  // Work Order Status Distribution
  const workOrderStatus = useMemo(() => {
    return [
      { name: 'Requested', value: workOrders.filter(w => w.status === 'requested').length, color: '#3b82f6' },
      { name: 'In Procurement', value: workOrders.filter(w => w.status === 'in_procurement').length, color: '#f59e0b' },
      { name: 'Delivered', value: workOrders.filter(w => w.status === 'delivered').length, color: '#10b981' },
      { name: 'Completed', value: workOrders.filter(w => w.status === 'completed').length, color: '#06b6d4' },
    ].filter(item => item.value > 0);
  }, [workOrders]);

  // Work Order Type Distribution
  const workOrderType = useMemo(() => {
    return [
      { name: 'Sparepart', value: workOrders.filter(w => w.type === 'sparepart').length, color: '#8b5cf6' },
      { name: 'Vendor', value: workOrders.filter(w => w.type === 'vendor').length, color: '#f97316' },
    ].filter(item => item.value > 0);
  }, [workOrders]);

  // Sparepart requests trend (last 7 days)
  const sparepartTrend = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const dayRequests = sparepartRequests.filter(r => {
        const requestDate = new Date(r.createdAt);
        return requestDate.toDateString() === date.toDateString();
      });

      last7Days.push({
        date: dateStr,
        requests: dayRequests.length,
      });
    }
    return last7Days;
  }, [sparepartRequests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl flex items-center gap-3">
            <Package className="h-8 w-8 text-green-600" />
            Admin Penyedia Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola work order dan request sparepart dari teknisi
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sparepart Requests</p>
                  <p className="text-4xl text-blue-600">{stats.pendingSparepartRequests}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Pending review
                  </p>
                </div>
                <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Work Orders</p>
                  <p className="text-4xl text-green-600">{stats.pendingWorkOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pending action
                  </p>
                </div>
                <div className="h-14 w-14 bg-green-100 rounded-lg flex items-center justify-center">
                  <FolderKanban className="h-7 w-7 text-green-600" />
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
                  <p className="text-sm text-gray-500 mb-1">In Procurement</p>
                  <p className="text-4xl text-orange-600">{stats.inProcurementWorkOrders}</p>
                  <p className="text-xs text-orange-700 mt-1">
                    In progress
                  </p>
                </div>
                <div className="h-14 w-14 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-7 w-7 text-orange-600" />
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
                  <p className="text-sm text-gray-500 mb-1">Completed</p>
                  <p className="text-4xl text-emerald-600">{stats.completedWorkOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    This month
                  </p>
                </div>
                <div className="h-14 w-14 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Work Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Work Order</CardTitle>
            <CardDescription>Distribusi status work order saat ini</CardDescription>
          </CardHeader>
          <CardContent>
            {workOrderStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={workOrderStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {workOrderStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FolderKanban className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Belum ada work order</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sparepart Requests Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Request Sparepart (7 Hari)</CardTitle>
            <CardDescription>Request dari teknisi per hari</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sparepartTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Work Order Type Distribution */}
      {workOrderType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Tipe Work Order</CardTitle>
            <CardDescription>Perbandingan work order sparepart vs vendor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={workOrderType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {workOrderType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {workOrderType.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="secondary">{item.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};