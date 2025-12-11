import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Calendar, Settings, List } from 'lucide-react';
import { getTickets, getCurrentUser } from '@/lib/storage';
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
  const currentUser = getCurrentUser();
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
      <h1 className="text-3xl max-md:text-2xl flex items-center gap-3 font-bold">
        Kelola Zoom
        <Video className="h-8 w-8 max-md:h-6 max-md:w-6 text-blue-600" />
      </h1>
      <p className="text-gray-500 mt-1 max-md:text-sm">
        Manajemen booking dan akun Zoom meeting
      </p>
    </div>

    {/* Tabs for Booking and Account Management */}
    <Tabs defaultValue="booking" className="w-full"> 
      <TabsList className="w-full max-md:!rounded-md bg-blue-100 text-slate-500 border border-black-400 p-1 shadow-sm h-auto md:grid md:grid-cols-3 max-md:flex max-md:flex-col max-md:space-y-2">
        
        <TabsTrigger
          value="booking"
          className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-full max-md:rounded-lg max-md:w-full max-md:justify-start max-md:px-4"
        >
          <Calendar className="h-4 w-4 flex-shrink-0" />
          Kelola Zoom Booking
        </TabsTrigger>

        <TabsTrigger
          value="tickets"
          className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-full max-md:rounded-lg max-md:w-full max-md:justify-start max-md:px-4"
        >
          <List className="h-4 w-4 flex-shrink-0" />
          Daftar Tiket Booking
        </TabsTrigger>

        <TabsTrigger
          value="accounts"
          className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-full max-md:rounded-lg max-md:w-full max-md:justify-start max-md:px-4"
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          Manajemen Akun
        </TabsTrigger>
      </TabsList>

      {/* Konten Tab tetap sama */}
      <TabsContent value="booking" className="mt-6">
        <ZoomAdminGrid
          tickets={tickets}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </TabsContent>

      <TabsContent value="tickets" className="mt-6">
        <ZoomTicketList tickets={tickets} onViewDetail={handleViewTicketDetail} />
      </TabsContent>

      <TabsContent value="accounts" className="mt-6">
        {currentUser && <ZoomAccountManagement tickets={tickets} currentUser={currentUser} />}
      </TabsContent>
    </Tabs>
  </div>
);
};