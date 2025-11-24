import React, { useMemo, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Wrench,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  ArrowRight,
  Settings,
  Activity,
} from "lucide-react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "../lib/api";
import type { User } from "../types";
import type { ViewType } from "./main-layout";

interface TeknisiDashboardProps {
  currentUser: User;
  onNavigate: (view: ViewType) => void;
}

export const TeknisiDashboard: React.FC<TeknisiDashboardProps> = ({
  currentUser,
  onNavigate,
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

  // Teknisi Stats
  const stats = useMemo(() => {
    const newAssignments = myTickets.filter((t) =>
      ["assigned", "ditugaskan"].includes(t.status)
    );
    const inDiagnosis = myTickets.filter((t) =>
      ["diterima_teknisi", "sedang_diagnosa"].includes(t.status)
    );
    const inRepair = myTickets.filter((t) => t.status === "dalam_perbaikan");
    const waitingSparepart = myTickets.filter((t) =>
      ["on_hold", "menunggu_sparepart"].includes(t.status)
    );
    const completed = myTickets.filter((t) =>
      ["resolved", "selesai_diperbaiki", "selesai", "closed"].includes(t.status)
    );
    const cannotRepair = myTickets.filter((t) =>
      ["closed_unrepairable", "tidak_dapat_diperbaiki"].includes(t.status)
    );

    const today = new Date();
    const completedToday = completed.filter((t) => {
      const updatedDate = new Date(t.updatedAt || t.updated_at);
      return updatedDate.toDateString() === today.toDateString();
    });

    return {
      newAssignments: newAssignments.length,
      inDiagnosis: inDiagnosis.length,
      inRepair: inRepair.length,
      waitingSparepart: waitingSparepart.length,
      completed: completed.length,
      cannotRepair: cannotRepair.length,
      completedToday: completedToday.length,
      activeJobs: newAssignments.length + inDiagnosis.length + inRepair.length,
    };
  }, [myTickets]);

  // Recent assignments
  const recentAssignments = useMemo(() => {
    return myTickets
      .filter((t) =>
        [
          "assigned",
          "ditugaskan",
          "diterima_teknisi",
          "accepted",
          "sedang_diagnosa",
          "in_diagnosis",
          "dalam_perbaikan",
          "in_repair",
          "menunggu_sparepart",
          "on_hold",
        ].includes(t.status)
      )
      .sort((a, b) => {
        // Priority: ditugaskan/assigned > sedang_diagnosa > dalam_perbaikan > menunggu_sparepart
        const statusOrder: Record<string, number> = {
          ditugaskan: 0,
          assigned: 0,
          diterima_teknisi: 1,
          accepted: 1,
          sedang_diagnosa: 2,
          in_diagnosis: 2,
          dalam_perbaikan: 3,
          in_repair: 3,
          menunggu_sparepart: 4,
          on_hold: 4,
        };
        const statusDiff =
          (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
        if (statusDiff !== 0) return statusDiff;

        // Then by urgency
        const urgencyOrder = { sangat_mendesak: 0, mendesak: 1, normal: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      })
      .slice(0, 8);
  }, [myTickets]);

  // Completion trend
  const completionTrend = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      const dayTickets = myTickets.filter((t) => {
        const ticketDate = new Date(t.updatedAt || t.updated_at);
        return (
          ticketDate.toDateString() === date.toDateString() &&
          ["resolved", "selesai_diperbaiki", "selesai", "closed"].includes(
            t.status
          )
        );
      });

      last7Days.push({
        date: dateStr,
        completed: dayTickets.length,
      });
    }
    return last7Days;
  }, [myTickets]);

  // Work status breakdown
  const workStatus = useMemo(() => {
    return [
      { name: "Diagnosis", value: stats.inDiagnosis },
      { name: "Repair", value: stats.inRepair },
      { name: "Waiting WO", value: stats.waitingSparepart },
      { name: "Completed", value: stats.completed },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      assigned: { variant: "secondary", label: "Baru" },
      ditugaskan: { variant: "secondary", label: "Baru" },
      accepted: { variant: "default", label: "Diterima" },
      diterima_teknisi: { variant: "default", label: "Diterima" },
      in_diagnosis: { variant: "default", label: "Diagnosa" },
      sedang_diagnosa: { variant: "default", label: "Diagnosa" },
      in_repair: { variant: "default", label: "Perbaikan" },
      dalam_perbaikan: { variant: "default", label: "Perbaikan" },
      on_hold: { variant: "secondary", label: "Waiting Parts" },
      menunggu_sparepart: { variant: "secondary", label: "Waiting Parts" },
      resolved: { variant: "default", label: "Selesai" },
      selesai_diperbaiki: { variant: "default", label: "Selesai" },
      closed: { variant: "default", label: "Selesai" },
    };
    const statusConfig = config[status] || {
      variant: "secondary",
      label: status,
    };
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const config = {
      sangat_mendesak: { variant: "destructive" as const, label: "Urgent" },
      mendesak: { variant: "default" as const, label: "High" },
      normal: { variant: "outline" as const, label: "Normal" },
    };
    const urgencyConfig =
      config[urgency as keyof typeof config] || config.normal;
    return (
      <Badge variant={urgencyConfig.variant} className="text-xs">
        {urgencyConfig.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl flex items-center gap-3">
            <Wrench className="h-8 w-8 text-orange-600" />
            Teknisi Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola tugas perbaikan dan tracking progress
          </p>
        </div>
      </div>

      {/* New Assignments Alert */}
      {stats.newAssignments > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900">
                    {stats.newAssignments} Tugas Baru Ditugaskan!
                  </h3>
                  <p className="text-sm text-orange-700">
                    Segera terima dan mulai diagnosa
                  </p>
                </div>
                <Button onClick={() => onNavigate("my-tickets")}>
                  Lihat Tugas
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">New Assignments</p>
                  <p className="text-4xl text-orange-600">
                    {stats.newAssignments}
                  </p>
                  <p className="text-xs text-orange-700 mt-1">Perlu diterima</p>
                </div>
                <div className="h-14 w-14 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-7 w-7 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">In Progress</p>
                  <p className="text-4xl text-blue-600">
                    {stats.inDiagnosis + stats.inRepair}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.inDiagnosis} diagnosa, {stats.inRepair} perbaikan
                  </p>
                </div>
                <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Completed</p>
                  <p className="text-4xl text-green-600">{stats.completed}</p>
                  <p className="text-xs text-green-700 mt-1">
                    +{stats.completedToday} hari ini
                  </p>
                </div>
                <div className="h-14 w-14 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Penyelesaian (7 Hari)</CardTitle>
            <CardDescription>Jumlah perbaikan selesai per hari</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={completionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Work Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Pekerjaan</CardTitle>
            <CardDescription>Breakdown tugas saat ini</CardDescription>
          </CardHeader>
          <CardContent>
            {workStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={workStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Tidak ada pekerjaan aktif</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Waiting Sparepart */}
        {stats.waitingSparepart > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">
                    {stats.waitingSparepart} Job Menunggu
                    Sparepart/Vendor/Lisensi
                  </h3>
                  <p className="text-sm text-blue-700">
                    Work order sedang diproses
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onNavigate("sparepart-requests")}
                >
                  Lihat Status
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cannot Repair */}
        {stats.cannotRepair > 0 && (
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {stats.cannotRepair} Item Tidak Dapat Diperbaiki
                  </h3>
                  <p className="text-sm text-gray-700">
                    Sudah didokumentasikan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
