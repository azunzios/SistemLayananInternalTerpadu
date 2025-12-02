// @ts-nocheck
import { toast } from 'sonner';
import { getTickets, saveTickets, getUsersSync, addNotification} from '@/lib/storage';
import type { User, PerbaikanStatus, ZoomStatus } from '@/types';

type TicketStatus = PerbaikanStatus | ZoomStatus;

export const formatActorName = (actor: string, users: User[]): string => {
  if (/^user-\d+$/.test(actor)) {
    return 'Sistem';
  }

  const user = users.find(u => u.name === actor);
  if (user) {
    return user.name;
  }

  return actor;
};

export const handleApproveTicket = (
  ticketId: string,
  currentUser: User,
  onSuccess: (tickets: any[]) => void
) => {
  const tickets = getTickets();
  const updatedTickets = tickets.map(t => {
    if (t.id === ticketId) {
      const newStatus: TicketStatus = t.type === 'perbaikan'
        ? 'disetujui'
        : 'approved';

      return {
        ...t,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...t.timeline,
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: 'APPROVED',
            actor: currentUser.name,
            details: 'Tiket disetujui',
          },
        ],
      };
    }
    return t;
  });

  saveTickets(updatedTickets);
  const ticket = updatedTickets.find(t => t.id === ticketId);

  if (ticket) {
    addNotification({
      userId: ticket.userId,
      title: 'Tiket Disetujui',
      message: `Tiket ${ticket.ticketNumber} telah disetujui`,
      type: 'success',
      read: false,
    });
  }

  toast.success('Tiket berhasil disetujui');
  onSuccess(updatedTickets);
};

export const handleRejectTicket = (
  ticketId: string,
  reason: string,
  currentUser: User,
  onSuccess: (tickets: any[]) => void
) => {
  if (!reason.trim()) {
    toast.error('Alasan penolakan harus diisi');
    return false;
  }

  const tickets = getTickets();
  const updatedTickets = tickets.map(t => {
    if (t.id === ticketId) {
      return {
        ...t,
        status: 'ditolak' as TicketStatus,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...t.timeline,
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: 'REJECTED',
            actor: currentUser.name,
            details: `Tiket ditolak: ${reason}`,
          },
        ],
      };
    }
    return t;
  });

  saveTickets(updatedTickets);
  const ticket = updatedTickets.find(t => t.id === ticketId);

  if (ticket) {
    addNotification({
      userId: ticket.userId,
      title: 'Tiket Ditolak',
      message: `Tiket ${ticket.ticketNumber} ditolak: ${reason}`,
      type: 'error',
      read: false,
    });
  }

  toast.success('Tiket berhasil ditolak');
  onSuccess(updatedTickets);
  return true;
};

export const handleAssignTicket = (
  ticketId: string,
  technicianId: string,
  notes: string,
  currentUser: User,
  onSuccess: (tickets: any[]) => void
) => {
  if (!technicianId) {
    toast.error('Pilih teknisi terlebih dahulu');
    return false;
  }

  const tickets = getTickets();
  const users = getUsersSync();

  const updatedTickets = tickets.map(t => {
    if (t.id === ticketId) {
      return {
        ...t,
        status: 'assigned' as TicketStatus,
        assignedTo: technicianId,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...t.timeline,
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: 'ASSIGNED',
            actor: currentUser.name,
            details: `Ditugaskan ke ${users.find(u => u.id === technicianId)?.name}${notes ? `: ${notes}` : ''}`,
          },
        ],
      };
    }
    return t;
  });

  saveTickets(updatedTickets);
  const ticket = updatedTickets.find(t => t.id === ticketId);

  if (ticket) {
    addNotification({
      userId: technicianId,
      title: 'Tiket Baru Ditugaskan',
      message: `Anda ditugaskan untuk menangani tiket ${ticket.ticketNumber}`,
      type: 'info',
      read: false,
    });

    addNotification({
      userId: ticket.userId,
      title: 'Tiket Sedang Ditangani',
      message: `Tiket ${ticket.ticketNumber} sedang ditangani oleh teknisi`,
      type: 'info',
      read: false,
    });
  }

  toast.success('Tiket berhasil ditugaskan');
  onSuccess(updatedTickets);
  return true;
};

export const handleCompleteTicket = (
  ticketId: string,
  currentUser: User,
  onSuccess: (tickets: any[]) => void
) => {
  const tickets = getTickets();
  const updatedTickets = tickets.map(t => {
    if (t.id === ticketId) {
      return {
        ...t,
        status: 'closed' as TicketStatus,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...t.timeline,
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: 'CLOSED',
            actor: currentUser.name,
            details: 'Tiket dikonfirmasi selesai oleh user',
          },
        ],
      };
    }
    return t;
  });

  saveTickets(updatedTickets);
  const ticket = updatedTickets.find(t => t.id === ticketId);

  if (ticket && ticket.assignedTo) {
    addNotification({
      userId: ticket.assignedTo,
      title: 'Tiket Diselesaikan',
      message: `Tiket ${ticket.ticketNumber} telah dikonfirmasi selesai oleh user`,
      type: 'success',
      read: false,
    });
  }

  toast.success('Terima kasih atas konfirmasinya!');
  onSuccess(updatedTickets);
};

export const handleAddComment = (
  ticketId: string,
  comment: string,
  currentUser: User,
  onSuccess: (tickets: any[]) => void
) => {
  if (!comment.trim()) {
    toast.error('Komentar tidak boleh kosong');
    return false;
  }

  const tickets = getTickets();
  const users = getUsersSync();

  const updatedTickets = tickets.map(t => {
    if (t.id === ticketId) {
      return {
        ...t,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...t.timeline,
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: 'COMMENT',
            actor: currentUser.name,
            details: comment.trim(),
          },
        ],
      };
    }
    return t;
  });

  saveTickets(updatedTickets);
  const ticket = updatedTickets.find(t => t.id === ticketId);

  if (ticket) {
    const notificationMessage = `${currentUser.name} menambahkan komentar pada tiket ${ticket.ticketNumber}`;

    if (currentUser.id !== ticket.userId) {
      addNotification({
        userId: ticket.userId,
        title: 'Komentar Baru',
        message: notificationMessage,
        type: 'info',
        read: false,
      });
    }

    if (ticket.assignedTo && ticket.assignedTo !== currentUser.id) {
      addNotification({
        userId: ticket.assignedTo,
        title: 'Komentar Baru',
        message: notificationMessage,
        type: 'info',
        read: false,
      });
    }

    if (currentUser.role !== 'admin_layanan') {
      const adminLayanan = users.filter(u => u.role === 'admin_layanan');
      adminLayanan.forEach(admin => {
        addNotification({
          userId: admin.id,
          title: 'Komentar Baru',
          message: notificationMessage,
          type: 'info',
          read: false,
        });
      });
    }
  }

  toast.success('Komentar berhasil dikirim');
  onSuccess(updatedTickets);
  return true;
};

export const calculateActiveTechnicianTickets = (tickets: any[], technicians: User[]): Record<string, number> => {
  const activeStatuses: TicketStatus[] = [
    'assigned',
    'in_progress',
    'on_hold',
    'ditugaskan',
    'diterima_teknisi',
    'sedang_diagnosa',
    'dalam_perbaikan',
    'menunggu_sparepart'
  ];

  return technicians.reduce((acc, tech) => {
    const activeCount = tickets.filter(
      t => t.type === 'perbaikan' &&
           t.assignedTo === tech.id &&
           activeStatuses.includes(t.status)
    ).length;
    acc[tech.id] = activeCount;
    return acc;
  }, {} as Record<string, number>);
};
