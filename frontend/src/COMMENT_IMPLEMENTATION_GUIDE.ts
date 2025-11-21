/**
 * IMPLEMENTASI COMMENT/DISKUSI DI FRONTEND
 * 
 * ==================== SETUP ====================
 * 
 * 1. Di component yang menampilkan ticket detail (contoh: ticket-detail-info.tsx):
 *    ```tsx
 *    import { useTicketComments } from '../hooks/useTicketComments';
 *    
 *    export const TicketDetailInfo: React.FC<TicketDetailInfoProps> = ({ ticket, ... }) => {
 *      const { 
 *        comments, 
 *        loading, 
 *        error, 
 *        hasMore, 
 *        fetchComments, 
 *        loadMoreComments, 
 *        addComment 
 *      } = useTicketComments();
 *      
 *      // Fetch comments saat component mount
 *      useEffect(() => {
 *        fetchComments(ticket.id);
 *      }, [ticket.id, fetchComments]);
 *      
 *      // Rest of component...
 *    };
 *    ```
 * 
 * ==================== DISPLAY COMMENTS ====================
 * 
 * Comments sudah di-reverse oleh hook (oldest first), jadi tinggal display:
 * ```tsx
 * <ScrollArea className="h-[500px] border rounded-lg p-4 bg-gray-50">
 *   <div className="space-y-3">
 *     {comments.length > 0 ? (
 *       comments.map((comment, index) => (
 *         <div key={comment.id} className="p-3 bg-white rounded border">
 *           <div className="flex justify-between items-start">
 *             <div>
 *               <p className="font-semibold text-sm">{comment.user.name}</p>
 *               <p className="text-xs text-gray-500">{comment.user_role}</p>
 *             </div>
 *             <span className="text-xs text-gray-400">
 *               {new Date(comment.created_at).toLocaleString('id-ID')}
 *             </span>
 *           </div>
 *           <p className="text-sm mt-2 text-gray-700 whitespace-pre-wrap">
 *             {comment.content}
 *           </p>
 *         </div>
 *       ))
 *     ) : (
 *       <p className="text-sm text-gray-500 text-center py-8">
 *         Belum ada percakapan
 *       </p>
 *     )}
 *   </div>
 * </ScrollArea>
 * ```
 * 
 * ==================== LOAD MORE BUTTON ====================
 * 
 * Tambahkan button load more sebelum end of ScrollArea:
 * ```tsx
 * {hasMore && !loading && (
 *   <Button
 *     variant="outline"
 *     size="sm"
 *     onClick={() => loadMoreComments(ticket.id)}
 *     className="w-full mt-4"
 *   >
 *     Load More Percakapan Terdahulu
 *   </Button>
 * )}
 * {loading && <p className="text-sm text-gray-500 text-center py-2">Loading...</p>}
 * ```
 * 
 * ==================== ADD COMMENT ====================
 * 
 * Form untuk menambah comment:
 * ```tsx
 * const [commentText, setCommentText] = useState('');
 * const [submitting, setSubmitting] = useState(false);
 * 
 * const handleAddComment = async () => {
 *   if (!commentText.trim()) return;
 *   
 *   setSubmitting(true);
 *   try {
 *     await addComment(ticket.id, commentText);
 *     setCommentText('');
 *   } catch (error) {
 *     console.error('Failed to add comment:', error);
 *     // Show toast error
 *   } finally {
 *     setSubmitting(false);
 *   }
 * };
 * 
 * <Textarea
 *   placeholder="Tulis percakapan atau update..."
 *   value={commentText}
 *   onChange={(e) => setCommentText(e.target.value)}
 *   disabled={submitting}
 *   rows={2}
 * />
 * <Button
 *   onClick={handleAddComment}
 *   disabled={!commentText.trim() || submitting}
 *   className="w-full"
 * >
 *   {submitting ? 'Mengirim...' : 'Kirim Percakapan'}
 * </Button>
 * ```
 * 
 * ==================== AUTHORIZATION ====================
 * 
 * Authorization dilakukan di backend. User bisa:
 * - Lihat comments: pegawai (tiket milik), teknisi (assigned), admin, super_admin
 * - Create comments: sama seperti lihat
 * 
 * Backend akan return 403 jika user tidak authorized.
 * 
 * ==================== TIPS ====================
 * 
 * 1. Comments dari API berurutan DESC (newest first)
 *    Hook sudah auto-reverse untuk display (oldest first)
 * 
 * 2. Per-page default: 30 comments
 *    Bisa customize via parameter: fetchComments(ticketId, 1, 50)
 * 
 * 3. Load more menambah comments ke end of list (append)
 *    Tidak perlu reset, tinggal scroll kebawah
 * 
 * 4. New comment ditambah di awal list (newest)
 *    User akan langsung lihat comment mereka tanpa refresh
 * 
 * 5. Untuk real-time updates, pertimbangkan polling:
 *    setInterval(() => fetchComments(ticket.id), 5000)
 */
