import React, { useMemo, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  AlertCircle,
  Package,
  ToolCase,
  Loader,
} from "lucide-react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import type { User } from "@/types";
import type { ViewType } from "@/components/main-layout";

interface TeknisiDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

export const TeknisiDashboard: React.FC<TeknisiDashboardProps> = ({
  currentUser,
  onNavigate: _onNavigate,
}) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await api.get<any>(
          "tickets?per_page=1000&type=perbaikan"
        );
        const ticketsData = response?.data || [];
        setTickets(ticketsData);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Filter tickets assigned to this technician
  const myTickets = useMemo(() => {
    return tickets.filter((t) => {
      const assignedUserId = t.assignedTo || t.assigned_to;
      // Use loose equality to handle string vs number mismatch
      return t.type === "perbaikan" && assignedUserId == currentUser.id; // eslint-disable-line eqeqeq
    });
  }, [tickets, currentUser.id]);

  // Teknisi Stats - Updated to match new status values
  const stats = useMemo(() => {
    const needsDiagnosis = myTickets.filter((t) =>
      ["assigned", "submitted", "pending_review"].includes(t.status)
    );
    const inProgress = myTickets.filter((t) => t.status === "in_progress");
    const waitingSparepart = myTickets.filter((t) => t.status === "on_hold");
    const completed = myTickets.filter((t) =>
      ["waiting_for_submitter", "closed"].includes(t.status)
    );

    const today = new Date();
    const completedToday = completed.filter((t) => {
      const updatedDate = new Date(t.updatedAt || t.updated_at);
      return updatedDate.toDateString() === today.toDateString();
    });

    return {
      total: myTickets.length,
      needsDiagnosis: needsDiagnosis.length,
      inProgress: inProgress.length,
      waitingSparepart: waitingSparepart.length,
      completed: completed.length,
      completedToday: completedToday.length,
      activeJobs: needsDiagnosis.length + inProgress.length + waitingSparepart.length,
    };
  }, [myTickets]);

  // Incoming tickets trend (per hari)
  const incomingTrend = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      const dayTickets = myTickets.filter((t) => {
        const ticketDate = new Date(t.createdAt || t.created_at);
        return ticketDate.toDateString() === date.toDateString();
      });

      last7Days.push({
        date: dateStr,
        assigned: dayTickets.length,
      });
    }
    return last7Days;
  }, [myTickets]);

  return (
    <>
      <div className="space-y-6">
        {/* Welcome Section - styled like user dashboard */}
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
              <h1 className="text-3xl mb-2">
                Teknisi Dashboard
              </h1>
              <p className="text-blue-100">
                Kelola tugas perbaikan dan tracking progress
              </p>
            </div>
            <div className="hidden md:block">
              <ToolCase className="h-20 w-20 text-blue-100 opacity-50"/>
            </div>
          </div>

          <Separator className="my-6 bg-blue-300" />

          {/* Statistics Grid - matching user dashboard style */}
          {/* grid statistik, flex-col di hp, flex-row di sm ke atas */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between">
            {loading ? (
              <div className="w-full flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-blue-100" />
              </div>
            ) : (
              <>
                {/* border bawah di hp, border kanan di sm ke atas */}
                <div className="max-md:border-b max-md:border-b-1 max-md:border-blue-300 flex-1 px-4 py-4 text-center sm:border-b sm:border-b-0 sm:border-r border-blue-300">
                  <p className="text-blue-100 text-sm">Total Tiket</p>
                  <p className="text-3xl mt-1 font-bold">{stats.total}</p>
                </div>
                <div className="max-md:border-b max-md:border-b-1 max-md:border-blue-300 flex-1 px-4 py-4 text-center sm:-b sm:border-b-0 sm:border-r border-blue-300">
                  <p className="text-blue-100 text-sm">Perlu Didiagnosa</p>
                  <p className="text-3xl mt-1 font-bold">{stats.needsDiagnosis}</p>
                </div>
                <div className="max-md:border-b max-md:border-b-1 max-md:border-blue-300 flex-1 px-4 py-4 text-center sm:border-b sm:border-b-0 sm:border-r border-blue-300">
                  <p className="text-blue-100 text-sm">In Progress</p>
                  <p className="text-3xl mt-1 font-bold">{stats.inProgress}</p>
                </div>
                <div className="max-md:border-b max-md:border-b-1 max-md:border-blue-300 flex-1 px-4 py-4 text-center sm:border-b sm:border-b-0 sm:border-r border-blue-300">
                  <p className="text-blue-100 text-sm">On Hold</p>
                  <p className="text-3xl mt-1 font-bold">{stats.waitingSparepart}</p>
                </div>
                <div className="flex-1 px-4 py-4 text-center">
                  <p className="text-blue-100 text-sm">Selesai</p>
                  <p className="text-3xl mt-1 font-bold">{stats.completed}</p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Chart - Single incoming tickets chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tiket Masuk (7 Hari Terakhir)</CardTitle>
            <CardDescription>Jumlah tiket baru per hari</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomingTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  domain={[0, Math.ceil(Math.max(...incomingTrend.map(d => d.assigned)) / 1) || 1]} 
                  ticks={Array.from({length: Math.ceil(Math.max(...incomingTrend.map(d => d.assigned)) / 1) || 2}, (_, i) => i)}
                  type="number"
                />
                <Tooltip formatter={(value) => [`${value} tiket`, 'Assigned']} />
                <Bar dataKey="assigned" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="pb-6">
          <CardHeader>
            <CardTitle>Informasi Penting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.needsDiagnosis > 0 && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">
                      {stats.needsDiagnosis} Tiket Perlu Didiagnosa
                    </p>
                    <p className="text-xs text-orange-700">Segera lakukan diagnosis</p>
                  </div>
                </div>
              )}
              
              {stats.waitingSparepart > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Package className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900">
                      {stats.waitingSparepart} Tiket Menunggu Sparepart
                    </p>
                    <p className="text-xs text-yellow-700">Work order sedang diproses</p>
                  </div>
                </div>
              )}

              {stats.needsDiagnosis === 0 && stats.waitingSparepart === 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      Semua Tiket Sesuai
                    </p>
                    <p className="text-xs text-green-700">Tidak ada tiket tertunda</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
