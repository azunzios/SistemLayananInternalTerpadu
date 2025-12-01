import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  read_at: string | null;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
}

interface NotificationResponse {
  success: boolean;
  message: string;
  data: {
    data: Notification[];
    current_page: number;
    last_page: number;
    total: number;
  };
  unread_count: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const PER_PAGE = 15;

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const hasMore = currentPage < lastPage;
  
  // Prevent duplicate fetch
  const fetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<NotificationResponse>(`/notifications?page=1&per_page=${PER_PAGE}`);
      if (response.success) {
        setNotifications(response.data.data || []);
        setUnreadCount(response.unread_count || 0);
        setCurrentPage(response.data.current_page);
        setLastPage(response.data.last_page);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat notifikasi';
      setError(message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || fetchingRef.current) return;
    fetchingRef.current = true;
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await api.get<NotificationResponse>(`/notifications?page=${nextPage}&per_page=${PER_PAGE}`);
      if (response.success) {
        setNotifications(prev => [...prev, ...(response.data.data || [])]);
        setCurrentPage(response.data.current_page);
        setLastPage(response.data.last_page);
      }
    } catch (err: unknown) {
      console.error('Failed to load more:', err);
    } finally {
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [currentPage, hasMore, loadingMore]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: unknown) {
      console.error('Failed to mark as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err: unknown) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll every 30 seconds (only first page untuk cek notif baru)
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    error,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
}
