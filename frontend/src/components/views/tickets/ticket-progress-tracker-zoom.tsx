import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Circle } from 'lucide-react';
import { motion } from 'motion/react';
import type { Ticket, ZoomStatus } from '@/types';

interface TicketProgressTrackerZoomProps {
  ticket: Ticket;
}

const ZOOM_STEPS: { label: string; statuses: ZoomStatus[] }[] = [
  { label: 'Pengajuan Tiket', statuses: ['pending_review'] },
  { label: 'Disetujui & Jadwal Siap', statuses: ['approved'] },
];

export const TicketProgressTrackerZoom: React.FC<TicketProgressTrackerZoomProps> = ({ ticket }) => {
  const status = ticket.status as ZoomStatus;
  const currentStepIndex = (() => {
    for (let i = ZOOM_STEPS.length - 1; i >= 0; i--) {
      if (ZOOM_STEPS[i].statuses.includes(status)) {
        return i;
      }
    }
    return 0;
  })();

  const isRejected = ['rejected', 'cancelled'].includes(status);
  const isCompleted = status === 'approved';

  return (
    <Card className="pb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progress Tiket Zoom</CardTitle>
          <Badge variant={isRejected ? 'destructive' : isCompleted ? 'default' : 'secondary'}>
            {isRejected ? 'Ditolak/Dibatalkan' : isCompleted ? 'Selesai' : 'Dalam Proses'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ZOOM_STEPS.map((step, index) => {
            const isStepCompleted = index < currentStepIndex || (index === currentStepIndex && isCompleted);
            const isCurrent = index === currentStepIndex && !isRejected;
            const isUpcoming = index > currentStepIndex;

            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 }}
                className="flex items-start gap-4"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${isStepCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-gray-100'}
                      ${isRejected && isCurrent ? 'bg-red-100' : ''}
                    `}
                  >
                    {isStepCompleted ? (
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
                  {index < ZOOM_STEPS.length - 1 && (
                    <div
                      className={`
                        w-0.5 h-12 my-1
                        ${isStepCompleted ? 'bg-green-300' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </div>

                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4
                        className={`
                          font-medium
                          ${isStepCompleted ? 'text-green-900' : isCurrent ? 'text-blue-900' : 'text-gray-500'}
                          ${isRejected && isCurrent ? 'text-red-900' : ''}
                        `}
                      >
                        {step.label}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {isStepCompleted && 'Selesai'}
                        {isCurrent && !isRejected && !isCompleted && 'Sedang diproses'}
                        {isCurrent && isRejected && 'Ditolak/Dibatalkan'}
                        {isUpcoming && 'Menunggu'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
