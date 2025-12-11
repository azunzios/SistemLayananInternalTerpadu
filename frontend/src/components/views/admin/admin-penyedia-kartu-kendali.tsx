import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Package, Users, Key, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { KartuKendaliForm } from "@/components/views/shared/kartu-kendali-form";
import { toast } from "sonner";

interface WorkOrder {
  id: number;
  ticketId: number;
  ticketNumber: string;
  type: "sparepart" | "vendor" | "license";
  status: string;
  createdAt: string;
  completedAt?: string;
  ticket?: {
    id: number;
    ticketNumber: string;
    title: string;
    data?: {
      asset_code?: string;
      asset_nup?: string;
      asset_name?: string;
      asset_merk?: string;
    };
  };
}

export const AdminPenyediaKartuKendali: React.FC = () => {
  const [completedWorkOrders, setCompletedWorkOrders] = useState<WorkOrder[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null
  );
  const [showKartuKendaliForm, setShowKartuKendaliForm] = useState(false);

  // Fetch completed work orders yang belum ada kartu kendali
  const fetchCompletedWorkOrders = async () => {
    try {
      setLoading(true);
      const response: any = await api.get(
        "work-orders?status=completed&per_page=100"
      );

      // Response structure is { success, message, data: [...], pagination }
      // api.get already returns the full response, so we access response.data directly
      const workOrders = Array.isArray(response.data) ? response.data : [];

      // Transform data to match interface
      const transformedData = workOrders.map((wo: any) => ({
        id: wo.id,
        ticketId: wo.ticket_id,
        ticketNumber: wo.ticket_number,
        type: wo.type,
        status: wo.status,
        createdAt: wo.created_at,
        completedAt: wo.completed_at || wo.updated_at,
        ticket: wo.ticket
          ? {
              id: wo.ticket.id,
              ticketNumber: wo.ticket.ticketNumber,
              title: wo.ticket.title,
              data: {
                asset_code: (wo.ticket as any).assetCode,
                asset_nup: (wo.ticket as any).assetNUP,
                asset_name: wo.ticket.title,
                asset_merk:
                  (wo.ticket as any).formData?.asset_merk ||
                  (wo.ticket as any).formData?.merk ||
                  "",
              },
            }
          : undefined,
      }));

      console.log("Transformed data:", transformedData);

      setCompletedWorkOrders(transformedData);
    } catch (error) {
      console.error("Error fetching completed work orders:", error);
      toast.error("Gagal memuat data work order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedWorkOrders();
  }, []);

  const handleCreateKartuKendali = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setShowKartuKendaliForm(true);
  };

  const handleSuccess = () => {
    fetchCompletedWorkOrders();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sparepart":
        return <Package className="h-4 w-4" />;
      case "vendor":
        return <Users className="h-4 w-4" />;
      case "license":
        return <Key className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sparepart":
        return "Sparepart";
      case "vendor":
        return "Vendor";
      case "license":
        return "Lisensi";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Memuat data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Work Order Selesai - Perlu Kartu Kendali</CardTitle>
        </CardHeader>
        <CardContent>
          {completedWorkOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Tidak ada work order yang perlu diisi kartu kendali</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedWorkOrders.map((wo) => (
                <Card key={wo.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {getTypeIcon(wo.type)}
                            {getTypeLabel(wo.type)}
                          </Badge>
                          <Badge className="bg-green-600">Completed</Badge>
                          <span className="text-sm text-gray-500">
                            WO #{wo.id}
                          </span>
                        </div>

                        <h4 className="font-semibold">
                          {wo.ticket?.title || `Tiket #${wo.ticketNumber}`}
                        </h4>

                        {wo.ticket?.data && (
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            {wo.ticket.data.asset_code && (
                              <p>
                                Kode Barang:{" "}
                                <span className="font-mono">
                                  {wo.ticket.data.asset_code}
                                </span>
                              </p>
                            )}
                            {wo.ticket.data.asset_name && (
                              <p>Nama: {wo.ticket.data.asset_name}</p>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          Selesai:{" "}
                          {new Date(
                            wo.completedAt || wo.createdAt
                          ).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleCreateKartuKendali(wo)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Isi Kartu Kendali
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kartu Kendali Form */}
      {selectedWorkOrder && (
        <KartuKendaliForm
          isOpen={showKartuKendaliForm}
          onClose={() => {
            setShowKartuKendaliForm(false);
            setSelectedWorkOrder(null);
          }}
          workOrderId={selectedWorkOrder.id}
          assetCode={selectedWorkOrder.ticket?.data?.asset_code || ""}
          assetNup={selectedWorkOrder.ticket?.data?.asset_nup || ""}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
