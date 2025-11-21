/**
 * FRONTEND INTEGRATION CHECKLIST
 * 
 * Checklist untuk mengintegrasikan comment system ke UI yang sudah ada
 * 
 * ==================== QUICK START ====================
 * 
 * ✓ DONE: Backend endpoints ready
 *   - GET /api/tickets/{id}/comments (pagination)
 *   - POST /api/tickets/{id}/comments (create)
 * 
 * ✓ DONE: Storage functions ready
 *   - getTicketComments() di src/lib/storage.ts
 *   - createTicketComment() di src/lib/storage.ts
 * 
 * ✓ DONE: Hook ready
 *   - useTicketComments() di src/hooks/useTicketComments.ts
 * 
 * TODO: Integrate ke TicketDetailInfo component
 * TODO: Update timeline display jika masih digunakan
 * 
 * ==================== STEP BY STEP ====================
 * 
 * 1. IMPORT HOOK
 *    □ Buka file: frontend/src/components/ticket-detail-info.tsx
 *    □ Import hook:
 *      import { useTicketComments } from '../hooks/useTicketComments';
 * 
 * 2. SETUP HOOK DI COMPONENT
 *    □ Di dalam component:
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
 * 3. FETCH COMMENTS SAAT MOUNT
 *    □ Tambah useEffect:
 *      useEffect(() => {
 *        fetchComments(ticket.id);
 *      }, [ticket.id, fetchComments]);
 * 
 * 4. REPLACE TIMELINE DISPLAY
 *    □ Di section "Diskusi", ganti timeline.filter(e => e.action === 'COMMENT')
 *    □ Dengan comments dari hook
 *    □ Display: username, user_role, content, created_at
 * 
 * 5. ADD LOAD MORE BUTTON
 *    □ Sebelum end ScrollArea:
 *      {hasMore && !loading && (
 *        <Button onClick={() => loadMoreComments(ticket.id)} className="w-full">
 *          Load More Percakapan
 *        </Button>
 *      )}
 * 
 * 6. ADD COMMENT FORM
 *    □ Update onAddComment handler:
 *      const handleAddComment = async () => {
 *        if (!comment.trim()) return;
 *        try {
 *          await addComment(ticket.id, comment);
 *          setComment('');
 *        } catch (error) {
 *          console.error('Failed:', error);
 *        }
 *      };
 * 
 * 7. TESTING
 *    □ Buka ticket detail page
 *    □ Verifikasi comments loaded
 *    □ Test add comment
 *    □ Test load more
 *    □ Test authorization (coba akses tiket orang lain)
 * 
 * ==================== CODE SNIPPET ====================
 * 
 * // Import di top file
 * import { useTicketComments } from '../hooks/useTicketComments';
 * 
 * // Di component
 * export const TicketDetailInfo: React.FC<TicketDetailInfoProps> = ({ ticket, ... }) => {
 *   const [comment, setComment] = useState('');
 *   const {
 *     comments,
 *     loading,
 *     error,
 *     hasMore,
 *     fetchComments,
 *     loadMoreComments,
 *     addComment,
 *   } = useTicketComments();
 *
 *   useEffect(() => {
 *     fetchComments(ticket.id);
 *   }, [ticket.id, fetchComments]);
 *
 *   const handleAddComment = async () => {
 *     if (!comment.trim()) return;
 *     try {
 *       await addComment(ticket.id, comment);
 *       setComment('');
 *     } catch (error) {
 *       console.error('Failed to add comment:', error);
 *     }
 *   };
 *
 *   return (
 *     <Card>
 *       ...
 *       <div className="space-y-4">
 *         <h4 className="text-sm mb-3">Diskusi</h4>
 *         <ScrollArea className="h-[500px] border rounded-lg p-4 bg-gray-50">
 *           <div className="space-y-3">
 *             {comments.length > 0 ? (
 *               comments.map((comment) => (
 *                 <div key={comment.id} className="p-3 bg-white rounded border">
 *                   <div className="flex justify-between items-start">
 *                     <div>
 *                       <p className="font-semibold text-sm">{comment.user.name}</p>
 *                       <p className="text-xs text-gray-500">{comment.user_role}</p>
 *                     </div>
 *                     <span className="text-xs text-gray-400">
 *                       {new Date(comment.created_at).toLocaleString('id-ID')}
 *                     </span>
 *                   </div>
 *                   <p className="text-sm mt-2 whitespace-pre-wrap">
 *                     {comment.content}
 *                   </p>
 *                 </div>
 *               ))
 *             ) : (
 *               <p className="text-sm text-gray-500 text-center py-8">
 *                 Belum ada percakapan
 *               </p>
 *             )}
 *             {hasMore && !loading && (
 *               <Button
 *                 variant="outline"
 *                 size="sm"
 *                 onClick={() => loadMoreComments(ticket.id)}
 *                 className="w-full"
 *               >
 *                 Load More Percakapan Terdahulu
 *               </Button>
 *             )}
 *             {loading && (
 *               <p className="text-sm text-gray-500 text-center py-2">Loading...</p>
 *             )}
 *           </div>
 *         </ScrollArea>
 *
 *         <div className="space-y-2">
 *           <Label htmlFor="comment">Tambah Percakapan</Label>
 *           <Textarea
 *             id="comment"
 *             placeholder="Tulis percakapan atau update..."
 *             value={comment}
 *             onChange={(e) => setComment(e.target.value)}
 *             rows={2}
 *           />
 *           <Button
 *             onClick={handleAddComment}
 *             disabled={!comment.trim()}
 *             className="w-full"
 *           >
 *             Kirim Percakapan
 *           </Button>
 *         </div>
 *       </div>
 *       ...
 *     </Card>
 *   );
 * };
 * 
 * ==================== MIGRATION DARI TIMELINE ====================
 * 
 * Jika sebelumnya menggunakan timeline untuk comments:
 * 
 * OLD (timeline):
 * ticket.timeline.filter(e => e.action === 'COMMENT').map(event => ...)
 * 
 * NEW (comments):
 * comments.map(comment => ...)
 * 
 * Benefits NEW:
 * ✓ Dedicated table (comments, tidak tercampur dengan timeline)
 * ✓ Pagination (tidak perlu load semua timeline)
 * ✓ Load more (explicit button untuk older comments)
 * ✓ Better performance (indexed queries)
 * ✓ Cleaner data structure
 * 
 * ==================== NOTES ====================
 * 
 * 1. Comments dalam order ASC (oldest first) setelah reverse
 * 
 * 2. New comment muncul di atas form (newest)
 * 
 * 3. Load more append ke bawah (seamless)
 * 
 * 4. Error handling built-in di hook
 * 
 * 5. Loading state tersedia untuk UI feedback
 * 
 * 6. Authorization handled di backend (403 if not allowed)
 */
?>
