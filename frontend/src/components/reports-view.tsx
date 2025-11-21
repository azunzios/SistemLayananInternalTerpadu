import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, Package, ShoppingCart, Truck, Search} from 'lucide-react';
import { getTickets, getWorkOrders } from '../lib/storage';
import type { User } from '../types';

interface ReportsViewProps {
  currentUser: User;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const ReportsView: React.FC<ReportsViewProps> = ({ currentUser }) => {
  const tickets = getTickets();
  const workOrders = getWorkOrders();
  
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Penyedia only sees procurement-related data
  const isAdminPenyedia = currentUser.role === 'admin_penyedia';

  // Get completed work orders grouped by ticket
  const completedWorkOrders = useMemo(() => {
    return workOrders.filter(w => w.status === 'completed' || w.status === 'delivered');
  }, [workOrders]);

  // Group work orders by ticket number
  const workOrdersByTicket = useMemo(() => {
    const grouped = new Map<string, typeof completedWorkOrders>();
    
    completedWorkOrders.forEach(wo => {
      const ticketNumber = wo.ticketNumber || '';
      if (!grouped.has(ticketNumber)) {
        grouped.set(ticketNumber, []);
      }
      grouped.get(ticketNumber)!.push(wo);
    });
    
    return Array.from(grouped.entries()).map(([ticketNumber, orders]) => {
      // Get ticket details - only perbaikan tickets have work orders
      const ticket = tickets.find(t => t.ticketNumber === ticketNumber && t.type === 'perbaikan');
      return {
        ticketNumber,
        ticket,
        workOrders: orders,
        completedDate: orders[0]?.updatedAt || orders[0]?.createdAt,
      };
    }).sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());
  }, [completedWorkOrders, tickets]);

  // Filter by search
  const filteredWorkOrders = useMemo(() => {
    let filtered = workOrdersByTicket;
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.ticket?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );
    }
    
    return filtered;
  }, [workOrdersByTicket, searchQuery]);

  // Ticket statistics for reports
  const ticketStats = useMemo(() => {
    const relevantTickets = isAdminPenyedia 
      ? tickets.filter(t => t.type === 'perbaikan')
      : tickets;

    const byStatus = relevantTickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = relevantTickets.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { byStatus, byType };
  }, [tickets, isAdminPenyedia]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const last6Months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      
      const monthTickets = tickets.filter(t => {
        const ticketDate = new Date(t.createdAt);
        return ticketDate.getMonth() === month.getMonth() && 
               ticketDate.getFullYear() === month.getFullYear();
      });

      last6Months.push({
        month: monthName,
        total: monthTickets.length,
        perbaikan: monthTickets.filter(t => t.type === 'perbaikan').length,
        zoom: monthTickets.filter(t => t.type === 'zoom_meeting').length,
      });
    }

    return last6Months;
  }, [tickets]);

  // Work order statistics
  const workOrderStats = useMemo(() => {
    return {
      total: completedWorkOrders.length,
      sparepart: completedWorkOrders.filter(w => w.type === 'sparepart').length,
      vendor: completedWorkOrders.filter(w => w.type === 'vendor').length,
      totalTickets: workOrdersByTicket.length,
    };
  }, [completedWorkOrders, workOrdersByTicket]);

  // Status distribution chart data
  const statusChartData = Object.entries(ticketStats.byStatus).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // Type distribution chart data
  const typeChartData = Object.entries(ticketStats.byType).map(([type, count]) => ({
    name: type === 'perbaikan' ? 'Perbaikan' : type === 'zoom_meeting' ? 'Zoom Meeting' : type,
    value: count,
  }));

  const handleExportKartuKendali = () => {
    // Create CSV content
    const headers = ['No Tiket', 'Tanggal', 'Type', 'NUP BMN', 'Merk', 'Ruang', 'Nama Barang', 'Work Order', 'Banyaknya', 'Satuan'];
    const rows = filteredWorkOrders.flatMap(item => 
      item.workOrders.map(wo => {
        const perbaikanTicket = item.ticket?.type === 'perbaikan' ? item.ticket : null;
        const sparepartName = wo.spareparts?.[0]?.name || 'Service Vendor';
        const sparepartQty = wo.spareparts?.[0]?.quantity || 1;
        
        return [
          item.ticketNumber,
          new Date(wo.updatedAt || wo.createdAt).toLocaleDateString('id-ID'),
          perbaikanTicket?.data?.itemType || '-',
          perbaikanTicket?.assetNUP || '-',
          perbaikanTicket?.data?.brand || '-',
          perbaikanTicket?.assetLocation || '-',
          perbaikanTicket?.title || '-',
          wo.type === 'sparepart' ? sparepartName : (wo.vendorInfo?.description || 'Service Vendor'),
          wo.type === 'sparepart' ? sparepartQty : '1',
          wo.type === 'sparepart' ? 'Unit' : 'Service',
        ];
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kartu_kendali_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Laporan dan Kartu Kendali
          </h1>
          <p className="text-gray-500 mt-1">
            Analisis data dan kartu kendali work order
          </p>
        </div>
      </div>

      <Tabs defaultValue="kartu-kendali" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="kartu-kendali">Kartu Kendali</TabsTrigger>
          <TabsTrigger value="laporan">Laporan Statistik</TabsTrigger>
        </TabsList>

        {/* Kartu Kendali Tab */}
        <TabsContent value="kartu-kendali" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Tiket</p>
                    <p className="text-3xl text-blue-600">{workOrderStats.totalTickets}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Work Order</p>
                    <p className="text-3xl text-green-600">{workOrderStats.total}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Sparepart</p>
                    <p className="text-3xl text-purple-600">{workOrderStats.sparepart}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Vendor</p>
                    <p className="text-3xl text-orange-600">{workOrderStats.vendor}</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Export */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kartu Kendali Perbaikan Barang</CardTitle>
                  <CardDescription>Daftar work order yang telah selesai</CardDescription>
                </div>
                <Button onClick={handleExportKartuKendali} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari no tiket, nama barang, merk, atau ruang..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Kartu Kendali Cards */}
              <div className="space-y-4">
                {filteredWorkOrders.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                      Tidak ada data kartu kendali
                    </CardContent>
                  </Card>
                ) : (
                  filteredWorkOrders.map((item, index) => (
                    <Card key={`${item.ticketNumber}-${index}`} className="overflow-hidden">
                      <CardContent className="p-6">
                        {/* Header Info Tiket */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 mb-4 border-b">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">No Tiket</p>
                            <Badge variant="outline" className="font-mono">{item.ticketNumber}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Tanggal</p>
                            <p className="text-sm font-medium">{new Date(item.completedDate).toLocaleDateString('id-ID')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Type</p>
                            <p className="text-sm font-medium">
                              {item.ticket?.type === 'perbaikan' ? item.ticket?.data?.itemType || '-' : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">NUP BMN</p>
                            <p className="text-sm font-medium font-mono">
                              {item.ticket?.type === 'perbaikan' ? item.ticket?.assetNUP || '-' : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Merk</p>
                            <p className="text-sm font-medium">
                              {item.ticket?.type === 'perbaikan' ? item.ticket?.data?.brand || '-' : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Ruang</p>
                            <p className="text-sm font-medium">
                              {item.ticket?.type === 'perbaikan' ? item.ticket?.assetLocation || '-' : '-'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Nama Barang</p>
                            <p className="text-sm font-semibold">{item.ticket?.title || '-'}</p>
                          </div>
                        </div>

                        {/* Work Orders List */}
                        <div>
                          <p className="text-xs text-gray-500 mb-3">Work Order / Sparepart:</p>
                          <div className="space-y-2">
                            {item.workOrders.map((wo, idx) => {
                              const sparepartName = wo.spareparts?.[0]?.name || (wo.vendorInfo?.description || 'Service Vendor');
                              const sparepartQty = wo.spareparts?.[0]?.quantity || 1;
                              
                              return (
                                <div key={`${wo.id || idx}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <Badge variant={wo.type === 'sparepart' ? 'default' : 'secondary'}>
                                      {wo.type === 'sparepart' ? 'Sparepart' : 'Vendor'}
                                    </Badge>
                                    <span className="font-medium">
                                      {sparepartName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500">
                                      Qty: <span className="font-semibold text-gray-900">{wo.type === 'sparepart' ? sparepartQty : '1'}</span>
                                    </span>
                                    <span className="text-sm text-gray-500 min-w-[60px]">
                                      {wo.type === 'sparepart' ? 'Unit' : 'Service'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Summary by Ticket */}
              {filteredWorkOrders.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Total:</span> {filteredWorkOrders.length} Tiket | {filteredWorkOrders.reduce((sum, item) => sum + item.workOrders.length, 0)} Work Order
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laporan Statistik Tab */}
        <TabsContent value="laporan" className="space-y-6">
          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Trend Bulanan Tiket</CardTitle>
                <CardDescription>6 bulan terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
                    <Line type="monotone" dataKey="perbaikan" stroke="#10b981" name="Perbaikan" strokeWidth={2} />
                    <Line type="monotone" dataKey="zoom" stroke="#f59e0b" name="Zoom" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Status</CardTitle>
                <CardDescription>Status tiket saat ini</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Tipe Tiket</CardTitle>
                <CardDescription>Perbandingan jenis tiket</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6">
                      {typeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Work Order Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistik Work Order</CardTitle>
                <CardDescription>Work order yang telah selesai</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Completed</p>
                        <p className="text-2xl font-semibold">{workOrderStats.total}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sparepart</p>
                        <p className="text-2xl font-semibold">{workOrderStats.sparepart}</p>
                      </div>
                    </div>
                    <Badge>{((workOrderStats.sparepart / workOrderStats.total) * 100).toFixed(0)}%</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Truck className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Vendor</p>
                        <p className="text-2xl font-semibold">{workOrderStats.vendor}</p>
                      </div>
                    </div>
                    <Badge>{((workOrderStats.vendor / workOrderStats.total) * 100).toFixed(0)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};