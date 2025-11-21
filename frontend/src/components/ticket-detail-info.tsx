import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  ArrowLeft,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Send,
  FolderKanban,
  Package,
  Truck,
} from 'lucide-react';
import type { User, Ticket } from '../types';

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
        <Button variant="link" size="sm" onClick={onBack} >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl">{ticket.title}</h1>
          <p className="text-gray-500 mt-1">#{ticket.ticketNumber}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canComplete && (
          <Button onClick={onShowCompleteDialog}>
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
  return (
    <Card className="gap-0">
      <CardHeader className="!pb-0 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Tiket #{ticket.ticketNumber}</p>
            <CardTitle className="text-xl">{ticket.title}</CardTitle>
          </div>
          <Badge variant={
            ['closed', 'selesai', 'approved', 'resolved'].includes(ticket.status) ? 'default' :
            ['closed_unrepairable', 'ditolak', 'rejected', 'dibatalkan'].includes(ticket.status) ? 'destructive' :
            'secondary'
          }>
            {ticket.status.replace(/_/g, ' ').toUpperCase()}
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
                  <span>{new Date(ticket.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm mb-2">Deskripsi</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {ticket.type === 'perbaikan' && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm mb-3">Informasi Tambahan</h4>
                  <div className="space-y-2 text-sm">
                    {ticket.assetCode && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Asset Code:</span>
                        <span>{ticket.assetCode}</span>
                      </div>
                    )}
                    {ticket.assetNUP && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Asset N U P:</span>
                        <span>{ticket.assetNUP}</span>
                      </div>
                    )}
                    {ticket.assetLocation && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Asset Location:</span>
                        <span>{ticket.assetLocation}</span>
                      </div>
                    )}
                    {ticket.data?.itemName && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Item Name:</span>
                        <span>{ticket.data.itemName}</span>
                      </div>
                    )}
                    {ticket.attachments && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-32">Attachment Count:</span>
                        <span>{ticket.attachments.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {ticket.attachments && ticket.attachments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm mb-2">File Terlampir</h4>
                  <div className="space-y-1">
                    {ticket.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer">
                        <Paperclip className="h-3 w-3" />
                        <span>{att.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Work Orders & Discussion */}
          <div className="space-y-4 col-span-2">
            {/* Work Orders Section */}
            {ticket.type === 'perbaikan' && (() => {
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
                      <div key={wo.id} className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {wo.type === 'sparepart' ? (
                              <Package className="h-4 w-4 text-purple-600" />
                            ) : (
                              <Truck className="h-4 w-4 text-orange-600" />
                            )}
                            <span className="text-sm font-medium">
                              {wo.type === 'sparepart' ? 'Sparepart' : 'Vendor'}
                            </span>
                          </div>
                          <Badge className={
                            wo.status === 'completed' || wo.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : wo.status === 'in_procurement'
                              ? 'bg-blue-100 text-blue-800'
                              : wo.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }>
                            {wo.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        {wo.type === 'sparepart' && wo.spareparts && (
                          <div className="text-xs text-gray-600 mt-1">
                            {wo.spareparts.map((sp: any, idx: number) => (
                              <div key={idx}>• {sp.name} ({sp.quantity} {sp.unit})</div>
                            ))}
                          </div>
                        )}
                        {wo.type === 'vendor' && wo.vendorInfo?.description && (
                          <div className="text-xs text-gray-600 mt-1">
                            {wo.vendorInfo.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(wo.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div>
              <h4 className="text-sm mb-3">Diskusi</h4>
              <ScrollArea className="h-[500px] border rounded-lg p-4 bg-gray-50">
                <div className="space-y-3">
                  {comments && comments.length > 0 ? (
                    <>
                      {commentsLoading && (
                        <p className="text-sm text-gray-500 text-center py-2">Loading...</p>
                      )}
                      {comments.map((comment) => (
                        <div key={comment.id} className="space-y-2">
                          <div className="p-3 bg-white rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-sm">{typeof comment.user === 'string' ? comment.user : comment.user?.name || 'Anonymous'}</p>
                                <p className="text-xs text-gray-500">{comment.user_role || 'User'}</p>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(comment.created_at).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                          </div>

                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-6 space-y-2">
                              {comment.replies.map((reply: any) => (
                                <div key={reply.id} className="p-3 bg-blue-50 rounded border border-blue-100">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-semibold text-sm">{typeof reply.user === 'string' ? reply.user : reply.user?.name || 'Anonymous'}</p>
                                      <p className="text-xs text-gray-500">{reply.user_role || 'User'}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {new Date(reply.created_at).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {hasMore && !commentsLoading && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onLoadMoreComments}
                          className="w-full mt-4"
                        >
                          Load More Percakapan Terdahulu
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Belum ada percakapan</p>
                      <p className="text-xs mt-1">Mulai diskusi dengan mengirim komentar pertama</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Add Comment Form */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-xs">Tambah Komentar</Label>
              <Textarea
                id="comment"
                placeholder="Tulis komentar atau update..."
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <Button onClick={onAddComment} disabled={!comment.trim()} size="sm" className="w-full">
                <Send className="h-3 w-3 mr-2" />
                Kirim Komentar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
