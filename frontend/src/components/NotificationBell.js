import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '../lib/utils';

const TYPE_META = {
  status_change: { icon: PhosphorIcons.ArrowsClockwise, color: 'text-blue-600 dark:text-blue-400' },
  comment: { icon: PhosphorIcons.ChatCircle, color: 'text-violet-600 dark:text-violet-400' },
  assignment: { icon: PhosphorIcons.UserCircle, color: 'text-amber-600 dark:text-amber-400' },
  verification_request: { icon: PhosphorIcons.SealCheck, color: 'text-emerald-600 dark:text-emerald-400' },
  reopened: { icon: PhosphorIcons.ArrowCounterClockwise, color: 'text-rose-600 dark:text-rose-400' },
};

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/notifications/unread-count`, {
        withCredentials: true,
      });
      setUnreadCount(data.count ?? 0);
    } catch {
      /* ignore when logged out */
    }
  }, [BACKEND_URL]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/notifications`, {
        params: { limit: 30 },
        withCredentials: true,
      });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const markAsRead = async (notification) => {
    if (!notification.read) {
      try {
        await axios.patch(
          `${BACKEND_URL}/api/notifications/${notification.id}/read`,
          {},
          { withCredentials: true }
        );
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    setOpen(false);
    navigate(`/explore?issue=${notification.issue_id}`);
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(`${BACKEND_URL}/api/notifications/read-all`, {}, { withCredentials: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 transition-colors duration-200"
          aria-label="Notifications"
          data-testid="notification-bell"
        >
          <PhosphorIcons.Bell size={18} weight={unreadCount > 0 ? 'fill' : 'duotone'} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold leading-none shadow-sm"
              data-testid="notification-unread-badge"
            >
              {badgeLabel}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(100vw-2rem,22rem)] p-0 border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 backdrop-blur-sm rounded-xl shadow-xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200/80 dark:border-stone-800">
          <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              data-testid="mark-all-read"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[min(60vh,320px)] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone-500">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone-500 dark:text-stone-400">
              No notifications yet
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {notifications.map((notification) => {
                const meta = TYPE_META[notification.type] || TYPE_META.status_change;
                const Icon = meta.icon;
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => markAsRead(notification)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-900/80 transition-colors flex gap-3',
                        !notification.read && 'bg-emerald-50/50 dark:bg-emerald-950/20'
                      )}
                      data-testid={`notification-item-${notification.id}`}
                    >
                      <div className={cn('mt-0.5 shrink-0', meta.color)}>
                        <Icon size={20} weight="duotone" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-stone-900 dark:text-white leading-snug">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="shrink-0 w-2 h-2 rounded-full bg-emerald-600 mt-1.5" aria-hidden />
                          )}
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 font-medium">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
