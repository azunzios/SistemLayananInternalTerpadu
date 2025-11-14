import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';

interface WireframeProps {}

type WireframeView = 
  | 'login'
  | 'super-admin-dashboard'
  | 'admin-layanan-dashboard'
  | 'admin-penyedia-dashboard'
  | 'teknisi-dashboard'
  | 'user-dashboard'
  | 'ticket-list'
  | 'ticket-detail'
  | 'create-ticket'
  | 'user-management'
  | 'inventory'
  | 'zoom-booking'
  | 'reports';

export const Wireframe: React.FC<WireframeProps> = () => {
  const [selectedView, setSelectedView] = useState<WireframeView>('login');

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 pb-4 border-b-2 border-black">
          <h1 className="text-3xl">WIREFRAME - SISTEM TICKETING BPS NTB</h1>
          <p className="text-slate-600">Low-Fidelity Mockup - Black & White Structure</p>
        </div>

        {/* View Selector */}
        <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as WireframeView)} className="w-full">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-auto gap-2 bg-transparent">
              <TabsTrigger value="login" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Login
              </TabsTrigger>
              <TabsTrigger value="super-admin-dashboard" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Super Admin
              </TabsTrigger>
              <TabsTrigger value="admin-layanan-dashboard" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Admin Layanan
              </TabsTrigger>
              <TabsTrigger value="admin-penyedia-dashboard" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Admin Penyedia
              </TabsTrigger>
              <TabsTrigger value="teknisi-dashboard" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Teknisi
              </TabsTrigger>
              <TabsTrigger value="user-dashboard" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                User
              </TabsTrigger>
              <TabsTrigger value="ticket-list" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Ticket List
              </TabsTrigger>
              <TabsTrigger value="ticket-detail" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Ticket Detail
              </TabsTrigger>
              <TabsTrigger value="create-ticket" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Create Ticket
              </TabsTrigger>
              <TabsTrigger value="user-management" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                User Management
              </TabsTrigger>
              <TabsTrigger value="inventory" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Inventory
              </TabsTrigger>
              <TabsTrigger value="zoom-booking" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Zoom Booking
              </TabsTrigger>
              <TabsTrigger value="reports" className="border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white">
                Reports
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Login Page */}
          <TabsContent value="login" className="mt-6">
            <LoginWireframe />
          </TabsContent>

          {/* Super Admin Dashboard */}
          <TabsContent value="super-admin-dashboard" className="mt-6">
            <DashboardWireframe role="SUPER ADMIN" />
          </TabsContent>

          {/* Admin Layanan Dashboard */}
          <TabsContent value="admin-layanan-dashboard" className="mt-6">
            <DashboardWireframe role="ADMIN LAYANAN" />
          </TabsContent>

          {/* Admin Penyedia Dashboard */}
          <TabsContent value="admin-penyedia-dashboard" className="mt-6">
            <DashboardWireframe role="ADMIN PENYEDIA" />
          </TabsContent>

          {/* Teknisi Dashboard */}
          <TabsContent value="teknisi-dashboard" className="mt-6">
            <DashboardWireframe role="TEKNISI" />
          </TabsContent>

          {/* User Dashboard */}
          <TabsContent value="user-dashboard" className="mt-6">
            <DashboardWireframe role="USER" />
          </TabsContent>

          {/* Ticket List */}
          <TabsContent value="ticket-list" className="mt-6">
            <TicketListWireframe />
          </TabsContent>

          {/* Ticket Detail */}
          <TabsContent value="ticket-detail" className="mt-6">
            <TicketDetailWireframe />
          </TabsContent>

          {/* Create Ticket */}
          <TabsContent value="create-ticket" className="mt-6">
            <CreateTicketWireframe />
          </TabsContent>

          {/* User Management */}
          <TabsContent value="user-management" className="mt-6">
            <UserManagementWireframe />
          </TabsContent>

          {/* Inventory */}
          <TabsContent value="inventory" className="mt-6">
            <InventoryWireframe />
          </TabsContent>

          {/* Zoom Booking */}
          <TabsContent value="zoom-booking" className="mt-6">
            <ZoomBookingWireframe />
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="mt-6">
            <ReportsWireframe />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Login Wireframe
const LoginWireframe: React.FC = () => {
  return (
    <WireBox className="w-full h-[800px] bg-white border-4 border-black">
      <div className="flex h-full">
        {/* Left Side - Illustration */}
        <div className="w-1/2 border-r-4 border-black p-12 flex flex-col justify-center">
          <WireBox className="w-full h-64 bg-gray-100 border-2 border-black mb-6">
            <div className="text-center text-sm text-gray-500">ILLUSTRATION / LOGO AREA</div>
          </WireBox>
          <div className="space-y-2">
            <WireBox className="h-8 bg-black text-white flex items-center px-3">
              <span className="text-sm">Sistem Ticketing BPS NTB</span>
            </WireBox>
            <WireBox className="h-6 bg-gray-200 border-2 border-black">
              <span className="text-xs text-gray-600">Platform manajemen tiket internal</span>
            </WireBox>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="space-y-2">
              <WireBox className="h-12 bg-black text-white flex items-center px-4">
                <span className="text-lg">LOGIN</span>
              </WireBox>
              <WireBox className="h-6 bg-gray-100 border-2 border-black">
                <span className="text-xs text-gray-600">Masuk ke akun Anda</span>
              </WireBox>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                <span className="text-xs">Email</span>
              </WireBox>
              <WireBox className="h-12 bg-white border-2 border-black px-3">
                <span className="text-sm text-gray-400">email@example.com</span>
              </WireBox>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                <span className="text-xs">Password</span>
              </WireBox>
              <WireBox className="h-12 bg-white border-2 border-black px-3">
                <span className="text-sm text-gray-400">••••••••</span>
              </WireBox>
            </div>

            {/* Remember Me Checkbox */}
            <WireBox className="h-8 bg-gray-100 border-2 border-black flex items-center px-3">
              <div className="flex items-center gap-2">
                <WireBox className="w-4 h-4 bg-white border-2 border-black" />
                <span className="text-sm">Ingat Saya</span>
              </div>
            </WireBox>

            {/* Login Button */}
            <WireBox className="h-12 bg-black text-white flex items-center justify-center">
              <span className="text-sm">LOGIN</span>
            </WireBox>
          </div>
        </div>
      </div>
    </WireBox>
  );
};

// Dashboard Wireframe
const DashboardWireframe: React.FC<{ role: string }> = ({ role }) => {
  return (
    <WireBox className="w-full h-[900px] bg-white border-4 border-black">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 border-r-4 border-black flex flex-col">
          {/* Logo */}
          <WireBox className="h-16 bg-black text-white flex items-center justify-center border-b-4 border-black">
            <span className="text-sm">BPS NTB</span>
          </WireBox>

          {/* Menu Items */}
          <div className="flex-1 p-4 space-y-2">
            <WireBox className="h-10 bg-black text-white flex items-center px-3">
              <span className="text-xs">Dashboard</span>
            </WireBox>
            <WireBox className="h-10 bg-gray-100 border-2 border-black flex items-center px-3">
              <span className="text-xs">Kelola Tiket</span>
            </WireBox>
            <WireBox className="h-10 bg-gray-100 border-2 border-black flex items-center px-3">
              <span className="text-xs">Tiket Saya</span>
            </WireBox>
            <WireBox className="h-10 bg-gray-100 border-2 border-black flex items-center px-3">
              <span className="text-xs">Inventory</span>
            </WireBox>
            <WireBox className="h-10 bg-gray-100 border-2 border-black flex items-center px-3">
              <span className="text-xs">Laporan</span>
            </WireBox>
            <WireBox className="h-10 bg-gray-100 border-2 border-black flex items-center px-3">
              <span className="text-xs">User Management</span>
            </WireBox>
          </div>

          {/* User Profile */}
          <WireBox className="h-16 bg-gray-100 border-t-4 border-black flex items-center px-3 gap-2">
            <WireBox className="w-10 h-10 bg-black text-white flex items-center justify-center">
              <span className="text-xs">SA</span>
            </WireBox>
            <div className="flex-1 min-w-0">
              <div className="text-xs truncate">Super Admin</div>
            </div>
          </WireBox>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <WireBox className="h-16 bg-white border-b-4 border-black flex items-center justify-between px-6">
            <div>
              <WireBox className="h-8 bg-black text-white px-4 flex items-center inline-block">
                <span className="text-sm">{role} DASHBOARD</span>
              </WireBox>
            </div>
            <div className="flex gap-2">
              <WireBox className="w-10 h-10 bg-gray-100 border-2 border-black" />
              <WireBox className="w-10 h-10 bg-gray-100 border-2 border-black" />
            </div>
          </WireBox>

          {/* Content Area */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <WireBox key={i} className="h-32 bg-white border-2 border-black p-4">
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-gray-100 border border-black px-2">
                      <span className="text-xs">STAT LABEL {i}</span>
                    </WireBox>
                    <WireBox className="h-10 bg-black text-white flex items-center justify-center">
                      <span className="text-xl">{i * 23}</span>
                    </WireBox>
                    <WireBox className="h-4 bg-gray-200 border border-black" />
                  </div>
                </WireBox>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-4">
              <WireBox className="h-80 bg-white border-2 border-black p-4">
                <div className="space-y-3">
                  <WireBox className="h-8 bg-black text-white px-3 flex items-center">
                    <span className="text-xs">CHART TITLE 1</span>
                  </WireBox>
                  <WireBox className="h-64 bg-gray-50 border-2 border-black flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">BAR CHART /</div>
                      <div className="text-sm text-gray-500">LINE CHART AREA</div>
                    </div>
                  </WireBox>
                </div>
              </WireBox>

              <WireBox className="h-80 bg-white border-2 border-black p-4">
                <div className="space-y-3">
                  <WireBox className="h-8 bg-black text-white px-3 flex items-center">
                    <span className="text-xs">CHART TITLE 2</span>
                  </WireBox>
                  <WireBox className="h-64 bg-gray-50 border-2 border-black flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">PIE CHART /</div>
                      <div className="text-sm text-gray-500">DONUT CHART AREA</div>
                    </div>
                  </WireBox>
                </div>
              </WireBox>
            </div>

            {/* Recent Activity / Table */}
            <WireBox className="bg-white border-2 border-black p-4">
              <div className="space-y-3">
                <WireBox className="h-8 bg-black text-white px-3 flex items-center justify-between">
                  <span className="text-xs">RECENT ACTIVITY / LATEST TICKETS</span>
                  <span className="text-xs">View All →</span>
                </WireBox>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <WireBox key={i} className="h-12 bg-gray-50 border-2 border-black flex items-center px-3 gap-3">
                      <WireBox className="w-8 h-8 bg-black text-white flex items-center justify-center">
                        <span className="text-xs">{i}</span>
                      </WireBox>
                      <div className="flex-1 flex gap-3">
                        <WireBox className="flex-1 h-6 bg-white border border-black" />
                        <WireBox className="w-24 h-6 bg-white border border-black" />
                        <WireBox className="w-24 h-6 bg-white border border-black" />
                      </div>
                    </WireBox>
                  ))}
                </div>
              </div>
            </WireBox>
          </div>
        </div>
      </div>
    </WireBox>
  );
};

// Ticket List Wireframe
const TicketListWireframe: React.FC = () => {
  return (
    <WireBox className="w-full h-[900px] bg-white border-4 border-black">
      <div className="flex h-full">
        {/* Sidebar */}
        <SidebarWire />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <HeaderWire title="KELOLA TIKET" />

          {/* Content */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Filters */}
            <div className="flex gap-3">
              <WireBox className="flex-1 h-10 bg-white border-2 border-black px-3 flex items-center">
                <span className="text-xs text-gray-500">Search tickets...</span>
              </WireBox>
              <WireBox className="w-40 h-10 bg-white border-2 border-black px-3 flex items-center justify-between">
                <span className="text-xs">Status Filter</span>
                <span className="text-xs">▼</span>
              </WireBox>
              <WireBox className="w-40 h-10 bg-white border-2 border-black px-3 flex items-center justify-between">
                <span className="text-xs">Type Filter</span>
                <span className="text-xs">▼</span>
              </WireBox>
              <WireBox className="w-32 h-10 bg-black text-white flex items-center justify-center">
                <span className="text-xs">+ New Ticket</span>
              </WireBox>
            </div>

            {/* Table */}
            <WireBox className="bg-white border-2 border-black">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 p-3 bg-black text-white border-b-2 border-black">
                <div className="col-span-1 text-xs">ID</div>
                <div className="col-span-3 text-xs">TITLE</div>
                <div className="col-span-2 text-xs">REQUESTER</div>
                <div className="col-span-2 text-xs">TYPE</div>
                <div className="col-span-2 text-xs">STATUS</div>
                <div className="col-span-1 text-xs">PRIORITY</div>
                <div className="col-span-1 text-xs">DATE</div>
              </div>

              {/* Table Rows */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-3 border-b-2 border-black hover:bg-gray-50">
                  <div className="col-span-1">
                    <WireBox className="h-6 bg-gray-100 border border-black flex items-center justify-center">
                      <span className="text-xs">#{i}</span>
                    </WireBox>
                  </div>
                  <div className="col-span-3">
                    <WireBox className="h-6 bg-white border border-black px-2">
                      <span className="text-xs">Ticket Title {i}</span>
                    </WireBox>
                  </div>
                  <div className="col-span-2">
                    <WireBox className="h-6 bg-white border border-black px-2">
                      <span className="text-xs">User Name</span>
                    </WireBox>
                  </div>
                  <div className="col-span-2">
                    <WireBox className="h-6 bg-white border border-black px-2">
                      <span className="text-xs">Perbaikan</span>
                    </WireBox>
                  </div>
                  <div className="col-span-2">
                    <WireBox className={`h-6 ${i % 3 === 0 ? 'bg-black text-white' : i % 3 === 1 ? 'bg-gray-300' : 'bg-white'} border border-black px-2 flex items-center justify-center`}>
                      <span className="text-xs">{i % 3 === 0 ? 'Open' : i % 3 === 1 ? 'Progress' : 'Done'}</span>
                    </WireBox>
                  </div>
                  <div className="col-span-1">
                    <WireBox className="h-6 bg-white border border-black px-2 flex items-center justify-center">
                      <span className="text-xs">{i % 2 === 0 ? 'H' : 'L'}</span>
                    </WireBox>
                  </div>
                  <div className="col-span-1">
                    <WireBox className="h-6 bg-white border border-black px-2">
                      <span className="text-xs">14/10</span>
                    </WireBox>
                  </div>
                </div>
              ))}
            </WireBox>

            {/* Pagination */}
            <div className="flex justify-between items-center">
              <WireBox className="h-8 bg-gray-100 border-2 border-black px-3 flex items-center">
                <span className="text-xs">Showing 1-10 of 50</span>
              </WireBox>
              <div className="flex gap-2">
                <WireBox className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center">
                  <span className="text-xs">←</span>
                </WireBox>
                <WireBox className="w-8 h-8 bg-black text-white border-2 border-black flex items-center justify-center">
                  <span className="text-xs">1</span>
                </WireBox>
                <WireBox className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center">
                  <span className="text-xs">2</span>
                </WireBox>
                <WireBox className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center">
                  <span className="text-xs">3</span>
                </WireBox>
                <WireBox className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center">
                  <span className="text-xs">→</span>
                </WireBox>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WireBox>
  );
};

// Ticket Detail Wireframe
const TicketDetailWireframe: React.FC = () => {
  return (
    <WireBox className="w-full h-[900px] bg-white border-4 border-black">
      <div className="flex h-full">
        <SidebarWire />

        <div className="flex-1 flex flex-col">
          <HeaderWire title="DETAIL TIKET #12345" />

          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Ticket Info Header */}
            <div className="grid grid-cols-3 gap-4">
              <WireBox className="col-span-2 bg-white border-2 border-black p-4">
                <div className="space-y-3">
                  <WireBox className="h-10 bg-black text-white px-3 flex items-center">
                    <span className="text-sm">Permintaan Laptop Dell untuk Tim IT</span>
                  </WireBox>
                  <div className="flex gap-2">
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-3 flex items-center">
                      <span className="text-xs">Type: Permintaan</span>
                    </WireBox>
                    <WireBox className="h-6 bg-black text-white border-2 border-black px-3 flex items-center">
                      <span className="text-xs">Status: Open</span>
                    </WireBox>
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-3 flex items-center">
                      <span className="text-xs">Priority: High</span>
                    </WireBox>
                  </div>
                </div>
              </WireBox>

              <WireBox className="bg-white border-2 border-black p-4">
                <div className="space-y-2">
                  <WireBox className="h-6 bg-black text-white px-2 flex items-center">
                    <span className="text-xs">METADATA</span>
                  </WireBox>
                  <WireBox className="h-6 bg-gray-100 border border-black px-2">
                    <span className="text-xs">Created: 14 Oct 2025</span>
                  </WireBox>
                  <WireBox className="h-6 bg-gray-100 border border-black px-2">
                    <span className="text-xs">Requester: John Doe</span>
                  </WireBox>
                  <WireBox className="h-6 bg-gray-100 border border-black px-2">
                    <span className="text-xs">Assigned: Jane Smith</span>
                  </WireBox>
                </div>
              </WireBox>
            </div>

            {/* Progress Tracker */}
            <WireBox className="bg-white border-2 border-black p-4">
              <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-3">
                <span className="text-xs">PROGRESS TRACKER</span>
              </WireBox>
              <div className="flex gap-2">
                {['Submitted', 'Approved', 'In Progress', 'Completed'].map((step, i) => (
                  <WireBox key={i} className={`flex-1 h-16 ${i === 0 || i === 1 ? 'bg-black text-white' : 'bg-gray-100'} border-2 border-black flex items-center justify-center`}>
                    <div className="text-center">
                      <div className="text-xs">{i + 1}</div>
                      <div className="text-xs">{step}</div>
                    </div>
                  </WireBox>
                ))}
              </div>
            </WireBox>

            {/* Main Content Area */}
            <div className="grid grid-cols-3 gap-4">
              {/* Description & Timeline */}
              <div className="col-span-2 space-y-4">
                <WireBox className="bg-white border-2 border-black p-4">
                  <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-3">
                    <span className="text-xs">DESCRIPTION</span>
                  </WireBox>
                  <WireBox className="h-32 bg-gray-50 border-2 border-black p-3">
                    <div className="text-xs text-gray-600">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
                    </div>
                  </WireBox>
                </WireBox>

                <WireBox className="bg-white border-2 border-black p-4">
                  <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-3">
                    <span className="text-xs">TIMELINE / ACTIVITY LOG</span>
                  </WireBox>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <WireBox key={i} className="h-16 bg-gray-50 border-2 border-black p-2 flex gap-2">
                        <WireBox className="w-12 h-full bg-black text-white flex items-center justify-center">
                          <span className="text-xs">{i}</span>
                        </WireBox>
                        <div className="flex-1 space-y-1">
                          <WireBox className="h-5 bg-white border border-black px-2">
                            <span className="text-xs">Activity {i}</span>
                          </WireBox>
                          <WireBox className="h-5 bg-white border border-black px-2">
                            <span className="text-xs">14 Oct 2025 - 10:30</span>
                          </WireBox>
                        </div>
                      </WireBox>
                    ))}
                  </div>
                </WireBox>
              </div>

              {/* Sidebar Actions */}
              <div className="space-y-4">
                <WireBox className="bg-white border-2 border-black p-4">
                  <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-3">
                    <span className="text-xs">ACTIONS</span>
                  </WireBox>
                  <div className="space-y-2">
                    <WireBox className="h-10 bg-black text-white flex items-center justify-center">
                      <span className="text-xs">Update Status</span>
                    </WireBox>
                    <WireBox className="h-10 bg-white border-2 border-black flex items-center justify-center">
                      <span className="text-xs">Assign Teknisi</span>
                    </WireBox>
                    <WireBox className="h-10 bg-white border-2 border-black flex items-center justify-center">
                      <span className="text-xs">Add Comment</span>
                    </WireBox>
                    <WireBox className="h-10 bg-white border-2 border-black flex items-center justify-center">
                      <span className="text-xs">Upload Files</span>
                    </WireBox>
                  </div>
                </WireBox>

                <WireBox className="bg-white border-2 border-black p-4">
                  <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-3">
                    <span className="text-xs">ATTACHMENTS</span>
                  </WireBox>
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <WireBox key={i} className="h-12 bg-gray-50 border-2 border-black p-2">
                        <div className="flex items-center gap-2">
                          <WireBox className="w-8 h-8 bg-black" />
                          <span className="text-xs">file_{i}.pdf</span>
                        </div>
                      </WireBox>
                    ))}
                  </div>
                </WireBox>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WireBox>
  );
};

// Create Ticket Wireframe
const CreateTicketWireframe: React.FC = () => {
  return (
    <WireBox className="w-full h-[900px] bg-white border-4 border-black">
      <div className="flex h-full">
        <SidebarWire />

        <div className="flex-1 flex flex-col">
          <HeaderWire title="BUAT TIKET BARU" />

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Ticket Type Selection */}
              <WireBox className="bg-white border-2 border-black p-4">
                <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-4">
                  <span className="text-xs">PILIH JENIS TIKET</span>
                </WireBox>
                <div className="grid grid-cols-3 gap-3">
                  <WireBox className="h-32 bg-black text-white border-2 border-black p-4 flex flex-col items-center justify-center">
                    <WireBox className="w-12 h-12 bg-white mb-2" />
                    <span className="text-xs">Permintaan Barang</span>
                  </WireBox>
                  <WireBox className="h-32 bg-white border-2 border-black p-4 flex flex-col items-center justify-center">
                    <WireBox className="w-12 h-12 bg-black mb-2" />
                    <span className="text-xs">Perbaikan Barang</span>
                  </WireBox>
                  <WireBox className="h-32 bg-white border-2 border-black p-4 flex flex-col items-center justify-center">
                    <WireBox className="w-12 h-12 bg-black mb-2" />
                    <span className="text-xs">Peminjaman Zoom</span>
                  </WireBox>
                </div>
              </WireBox>

              {/* Form Fields */}
              <WireBox className="bg-white border-2 border-black p-4">
                <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-4">
                  <span className="text-xs">DETAIL PERMINTAAN</span>
                </WireBox>

                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                      <span className="text-xs">Judul Permintaan</span>
                    </WireBox>
                    <WireBox className="h-12 bg-white border-2 border-black px-3">
                      <span className="text-sm text-gray-400">Masukkan judul permintaan...</span>
                    </WireBox>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                      <span className="text-xs">Kategori</span>
                    </WireBox>
                    <WireBox className="h-12 bg-white border-2 border-black px-3 flex items-center justify-between">
                      <span className="text-sm text-gray-400">Pilih kategori...</span>
                      <span className="text-sm">▼</span>
                    </WireBox>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                      <span className="text-xs">Prioritas</span>
                    </WireBox>
                    <div className="grid grid-cols-3 gap-2">
                      <WireBox className="h-10 bg-black text-white border-2 border-black flex items-center justify-center">
                        <span className="text-xs">High</span>
                      </WireBox>
                      <WireBox className="h-10 bg-white border-2 border-black flex items-center justify-center">
                        <span className="text-xs">Medium</span>
                      </WireBox>
                      <WireBox className="h-10 bg-white border-2 border-black flex items-center justify-center">
                        <span className="text-xs">Low</span>
                      </WireBox>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                      <span className="text-xs">Deskripsi Detail</span>
                    </WireBox>
                    <WireBox className="h-32 bg-white border-2 border-black px-3 py-2">
                      <span className="text-sm text-gray-400">Jelaskan detail permintaan Anda...</span>
                    </WireBox>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                      <span className="text-xs">Lampiran (Optional)</span>
                    </WireBox>
                    <WireBox className="h-24 bg-gray-50 border-2 border-dashed border-black flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Drop files here or</div>
                        <WireBox className="h-8 bg-black text-white px-4 inline-flex items-center mt-2">
                          <span className="text-xs">Browse Files</span>
                        </WireBox>
                      </div>
                    </WireBox>
                  </div>
                </div>
              </WireBox>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <WireBox className="h-12 px-8 bg-white border-2 border-black flex items-center justify-center">
                  <span className="text-sm">Cancel</span>
                </WireBox>
                <WireBox className="h-12 px-8 bg-black text-white flex items-center justify-center">
                  <span className="text-sm">Submit Ticket</span>
                </WireBox>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WireBox>
  );
};

// User Management Wireframe
const UserManagementWireframe: React.FC = () => {
  return (
    <WireBox className="w-full h-[900px] bg-white border-4 border-black">
      <div className="flex h-full">
        <SidebarWire />

        <div className="flex-1 flex flex-col">
          <HeaderWire title="USER MANAGEMENT" />

          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <WireBox className="w-80 h-10 bg-white border-2 border-black px-3 flex items-center">
                  <span className="text-xs text-gray-500">Search users...</span>
                </WireBox>
                <WireBox className="w-40 h-10 bg-white border-2 border-black px-3 flex items-center justify-between">
                  <span className="text-xs">Role Filter</span>
                  <span className="text-xs">▼</span>
                </WireBox>
              </div>
              <WireBox className="h-10 px-6 bg-black text-white flex items-center justify-center">
                <span className="text-xs">+ Add New User</span>
              </WireBox>
            </div>

            {/* User Table */}
            <WireBox className="bg-white border-2 border-black">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 p-3 bg-black text-white border-b-2 border-black">
                <div className="col-span-3 text-xs">NAME</div>
                <div className="col-span-3 text-xs">EMAIL</div>
                <div className="col-span-2 text-xs">ROLE</div>
                <div className="col-span-2 text-xs">UNIT KERJA</div>
                <div className="col-span-1 text-xs">STATUS</div>
                <div className="col-span-1 text-xs">ACTIONS</div>
              </div>

              {/* Rows */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-3 border-b-2 border-black hover:bg-gray-50">
                  <div className="col-span-3 flex items-center gap-2">
                    <WireBox className="w-8 h-8 bg-black text-white flex items-center justify-center">
                      <span className="text-xs">U</span>
                    </WireBox>
                    <WireBox className="flex-1 h-6 bg-white border border-black px-2">
                      <span className="text-xs">User Name {i}</span>
                    </WireBox>
                  </div>
                  <div className="col-span-3">
                    <WireBox className="h-6 bg-white border border-black px-2">
                      <span className="text-xs">user{i}@bps.go.id</span>
                    </WireBox>
                  </div>
                  <div className="col-span-2">
                    <WireBox className="h-6 bg-gray-100 border border-black px-2 flex items-center justify-center">
                      <span className="text-xs">{i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Teknisi' : 'Pegawai'}</span>
                    </WireBox>
                  </div>
                  <div className="col-span-2">
                    <WireBox className="h-6 bg-white border border-black px-2">
                      <span className="text-xs">Unit {i}</span>
                    </WireBox>
                  </div>
                  <div className="col-span-1">
                    <WireBox className={`h-6 ${i % 4 !== 0 ? 'bg-black text-white' : 'bg-gray-300'} border border-black flex items-center justify-center`}>
                      <span className="text-xs">{i % 4 !== 0 ? 'Active' : 'Inactive'}</span>
                    </WireBox>
                  </div>
                  <div className="col-span-1 flex gap-1">
                    <WireBox className="flex-1 h-6 bg-white border border-black" />
                    <WireBox className="flex-1 h-6 bg-white border border-black" />
                  </div>
                </div>
              ))}
            </WireBox>
          </div>
        </div>
      </div>
    </WireBox>
  );
};

// Inventory Wireframe
const InventoryWireframe: React.FC = () => {
  return (
    <WireBox className="w-full h-[900px] bg-white border-4 border-black">
      <div className="flex h-full">
        <SidebarWire />

        <div className="flex-1 flex flex-col">
          <HeaderWire title="INVENTORY" />

          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Tabs */}
            <div className="flex gap-2 border-b-2 border-black pb-2">
              <WireBox className="h-10 px-6 bg-black text-white flex items-center">
                <span className="text-xs">Inventory</span>
              </WireBox>
              <WireBox className="h-10 px-6 bg-white border-2 border-black flex items-center">
                <span className="text-xs">Pengadaan</span>
              </WireBox>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <WireBox className="h-24 bg-white border-2 border-black p-3">
                <WireBox className="h-5 bg-gray-100 border border-black px-2 mb-2">
                  <span className="text-xs">Total Items</span>
                </WireBox>
                <WireBox className="h-10 bg-black text-white flex items-center justify-center">
                  <span className="text-lg">89</span>
                </WireBox>
              </WireBox>
              <WireBox className="h-24 bg-white border-2 border-black p-3">
                <WireBox className="h-5 bg-gray-100 border border-black px-2 mb-2">
                  <span className="text-xs">Low Stock</span>
                </WireBox>
                <WireBox className="h-10 bg-black text-white flex items-center justify-center">
                  <span className="text-lg">12</span>
                </WireBox>
              </WireBox>
              <WireBox className="h-24 bg-white border-2 border-black p-3">
                <WireBox className="h-5 bg-gray-100 border border-black px-2 mb-2">
                  <span className="text-xs">Out of Stock</span>
                </WireBox>
                <WireBox className="h-10 bg-black text-white flex items-center justify-center">
                  <span className="text-lg">3</span>
                </WireBox>
              </WireBox>
              <WireBox className="h-24 bg-white border-2 border-black p-3">
                <WireBox className="h-5 bg-gray-100 border border-black px-2 mb-2">
                  <span className="text-xs">Categories</span>
                </WireBox>
                <WireBox className="h-10 bg-black text-white flex items-center justify-center">
                  <span className="text-lg">8</span>
                </WireBox>
              </WireBox>
            </div>

            {/* Filters & Actions */}
            <div className="flex gap-3">
              <WireBox className="flex-1 h-10 bg-white border-2 border-black px-3 flex items-center">
                <span className="text-xs text-gray-500">Search items...</span>
              </WireBox>
              <WireBox className="w-40 h-10 bg-white border-2 border-black px-3 flex items-center justify-between">
                <span className="text-xs">Category</span>
                <span className="text-xs">▼</span>
              </WireBox>
              <WireBox className="w-32 h-10 bg-black text-white flex items-center justify-center">
                <span className="text-xs">+ Add Item</span>
              </WireBox>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <WireBox key={i} className="bg-white border-2 border-black p-3">
                  <WireBox className="w-full h-32 bg-gray-100 border-2 border-black mb-3" />
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-black text-white px-2 flex items-center">
                      <span className="text-xs">Item Name {i}</span>
                    </WireBox>
                    <WireBox className="h-5 bg-gray-100 border border-black px-2">
                      <span className="text-xs">Category</span>
                    </WireBox>
                    <div className="flex justify-between items-center">
                      <WireBox className="h-6 px-2 bg-white border border-black">
                        <span className="text-xs">Stock: {i * 5}</span>
                      </WireBox>
                      <WireBox className="h-6 w-6 bg-black" />
                    </div>
                  </div>
                </WireBox>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WireBox>
  );
};

// Zoom Booking Wireframe
const ZoomBookingWireframe: React.FC = () => {
  return (
    <WireBox className="w-full h-[900px] bg-white border-4 border-black">
      <div className="flex h-full">
        <SidebarWire />

        <div className="flex-1 flex flex-col">
          <HeaderWire title="BOOKING ZOOM MEETING" />

          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              {/* Calendar */}
              <WireBox className="bg-white border-2 border-black p-4">
                <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-4">
                  <span className="text-xs">PILIH TANGGAL</span>
                </WireBox>
                <WireBox className="h-80 bg-gray-50 border-2 border-black p-3">
                  {/* Calendar Header */}
                  <div className="flex justify-between items-center mb-3">
                    <WireBox className="w-8 h-8 bg-black text-white flex items-center justify-center">
                      <span className="text-xs">←</span>
                    </WireBox>
                    <WireBox className="h-8 px-4 bg-gray-100 border-2 border-black flex items-center">
                      <span className="text-xs">Oktober 2025</span>
                    </WireBox>
                    <WireBox className="w-8 h-8 bg-black text-white flex items-center justify-center">
                      <span className="text-xs">→</span>
                    </WireBox>
                  </div>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <WireBox key={i} className="h-8 bg-gray-200 border border-black flex items-center justify-center">
                        <span className="text-xs">{day}</span>
                      </WireBox>
                    ))}
                    {Array.from({ length: 35 }).map((_, i) => (
                      <WireBox
                        key={i}
                        className={`h-8 ${i === 14 ? 'bg-black text-white' : 'bg-white'} border border-black flex items-center justify-center`}
                      >
                        <span className="text-xs">{i < 31 ? i + 1 : ''}</span>
                      </WireBox>
                    ))}
                  </div>
                </WireBox>
              </WireBox>

              {/* Booking Form */}
              <WireBox className="bg-white border-2 border-black p-4">
                <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-4">
                  <span className="text-xs">DETAIL BOOKING</span>
                </WireBox>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                      <span className="text-xs">Waktu Mulai</span>
                    </WireBox>
                    <WireBox className="h-10 bg-white border-2 border-black px-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">09:00</span>
                      <span className="text-xs">▼</span>
                    </WireBox>
                  </div>
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                      <span className="text-xs">Waktu Selesai</span>
                    </WireBox>
                    <WireBox className="h-10 bg-white border-2 border-black px-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">11:00</span>
                      <span className="text-xs">▼</span>
                    </WireBox>
                  </div>
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                      <span className="text-xs">Ruangan</span>
                    </WireBox>
                    <WireBox className="h-10 bg-white border-2 border-black px-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Pilih ruangan...</span>
                      <span className="text-xs">▼</span>
                    </WireBox>
                  </div>
                  <div className="space-y-2">
                    <WireBox className="h-6 bg-gray-100 border-2 border-black px-2">
                      <span className="text-xs">Keperluan</span>
                    </WireBox>
                    <WireBox className="h-24 bg-white border-2 border-black px-3 py-2">
                      <span className="text-xs text-gray-400">Jelaskan keperluan meeting...</span>
                    </WireBox>
                  </div>
                  <WireBox className="h-10 bg-black text-white flex items-center justify-center mt-4">
                    <span className="text-xs">Submit Booking</span>
                  </WireBox>
                </div>
              </WireBox>
            </div>

            {/* My Bookings */}
            <WireBox className="bg-white border-2 border-black p-4">
              <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-3">
                <span className="text-xs">BOOKING SAYA</span>
              </WireBox>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <WireBox key={i} className="h-16 bg-gray-50 border-2 border-black p-3 flex items-center justify-between">
                    <div className="flex gap-3 items-center flex-1">
                      <WireBox className="w-12 h-12 bg-black text-white flex items-center justify-center">
                        <span className="text-xs">{i}</span>
                      </WireBox>
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <WireBox className="h-6 bg-white border border-black px-2">
                          <span className="text-xs">14 Okt 2025</span>
                        </WireBox>
                        <WireBox className="h-6 bg-white border border-black px-2">
                          <span className="text-xs">09:00 - 11:00</span>
                        </WireBox>
                        <WireBox className="h-6 bg-white border border-black px-2">
                          <span className="text-xs">Room A</span>
                        </WireBox>
                        <WireBox className="h-6 bg-black text-white border border-black px-2 flex items-center justify-center">
                          <span className="text-xs">Approved</span>
                        </WireBox>
                      </div>
                    </div>
                    <WireBox className="w-8 h-8 bg-white border-2 border-black" />
                  </WireBox>
                ))}
              </div>
            </WireBox>
          </div>
        </div>
      </div>
    </WireBox>
  );
};

// Reports Wireframe
const ReportsWireframe: React.FC = () => {
  return (
    <WireBox className="w-full h-[900px] bg-white border-4 border-black">
      <div className="flex h-full">
        <SidebarWire />

        <div className="flex-1 flex flex-col">
          <HeaderWire title="LAPORAN & ANALYTICS" />

          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Filters */}
            <div className="flex gap-3">
              <WireBox className="w-48 h-10 bg-white border-2 border-black px-3 flex items-center justify-between">
                <span className="text-xs">Date Range</span>
                <span className="text-xs">▼</span>
              </WireBox>
              <WireBox className="w-40 h-10 bg-white border-2 border-black px-3 flex items-center justify-between">
                <span className="text-xs">Ticket Type</span>
                <span className="text-xs">▼</span>
              </WireBox>
              <WireBox className="w-40 h-10 bg-white border-2 border-black px-3 flex items-center justify-between">
                <span className="text-xs">Status</span>
                <span className="text-xs">▼</span>
              </WireBox>
              <WireBox className="h-10 px-6 bg-black text-white flex items-center ml-auto">
                <span className="text-xs">Export PDF</span>
              </WireBox>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-5 gap-3">
              {['Total Tickets', 'Completed', 'In Progress', 'Pending', 'Avg Response Time'].map((label, i) => (
                <WireBox key={i} className="h-28 bg-white border-2 border-black p-3">
                  <WireBox className="h-6 bg-gray-100 border border-black px-2 mb-2">
                    <span className="text-xs">{label}</span>
                  </WireBox>
                  <WireBox className="h-12 bg-black text-white flex items-center justify-center">
                    <span className="text-xl">{i === 4 ? '2.5h' : (i + 1) * 34}</span>
                  </WireBox>
                </WireBox>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              <WireBox className="h-96 bg-white border-2 border-black p-4">
                <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-3">
                  <span className="text-xs">TICKETS PER MONTH</span>
                </WireBox>
                <WireBox className="h-80 bg-gray-50 border-2 border-black flex items-center justify-center">
                  <div className="text-center text-sm text-gray-500">BAR CHART</div>
                </WireBox>
              </WireBox>

              <WireBox className="h-96 bg-white border-2 border-black p-4">
                <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-3">
                  <span className="text-xs">TICKET STATUS DISTRIBUTION</span>
                </WireBox>
                <WireBox className="h-80 bg-gray-50 border-2 border-black flex items-center justify-center">
                  <div className="text-center text-sm text-gray-500">PIE CHART</div>
                </WireBox>
              </WireBox>
            </div>

            {/* Table */}
            <WireBox className="bg-white border-2 border-black p-4">
              <WireBox className="h-8 bg-black text-white px-3 flex items-center mb-3">
                <span className="text-xs">DETAILED REPORT</span>
              </WireBox>
              <WireBox className="bg-white border-2 border-black">
                <div className="grid grid-cols-6 gap-2 p-2 bg-black text-white">
                  <div className="text-xs">TICKET ID</div>
                  <div className="text-xs">TYPE</div>
                  <div className="text-xs">REQUESTER</div>
                  <div className="text-xs">STATUS</div>
                  <div className="text-xs">CREATED</div>
                  <div className="text-xs">COMPLETED</div>
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 p-2 border-b border-black">
                    <WireBox className="h-6 bg-gray-100 border border-black" />
                    <WireBox className="h-6 bg-gray-100 border border-black" />
                    <WireBox className="h-6 bg-gray-100 border border-black" />
                    <WireBox className="h-6 bg-black text-white border border-black" />
                    <WireBox className="h-6 bg-gray-100 border border-black" />
                    <WireBox className="h-6 bg-gray-100 border border-black" />
                  </div>
                ))}
              </WireBox>
            </WireBox>
          </div>
        </div>
      </div>
    </WireBox>
  );
};

// Reusable Components
const WireBox: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
};

const SidebarWire: React.FC = () => {
  return (
    <div className="w-64 border-r-4 border-black flex flex-col">
      <WireBox className="h-16 bg-black text-white flex items-center justify-center border-b-4 border-black">
        <span className="text-sm">BPS NTB</span>
      </WireBox>
      <div className="flex-1 p-4 space-y-2">
        <WireBox className="h-10 bg-black text-white flex items-center px-3">
          <span className="text-xs">Dashboard</span>
        </WireBox>
        <WireBox className="h-10 bg-gray-100 border-2 border-black flex items-center px-3">
          <span className="text-xs">Kelola Tiket</span>
        </WireBox>
        <WireBox className="h-10 bg-gray-100 border-2 border-black flex items-center px-3">
          <span className="text-xs">Tiket Saya</span>
        </WireBox>
        <WireBox className="h-10 bg-gray-100 border-2 border-black flex items-center px-3">
          <span className="text-xs">Menu Item</span>
        </WireBox>
        <WireBox className="h-10 bg-gray-100 border-2 border-black flex items-center px-3">
          <span className="text-xs">Menu Item</span>
        </WireBox>
      </div>
      <WireBox className="h-16 bg-gray-100 border-t-4 border-black flex items-center px-3 gap-2">
        <WireBox className="w-10 h-10 bg-black text-white flex items-center justify-center">
          <span className="text-xs">U</span>
        </WireBox>
        <div className="flex-1 min-w-0">
          <div className="text-xs truncate">User Name</div>
        </div>
      </WireBox>
    </div>
  );
};

const HeaderWire: React.FC<{ title: string }> = ({ title }) => {
  return (
    <WireBox className="h-16 bg-white border-b-4 border-black flex items-center justify-between px-6">
      <WireBox className="h-8 bg-black text-white px-4 flex items-center">
        <span className="text-sm">{title}</span>
      </WireBox>
      <div className="flex gap-2">
        <WireBox className="w-10 h-10 bg-gray-100 border-2 border-black" />
        <WireBox className="w-10 h-10 bg-gray-100 border-2 border-black" />
      </div>
    </WireBox>
  );
};
