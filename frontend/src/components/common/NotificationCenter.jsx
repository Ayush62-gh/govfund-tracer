import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, ShieldAlert, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { useData } from '../../context/DataContext';

/**
 * NotificationCenter Component
 * Priority-sorted notification bell dropdown with live alert routing
 */
export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markNotificationRead, setSelectedAlert, alerts } = useData();
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (item) => {
    markNotificationRead(item.id);
    if (item.alertId) {
      const matched = alerts.find((a) => a.id === item.alertId);
      if (matched) {
        setSelectedAlert(matched);
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-slide-up">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
                Alerts & Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => notifications.forEach((n) => markNotificationRead(n.id))}
              className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active notifications
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3 ${
                    !item.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {item.priority === 'high' ? (
                      <div className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                      {item.desc}
                    </p>
                    {item.alertId && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                        Review Anomaly Dossier <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2"></span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
