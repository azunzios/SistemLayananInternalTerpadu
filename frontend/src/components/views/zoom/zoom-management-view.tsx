import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Calendar, Settings, List } from 'lucide-react';
import { getTickets } from '@/lib/storage';
import { ZoomAdminGrid } from './zoom-admin-grid';
import { ZoomAccountManagement } from './zoom-account-management';
import { ZoomTicketList } from './zoom-ticket-list';
import type { ViewType } from '@/components/main-layout';

interface ZoomManagementViewProps {
  onNavigate?: (view: ViewType, ticketId?: string) => void;
  onViewTicket?: (ticketId: string) => void;
}

export const ZoomManagementView: React.FC<ZoomManagementViewProps> = ({ onNavigate, onViewTicket }) => {
  const tickets = getTickets();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const handleViewTicketDetail = (ticketId: string) => {
    // Save current view (zoom-management) ke sessionStorage sebelum navigate ke detail
    sessionStorage.setItem('previousView', 'zoom-management');
    if (onNavigate) {
      onNavigate('ticket-detail', ticketId);
    }
    if (onViewTicket) {
      onViewTicket(ticketId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl flex items-center gap-3 font-bold">
          Kelola Zoom
          <Video className="h-8 w-8 text-blue-600" />
        </h1>
        <p className="text-gray-500 mt-1">
          Manajemen booking dan akun Zoom meeting
        </p>
      </div>

      {/* Tabs for Booking and Account Management */}
      <Tabs defaultValue="booking" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto rounded-full border border-black-400 bg-blue-100 text-slate-500 shadow-sm">
          <TabsTrigger
            value="booking"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            <Calendar className="h-4 w-4" />
            Kelola Zoom Booking
          </TabsTrigger>

          <TabsTrigger
            value="tickets"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            <List className="h-4 w-4" />
            Daftar Tiket Booking
          </TabsTrigger>

          <TabsTrigger
            value="accounts"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            <Settings className="h-4 w-4" />
            Manajemen Akun
          </TabsTrigger>
        </TabsList>

        {/* Zoom Booking Tab */}
        <TabsContent value="booking" className="mt-6">
          <ZoomAdminGrid
            tickets={tickets}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </TabsContent>

        {/* Zoom Ticket List Tab */}
        <TabsContent value="tickets" className="mt-6">
          <ZoomTicketList tickets={tickets} onViewDetail={handleViewTicketDetail} />
        </TabsContent>

        {/* Account Management Tab */}
        <TabsContent value="accounts" className="mt-6">
          <ZoomAccountManagement tickets={tickets} />
        </TabsContent>
      </Tabs>
    </div>
  );
};