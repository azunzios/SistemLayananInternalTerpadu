import { useState, useCallback } from 'react';
import { getTicketComments, createTicketComment, type Comment } from '../lib/storage';

export interface UseTicketCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  currentPage: number;
  totalComments: number;
  fetchComments: (ticketId: string, page?: number) => Promise<void>;
  loadMoreComments: (ticketId: string) => Promise<void>;
  addComment: (ticketId: string, content: string, parentCommentId?: number) => Promise<void>;
}

/**
 * Hook untuk mengelola comments/diskusi pada ticket
 * 
 * Features:
 * - Fetch comments dengan pagination (30 per halaman)
 * - Load more functionality
 * - Create comment
 * - Error handling
 */
export const useTicketComments = (): UseTicketCommentsReturn => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Fetch comments untuk page tertentu
  const fetchComments = useCallback(async (ticketId: string, page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTicketComments(ticketId, page, 30);
      
      // Comments dari API berupa DESC (newest first)
      // Reverse agar oldest first, newest last
      const newComments = response.data.reverse();
      
      if (page === 1) {
        setComments(newComments);
      } else {
        // Untuk load more, append ke akhir (oldest first, newest last)
        setComments(prev => [...prev, ...newComments]);
      }
      
      setCurrentPage(response.meta.current_page);
      setTotalComments(response.meta.total);
      setLastPage(response.meta.last_page);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch comments'));
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more comments (next page)
  const loadMoreComments = useCallback(async (ticketId: string) => {
    if (currentPage >= lastPage || loading) return;
    
    try {
      await fetchComments(ticketId, currentPage + 1);
    } catch (err) {
      console.error('Error loading more comments:', err);
    }
  }, [currentPage, lastPage, loading, fetchComments]);

  // Create/add new comment dengan optional reply
  const addComment = useCallback(async (ticketId: string, content: string, parentCommentId?: number) => {
    setError(null);
    try {
      const newComment = await createTicketComment(ticketId, content, parentCommentId);
      
      // Jika ini reply, update parent comment dengan menambahkan replies
      if (parentCommentId) {
        setComments(prev => prev.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment],
            };
          }
          return comment;
        }));
      } else {
        // Jika main comment, add ke akhir list (newest at bottom)
        setComments(prev => [...prev, newComment]);
      }
      
      setTotalComments(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create comment'));
      console.error('Error creating comment:', err);
      throw err;
    }
  }, []);

  return {
    comments,
    loading,
    error,
    hasMore: currentPage < lastPage,
    currentPage,
    totalComments,
    fetchComments,
    loadMoreComments,
    addComment,
  };
};
