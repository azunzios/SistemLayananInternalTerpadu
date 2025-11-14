import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { Ticket, TicketType, TicketStatus } from '../types';

interface TicketProgressTrackerProps {
  ticket: Ticket;
}

export const TicketProgressTracker: React.FC<TicketProgressTrackerProps> = ({ ticket }) => {
  const getWorkflowSteps = (type: TicketType): { label: string; statuses: TicketStatus[] }[] => {
    switch (type) {
      case 'perbaikan':
        return [
          { label: 'Tiket Dibuat', statuses: ['submitted', 'menunggu_review'] },
          { label: 'Assignment Teknisi', statuses: ['assigned', 'ditugaskan', 'disetujui'] },
          { label: 'Dalam Penanganan', statuses: ['in_progress', 'diterima_teknisi', 'sedang_diagnosa'] },
          { label: 'Perbaikan', statuses: ['dalam_perbaikan', 'menunggu_sparepart'] },
          { label: 'Menunggu Konfirmasi', statuses: ['resolved', 'selesai_diperbaiki'] },
          { label: 'Selesai', statuses: ['closed', 'selesai'] },
        ];
      
      case 'zoom_meeting':
        return [
          { label: 'Pengajuan Tiket', statuses: ['submitted', 'menunggu_review', 'pending_approval'] },
          { label: 'Disetujui & Link Ready', statuses: ['approved'] },
          { label: 'Meeting Selesai', statuses: ['closed', 'selesai'] },
        ];
      
      default:
        return [];
    }
  };

  const steps = getWorkflowSteps(ticket.type);
  
  const getCurrentStepIndex = () => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].statuses.includes(ticket.status)) {
        return i;
      }
    }
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();
  const isRejected = ['ditolak', 'rejected', 'dibatalkan', 'tidak_dapat_diperbaiki', 'closed_unrepairable'].includes(ticket.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progress Tiket</CardTitle>
          <Badge variant={isRejected ? 'destructive' : ['closed', 'selesai'].includes(ticket.status) ? 'default' : 'secondary'}>
            {isRejected ? 'Ditolak/Dibatalkan' : ['closed', 'selesai'].includes(ticket.status) ? 'Selesai' : 'Dalam Proses'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex || (index === currentStepIndex && ['closed', 'selesai'].includes(ticket.status));
            const isCurrent = index === currentStepIndex && !isRejected;
            const isUpcoming = index > currentStepIndex;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                {/* Step Icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${isCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-gray-100'}
                      ${isRejected && isCurrent ? 'bg-red-100' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : isCurrent ? (
                      isRejected ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                      )
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        w-0.5 h-12 my-1
                        ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4
                        className={`
                          font-medium
                          ${isCompleted ? 'text-green-900' : isCurrent ? 'text-blue-900' : 'text-gray-500'}
                          ${isRejected && isCurrent ? 'text-red-900' : ''}
                        `}
                      >
                        {step.label}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {isCompleted && '✓ Selesai'}
                        {isCurrent && !isRejected && '⏳ Sedang diproses'}
                        {isCurrent && isRejected && '✗ Ditolak'}
                        {isUpcoming && '⏺ Menunggu'}
                      </p>
                    </div>
                  </div>

                  {/* Show timeline events for this step */}
                  {isCurrent && ticket.timeline && (
                    <div className="mt-3 space-y-2">
                      {ticket.timeline
                        .slice(-2) // Show last 2 events
                        .reverse()
                        .map((event, idx) => (
                          <div key={event.id} className="text-xs p-2 bg-gray-50 rounded">
                            <p className="font-medium text-gray-700">{event.actor}</p>
                            <p className="text-gray-600">{event.details}</p>
                            <p className="text-gray-400 mt-1">
                              {new Date(event.timestamp).toLocaleString('id-ID')}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress Keseluruhan</span>
            <span className="text-sm text-gray-500">
              {isRejected ? '0' : Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${isRejected ? 0 : ((currentStepIndex + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${isRejected ? 'bg-red-500' : 'bg-blue-500'}`}
            />
          </div>
        </div>

        {/* Estimated Completion */}
        {!isRejected && !['closed', 'selesai'].includes(ticket.status) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Info:</strong> Anda akan menerima notifikasi setiap kali ada update pada tiket ini.
              {ticket.urgency === 'sangat_mendesak' && ' Tiket Anda sedang diprioritaskan.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
