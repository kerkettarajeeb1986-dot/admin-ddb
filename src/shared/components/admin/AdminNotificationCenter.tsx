import React from 'react';
import {
  Bell,
  CheckCircle2,
  Trash2,
  X,
  ExternalLink,
  UserPlus,
  Store,
  Bike,
  ShoppingBag,
  Truck,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { AdminNotification, NotificationType } from '../../types';
import { notificationService } from '../../services/notificationService';

interface AdminNotificationCenterProps {
  notifications: AdminNotification[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string, targetId?: string) => void;
}

export const AdminNotificationCenter: React.FC<AdminNotificationCenterProps> = ({
  notifications,
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const isItemRead = (n: AdminNotification) => Boolean(n.read || n.isRead);

  const unreadCount = notifications.filter((n) => !isItemRead(n)).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(notifications);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (!isItemRead(notification)) {
      await notificationService.markAsRead(notification.id);
    }
    const target = notification.targetTab || notification.linkTab;
    const targetId = notification.targetId || notification.entityId;
    if (target) {
      onNavigateTab(target, targetId);
      onClose();
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'new_customer':
        return <UserPlus className="w-4 h-4 text-emerald-600" />;
      case 'new_partner_application':
        return <Store className="w-4 h-4 text-blue-600" />;
      case 'new_rider_application':
        return <Bike className="w-4 h-4 text-indigo-600" />;
      case 'new_order':
        return <ShoppingBag className="w-4 h-4 text-amber-600" />;
      case 'order_delivered':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'delivery_assigned':
        return <Truck className="w-4 h-4 text-indigo-600" />;
      case 'dispute_raised':
      case 'new_dispute':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'order_cancelled':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'refund_requested':
        return <RotateCcw className="w-4 h-4 text-purple-600" />;
      case 'bank_updated':
        return <CreditCard className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h3 className="font-bold text-sm">Real-Time Admin Alerts</h3>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs px-4">
          <span className="text-gray-500">{notifications.length} alerts logged</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No new notifications right now.</p>
              <p className="text-[11px] text-gray-400 mt-1">
                New customer registrations, orders, and partner applications will show here live.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const timeStr = n.createdAt?.toDate
                ? n.createdAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : 'Now';

              const hasTarget = n.targetTab || n.linkTab;
              const isRead = isItemRead(n);

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 transition cursor-pointer flex items-start gap-3 ${
                    isRead ? 'bg-white hover:bg-gray-50' : 'bg-emerald-50/40 hover:bg-emerald-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{n.title}</h4>
                      <span className="text-[10px] text-gray-400 shrink-0">{timeStr}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{n.message}</p>
                    {hasTarget && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-1.5 hover:underline">
                        Jump to {hasTarget.replace(/_/g, ' ')} <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  {!isRead && (
                    <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-[11px] text-gray-400">
          Dooars Daily Basket · Super Admin Notification Stream
        </div>
      </div>
    </div>
  );
};
