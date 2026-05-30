import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, Check, AlertTriangle, AlertCircle, Info, CheckCircle, Trash2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBackendUrl } from '../utils/config';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read?: boolean | number;
  isRead?: boolean | number;
  created_at?: string;
  createdAt?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${getBackendUrl()}/api/notifications`, reqConfig);
      const data = response.data?.data || response.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };


  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` }, data: { notificationIds: selectedIds } } : { data: { notificationIds: selectedIds } };
      await axios.delete(`${getBackendUrl()}/api/notifications/bulk-delete`, reqConfig);
      
      setNotifications((prev) => prev.filter((notif) => !selectedIds.includes(notif.id)));
      setSelectedIds([]);
      window.dispatchEvent(new Event('notifications_updated'));
      triggerToast(`Successfully deleted ${selectedIds.length} notification(s)`, 'success');
    } catch (error) {
      console.error('Failed to bulk delete notifications');
      triggerToast('Failed to delete selected notifications', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.delete(`${getBackendUrl()}/api/notifications/${id}`, reqConfig);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      window.dispatchEvent(new Event('notifications_updated'));
      triggerToast('Notification deleted successfully!', 'success');
    } catch (error) {
      console.error('Failed to delete notification');
      triggerToast('Failed to delete notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.patch(`${getBackendUrl()}/api/notifications/read-all`, {}, reqConfig);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notifications_updated'));
      triggerToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Failed to mark all as read');
      triggerToast('Failed to mark notifications as read', 'error');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getContainerBorderClass = (type: string, isRead: boolean) => {
    if (isRead) return 'border-slate-100 dark:border-dark-border/30 bg-white dark:bg-dark-card';
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-500/[0.01]';
      case 'error':
        return 'border-rose-500/30 bg-rose-500/[0.02] dark:bg-rose-500/[0.01]';
      case 'info':
      default:
        return 'border-blue-500/30 bg-blue-500/[0.02] dark:bg-blue-500/[0.01]';
    }
  };

  const unreadCount = notifications.filter(n => !(n.isRead ?? n.is_read)).length;
  
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center border border-rose-500/5">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Notifications</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-2">
              <span>You have {unreadCount} unread message{unreadCount === 1 ? '' : 's'}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn-outline flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 size={14} />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-outline flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold"
            >
              <Check size={14} />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16">
          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Bell size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Notifications</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">We'll alert you here when there are updates on your submissions, payouts, or KYC status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedNotifications.map((notification) => {
            const isRead = !!(notification.isRead ?? notification.is_read);
            const dateStr = notification.createdAt || notification.created_at || new Date().toISOString();
            return (
              <div
                key={notification.id}
                className={`card p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:shadow-soft-lg group ${getContainerBorderClass(
                  notification.type || 'info',
                  isRead
                )}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center h-full pt-3 mr-1">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(notification.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(p => [...p, notification.id]);
                        else setSelectedIds(p => p.filter(id => id !== notification.id));
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer dark:border-slate-600 dark:bg-slate-700"
                    />
                  </div>
                  {/* Icon badge */}
                  <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-dark-border/40 flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type || 'info')}
                  </div>
                  
                  {/* Message body */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className={`text-base font-bold ${isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {notification.title}
                      </h3>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Unread" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">{notification.message}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold pt-1">
                      {new Date(dateStr).toLocaleString()}
                    </p>
                  </div>
                </div>

                  {/* Actions */}
                <div className="flex items-center justify-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                    title="Delete Notification"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-border/40 pt-6 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-dark-border/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={16} />
              <span className="text-sm font-medium">Previous</span>
            </button>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-dark-border/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-white transition-all transform duration-300 animate-slide-in ${showToast.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-600 border-rose-700'}`}>
          {showToast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span className="font-semibold text-xs">{showToast.message}</span>
        </div>
      )}
    </div>
  );
}
