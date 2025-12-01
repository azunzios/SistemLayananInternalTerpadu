import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Send,
  FolderKanban,
  Package,
  Truck,
  FileText,
} from "lucide-react";
import type { User, Ticket } from "@/types";
import { TicketDiagnosisDisplay } from "@/components/views/tickets/ticket-diagnosis-display";
import { api } from "@/lib/api";

interface TicketDetailHeaderProps {
  ticket: Ticket;
  currentUser: User;
  canComplete: boolean;
  onBack: () => void;
  onShowCompleteDialog: () => void;
}

export const TicketDetailHeader: React.FC<TicketDetailHeaderProps> = ({
  ticket,
  canComplete,
  onBack,
  onShowCompleteDialog,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl">{ticket.title}</h1>
          <p className="text-gray-500 mt-1">#{ticket.ticketNumber}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canComplete && (
          <Button
            onClick={onShowCompleteDialog}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Konfirmasi Selesai
          </Button>
        )}
      </div>
    </div>
  );
};

interface TicketDetailInfoProps {
  ticket: Ticket;
  ticketOwner: User | undefined;
  assignedUser: User | undefined;
  comment: string;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
  getWorkOrdersByTicket: (ticketId: string) => any[];
  comments: any[];
  commentsLoading: boolean;
  hasMore: boolean;
  onLoadMoreComments: () => void;
}

export const TicketDetailInfo: React.FC<TicketDetailInfoProps> = ({
  ticket,
  ticketOwner,
  assignedUser,
  comment,
  onCommentChange,
  onAddComment,
  getWorkOrdersByTicket,
  comments,
  commentsLoading,
  hasMore,
  onLoadMoreComments,
}) => {
  const [assetData, setAssetData] = useState<any>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<any>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);

  // Fetch asset data for perbaikan tickets
  useEffect(() => {
    const fetchAssetData = async () => {
      // Cast to any untuk akses field spesifik perbaikan
      const perbaikanTicket = ticket as any;
      if (
        ticket.type !== "perbaikan" ||
        !perbaikanTicket.assetCode ||
        !perbaikanTicket.assetNUP
      ) {
        return;
      }

      try {
        setLoadingAsset(true);
        const response = await api.get<{ asset: any }>(
          `assets/search/by-code-nup?asset_code=${perbaikanTicket.assetCode}&asset_nup=${perbaikanTicket.assetNUP}`
        );
        if ((response as any).asset) {
          setAssetData((response as any).asset);
        }
      } catch (error) {
        console.error("Error fetching asset data:", error);
      } finally {
        setLoadingAsset(false);
      }
    };

    fetchAssetData();
  }, [ticket]);

  // Fetch complete diagnosis data when modal opens
  const handleOpenDiagnosisModal = async () => {
    if (!ticket.id) return;

    try {
      setLoadingDiagnosis(true);
      const response = await api.get<{ success: boolean; data: any }>(`/tickets/${ticket.id}/diagnosis`);
      if ((response as any).success && (response as any).data) {
        setDiagnosisData((response as any).data);
      }
    } catch (error) {
      console.error("Error fetching diagnosis data:", error);
    } finally {
      setLoadingDiagnosis(false);
    }

    setShowDiagnosisModal(true);
  };

  const attachmentList = Array.isArray((ticket as any).attachments)
    ? (ticket as any).attachments
    : [];
  return (
    <Card className="gap-0">
      <CardHeader className="!pb-0 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Tiket #{ticket.ticketNumber}
            </p>
            <CardTitle className="text-xl">{ticket.title}</CardTitle>
          </div>
          <Badge
            variant={
              ["closed", "selesai", "approved", "resolved"].includes(
                ticket.status
              )
                ? "default"
                : ["rejected", "cancelled"].includes(ticket.status)
                ? "destructive"
                : "secondary"
            }
          >
            {ticket.status.replace(/_/g, " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 p-4">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Ticket Information */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm mb-3">Informasi Tiket</h4>
              <div className="space-y-3 text-sm">
                {ticket.type === "perbaikan" && (ticket as any).severity && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-32">Prioritas:</span>
                    <Badge
                      className={
                        (ticket as any).severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : (ticket as any).severity === "high"
                          ? "bg-orange-100 text-orange-800"
                          : (ticket as any).severity === "normal"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {(ticket as any).severity === "critical"
                        ? "Critical"
                        : (ticket as any).severity === "high"
                        ? "High"
                        : (ticket as any).severity === "normal"
                        ? "Normal"
                        : "Low"}
                    </Badge>
                  </div>
                )}

                <div className="flex gap-2">
                  <span className="text-gray-500 w-32">Title:</span>
                  <span>{ticket.title}</span>
                </div>

                {ticketOwner && (
                  <>
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-32">Pemohon:</span>
                      <span>{ticketOwner.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-32">Unit Kerja:</span>
                      <span>{ticketOwner.unitKerja}</span>
                    </div>
                  </>
                )}

                {assignedUser && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-32">Teknisi:</span>
                    <span>{assignedUser.name}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <span className="text-gray-500 w-32">Dibuat:</span>
                  <span>
                    {new Date(ticket.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm mb-2">Deskripsi</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Tampilkan alasan penolakan jika tiket ditolak */}
            {ticket.status === "rejected" && ticket.rejectionReason && (
              <>
                <Separator />
                <div className="border border-red-200 bg-red-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">
                    Alasan Penolakan
                  </h4>
                  <p className="text-sm text-red-700 whitespace-pre-wrap">
                    {ticket.rejectionReason}
                  </p>
                </div>
              </>
            )}

            {attachmentList.length > 0 && (
              <div>
                <h4 className="text-sm mb-2">File Terlampir</h4>
                <div className="space-y-1">
                  {attachmentList.map((att: any, idx: number) => (
                    <a
                      key={att.id || idx}
                      href={att.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate">
                        {att.name || `File ${idx + 1}`}
                      </span>
                      {att.size && (
                        <span className="text-xs text-gray-500">
                          ({Math.round(att.size / 1024)} KB)
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {ticket.type === "perbaikan" && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm mb-3">Informasi Barang</h4>
                  <div className="space-y-2 text-sm">
                    {(ticket as any).assetCode && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Kode Barang:</span>
                        <span className="font-mono">{(ticket as any).assetCode}</span>
                      </div>
                    )}
                    {(ticket as any).assetNUP && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">NUP:</span>
                        <span className="font-mono">{(ticket as any).assetNUP}</span>
                      </div>
                    )}
                    {loadingAsset ? (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Nama Barang:</span>
                        <span className="text-gray-400">Memuat...</span>
                      </div>
                    ) : (
                      assetData?.asset_name && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-32">
                            Nama Barang:
                          </span>
                          <span className="text-sm overflow-wrap w-32">
                            {assetData.asset_name}
                          </span>
                        </div>
                      )
                    )}
                    {assetData?.merk_tipe && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Merek/Tipe:</span>
                        <span>{assetData.merk_tipe}</span>
                      </div>
                    )}
                    {(ticket as any).assetLocation && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Lokasi:</span>
                        <span>{(ticket as any).assetLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Diagnosis Button */}
                {ticket.type === "perbaikan" && (ticket as any).diagnosis && (
                  <Button
                    variant="outline"
                    onClick={handleOpenDiagnosisModal}
                    disabled={loadingDiagnosis}
                    className="w-full justify-start"
                  >
                    <FileText className="h-5 w-5" />
                    Lihat Hasil Diagnosis
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Right Column - Work Orders & Discussion */}
          <div className="space-y-4 col-span-2">
            {/* Work Orders Section */}
            {ticket.type === "perbaikan" &&
              (() => {
                const workOrders = getWorkOrdersByTicket(ticket.id);
                if (workOrders.length === 0) return null;

                return (
                  <div>
                    <h4 className="text-sm mb-3 flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" />
                      Work Orders ({workOrders.length})
                    </h4>
                    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                      {workOrders.map((wo) => (
                        <div
                          key={wo.id}
                          className="bg-white rounded-lg p-3 border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {wo.type === "sparepart" ? (
                                <Package className="h-4 w-4 text-purple-600" />
                              ) : (
                                <Truck className="h-4 w-4 text-orange-600" />
                              )}
                              <span className="text-sm font-medium">
                                {wo.type === "sparepart"
                                  ? "Sparepart"
                                  : "Vendor"}
                              </span>
                            </div>
                            <Badge
                              className={
                                wo.status === "completed" ||
                                wo.status === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : wo.status === "in_procurement"
                                  ? "bg-blue-100 text-blue-800"
                                  : wo.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {wo.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          {wo.type === "sparepart" && wo.spareparts && (
                            <div className="text-xs text-gray-600 mt-1">
                              {wo.spareparts.map((sp: any, idx: number) => (
                                <div key={idx}>
                                  • {sp.name} ({sp.quantity} {sp.unit})
                                </div>
                              ))}
                            </div>
                          )}
                          {wo.type === "vendor" &&
                            wo.vendorInfo?.description && (
                              <div className="text-xs text-gray-600 mt-1">
                                {wo.vendorInfo.description}
                              </div>
                            )}
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(wo.createdAt).toLocaleDateString("id-ID")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            <div>
              <h4 className="text-sm mb-3">Diskusi</h4>
              <ScrollArea className="h-[500px] p-4 bg-gray-50">
                <div className="space-y-3">
                  {comments && comments.length > 0 ? (
                    <>
                      {hasMore && !commentsLoading && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onLoadMoreComments}
                          className="w-full mb-4"
                        >
                          Load More Percakapan Terdahulu
                        </Button>
                      )}
                      {commentsLoading && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          Loading...
                        </p>
                      )}
                      {comments.map((comment) => (
                        <div key={comment.id} className="space-y-2">
                          <div className="p-3 bg-white rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-sm">
                                  {typeof comment.user === "string"
                                    ? comment.user
                                    : comment.user?.name || "Anonymous"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {comment.user_role || "User"}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(comment.created_at).toLocaleString(
                                  "id-ID"
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>

                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-6 space-y-2">
                              {comment.replies.map((reply: any) => (
                                <div
                                  key={reply.id}
                                  className="p-3 bg-blue-50 rounded border border-blue-100"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-semibold text-sm">
                                        {typeof reply.user === "string"
                                          ? reply.user
                                          : reply.user?.name || "Anonymous"}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {reply.user_role || "User"}
                                      </p>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {new Date(
                                        reply.created_at
                                      ).toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {reply.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Belum ada percakapan</p>
                      <p className="text-xs mt-1">
                        Mulai diskusi dengan mengirim komentar pertama
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Add Comment Form */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-xs">
                Tambah Komentar
              </Label>
              <Textarea
                id="comment"
                placeholder="Tulis komentar atau update..."
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <Button
                onClick={onAddComment}
                disabled={!comment.trim()}
                size="sm"
                className="w-full"
              >
                <Send className="h-3 w-3 mr-2" />
                Kirim Komentar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Diagnosis Modal */}
      <Dialog open={showDiagnosisModal} onOpenChange={setShowDiagnosisModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hasil Diagnosis</DialogTitle>
          </DialogHeader>
          {loadingDiagnosis ? (
            <div className="flex justify-center items-center py-8">
              <Spinner />
            </div>
          ) : diagnosisData ? (
            <TicketDiagnosisDisplay diagnosis={diagnosisData} />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
