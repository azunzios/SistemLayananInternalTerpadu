import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import type { Ticket, TicketType, PerbaikanStatus, ZoomStatus } from "@/types";

interface TicketProgressTrackerProps {
  ticket: Ticket;
}

export const TicketProgressTracker: React.FC<TicketProgressTrackerProps> = ({
  ticket,
}) => {
  // Filter timeline events yang relevan dengan setiap step
  const getStepTimeline = (stepStatuses: (PerbaikanStatus | ZoomStatus)[]) => {
    if (!ticket.timeline || ticket.timeline.length === 0) return [];

    return ticket.timeline.filter((event) => {
      const details = event.details.toLowerCase();
      const action = event.action.toLowerCase();

      // Filter berdasarkan status atau action yang relevan dengan step
      return stepStatuses.some((status) => {
        if (status === "submitted") {
          // Hanya event pembuatan tiket, TIDAK termasuk work order atau diagnosis
          return (
            action.includes("ticket_created") &&
            !action.includes("work_order") &&
            !details.includes("diagnosis")
          );
        }

        if (status === "on_hold") {
          // Hanya event pembuatan work order, TIDAK termasuk diagnosis
          return (
            action.includes("work_order_created") &&
            !details.includes("diagnosis")
          );
        }

        const statusLower = status.toLowerCase();
        return (
          details.includes(statusLower) ||
          action.includes(statusLower) ||
          (status === "assigned" && action.includes("assigned")) ||
          (status === "in_progress" &&
            (action.includes("started") || details.includes("diagnosis"))) ||
          (status === "resolved" && action.includes("resolved")) ||
          (status === "closed" && action.includes("closed")) ||
          (status === "pending_review" && action.includes("created")) ||
          (status === "approved" && action.includes("approved")) ||
          (status === "completed" && action.includes("completed"))
        );
      });
    });
  };

  const getWorkflowSteps = (
    type: TicketType
  ): { label: string; statuses: (PerbaikanStatus | ZoomStatus)[] }[] => {
    switch (type) {
      case "perbaikan":
        return [
          { label: "Tiket Dibuat", statuses: ["submitted"] },
          { label: "Assignment Teknisi", statuses: ["assigned"] },
          {
            label: "Dalam Penanganan",
            statuses: ["in_progress", "in_repair" as any],
          },
          { label: "Menunggu Sparepart/Vendor/Lisensi", statuses: ["on_hold"] },
          {
            label: "Menunggu Konfirmasi",
            statuses: ["resolved", "waiting_for_user", "waiting_for_submitter"],
          },
          { label: "Selesai", statuses: ["closed"] },
        ];

      case "zoom_meeting":
        return [
          { label: "Pengajuan Tiket", statuses: ["pending_review"] },
          { label: "Disetujui & Link Ready", statuses: ["approved"] },
          { label: "Meeting Selesai", statuses: ["completed"] },
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
  const isRejected =
    ticket.type === "perbaikan"
      ? ticket.status === "closed_unrepairable"
      : ticket.type === "zoom_meeting"
      ? ["rejected", "cancelled"].includes(ticket.status)
      : false;

  const isCompleted =
    ticket.type === "perbaikan"
      ? ticket.status === "closed"
      : ticket.type === "zoom_meeting"
      ? ticket.status === "completed"
      : false;

  return (
    <Card className="pb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progress Tiket</CardTitle>
          <Badge
            variant={
              isRejected ? "destructive" : isCompleted ? "default" : "secondary"
            }
          >
            {isRejected
              ? "Ditolak/Dibatalkan"
              : isCompleted
              ? "Selesai"
              : "Dalam Proses"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isStepCompleted =
              index < currentStepIndex ||
              (index === currentStepIndex && isCompleted);
            const isCurrent = index === currentStepIndex && !isRejected;
            const isUpcoming = index > currentStepIndex;
            const stepTimeline = getStepTimeline(step.statuses);

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
                      ${
                        isStepCompleted
                          ? "bg-green-100"
                          : isCurrent
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }
                      ${isRejected && isCurrent ? "bg-red-100" : ""}
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
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        w-0.5 h-12 my-1
                        ${isStepCompleted ? "bg-green-300" : "bg-gray-200"}
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
                          ${
                            isStepCompleted
                              ? "text-green-900"
                              : isCurrent
                              ? "text-blue-900"
                              : "text-gray-500"
                          }
                          ${isRejected && isCurrent ? "text-red-900" : ""}
                        `}
                      >
                        {step.label}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {isStepCompleted && "✓ Selesai"}
                        {isCurrent && !isRejected && !isCompleted && "⏳ Sedang diproses"}
                        {isCurrent && isRejected && "✗ Ditolak"}
                        {isUpcoming && "⏺ Menunggu"}
                      </p>
                    </div>
                  </div>

                  {/* Timeline events untuk step ini */}
                  {stepTimeline.length > 0 &&
                    (isStepCompleted || isCurrent) && (
                      <div className="mt-3 space-y-2">
                        {stepTimeline
                          .slice(-2)
                          .reverse()
                          .map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs p-2 rounded ${
                                isStepCompleted
                                  ? "bg-green-50 border border-green-100"
                                  : "bg-blue-50 border border-blue-100"
                              }`}
                            >
                              <p className="font-medium text-gray-700">
                                {event.actor}
                              </p>
                              <p className="text-gray-600">{event.details}</p>
                              <p className="text-gray-400 mt-1">
                                {new Date(event.timestamp).toLocaleString(
                                  "id-ID"
                                )}
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
              {isRejected
                ? "0"
                : Math.round(((currentStepIndex + 1) / steps.length) * 100)}
              %
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${
                  isRejected ? 0 : ((currentStepIndex + 1) / steps.length) * 100
                }%`,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${
                isRejected ? "bg-red-500" : "bg-blue-500"
              }`}
            />
          </div>
        </div>

        {/* Estimated Completion */}
        {!isRejected && !isCompleted && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Info:</strong> Anda akan menerima notifikasi setiap
              kali ada update pada tiket ini.
              {ticket.type === "perbaikan" &&
                ticket.severity === "critical" &&
                " Tiket Anda sedang diprioritaskan."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
