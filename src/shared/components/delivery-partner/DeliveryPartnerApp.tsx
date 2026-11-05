import React, { useState, useEffect } from 'react';
import {
  Bike,
  MapPin,
  CheckCircle2,
  Navigation,
  Wallet,
  Phone,
  QrCode,
  Banknote,
  Package,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  IndianRupee,
  RefreshCw,
  Headphones,
  Mail,
  MessageSquare,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { orderService } from '../../services/orderService';
import { locationTrackingService } from '../../services/locationTrackingService';
import { presenceService } from '../../services/presenceService';
import { GroceryOrder } from '../../types';
import { DeliveryWalletView } from './DeliveryWalletView';
import { DeliveryPaymentQRModal } from './DeliveryPaymentQRModal';
import { SupportModal } from '../common/SupportModal';
import { BusinessPolicyModal, PolicyType } from '../common/BusinessPolicyModal';

export const DeliveryPartnerApp: React.FC = () => {
  const { userProfile } = useAuth();
  const { masterSettings, businessSettings } = useStore();

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; tab: PolicyType }>({
    isOpen: false,
    tab: 'terms',
  });
  const [isOnline, setIsOnline] = useState(true);
  const [orders, setOrders] = useState<GroceryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<GroceryOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Subscribe to orders for this delivery partner
  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    const unsub = orderService.subscribeToOrders(
      { deliveryPartnerId: userProfile.uid },
      (riderOrders) => {
        setOrders(riderOrders);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userProfile?.uid]);

  // Manage Heartbeat Presence and Throttled GPS Tracking
  useEffect(() => {
    if (!userProfile?.uid) return;

    // Start 60-second presence heartbeat
    const stopHeartbeat = presenceService.startHeartbeat(
      userProfile.uid,
      'delivery_partner',
      isOnline
    );

    // If online and has active orders, start throttled GPS tracking
    let stopGps = () => {};
    const firstActiveOrderId = orders.find((o) => o.status !== 'delivered' && o.status !== 'cancelled')?.id;

    if (isOnline && firstActiveOrderId) {
      stopGps = locationTrackingService.startRiderTracking(
        userProfile.uid,
        userProfile.displayName || 'Delivery Partner',
        firstActiveOrderId
      );
    } else {
      locationTrackingService.stopRiderTracking();
    }

    return () => {
      stopHeartbeat();
      stopGps();
      locationTrackingService.stopRiderTracking();
    };
  }, [userProfile?.uid, isOnline, orders]);

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  const handleUpdateStatus = async (orderId: string, newStatus: 'picked_up' | 'out_for_delivery') => {
    setActionInProgress(orderId);
    try {
      await orderService.updateDeliveryStatus(
        orderId,
        newStatus,
        `Rider ${userProfile?.displayName || 'Hero'} updated delivery to ${newStatus}`
      );
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmPaymentAndDelivery = async (
    orderId: string,
    method: 'upi' | 'cod',
    amount: number,
    transactionRef?: string
  ) => {
    const riderName = userProfile?.displayName || 'Delivery Partner';
    await orderService.confirmDeliveryPayment(orderId, method, amount, riderName, transactionRef);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Profile & Status Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{userProfile?.displayName || 'Delivery Hero'}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isOnline ? '● Active Rider' : '○ Offline'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Dooars Hyperlocal Delivery Rider • Zone: {userProfile?.localAreaName || 'Main Hub'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsSupportOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <Headphones className="w-3.5 h-3.5 text-emerald-700" />
            <span>Support</span>
          </button>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              isOnline ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-emerald-700 text-white'
            }`}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
          <button
            onClick={() => setIsWalletOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 text-gray-700 shadow-2xs"
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Driver Wallet</span>
          </button>
        </div>
      </div>

      {/* UPI QR Payment Highlight Banner for Delivery Partner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/30 text-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI Scan & Pay System</span>
              </span>
            </div>
            <h3 className="text-base font-bold text-white">QR Code Payment on Delivery (डिलीवरी पर QR पेमेंट)</h3>
            <p className="text-xs text-emerald-100/90 max-w-xl leading-relaxed">
              Customer ko deliver karte waqt <strong>"Collect Payment (QR Code)"</strong> par click karein. Customer PhonePe, Google Pay ya Paytm se scan karega aur paisa turant Admin account me jama ho jayega.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-xs shrink-0 space-y-1">
            <div className="text-emerald-200 text-[11px]">Platform UPI ID:</div>
            <div className="font-mono font-bold text-white text-sm">{masterSettings.upiId || 'dooarsbasket@upi'}</div>
            <div className="text-[10px] text-emerald-200">Payee: {masterSettings.upiPayeeName || 'Dooars Basket'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Active Deliveries ({activeOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed ({completedOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Orders List Content */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-medium">Loading live deliveries...</p>
        </div>
      ) : activeTab === 'active' ? (
        activeOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
            <Navigation className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No active delivery orders assigned</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              When the Super Admin or automated system assigns pickup tasks in your area, orders will appear here with customer address and QR Code collection options.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const isPaid = order.paymentStatus === 'completed';
              return (
                <div
                  key={order.id}
                  className="bg-white border-2 border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-5 shadow-sm space-y-4 transition"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            order.deliveryStatus === 'picked_up'
                              ? 'bg-amber-100 text-amber-800'
                              : order.deliveryStatus === 'out_for_delivery'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {order.deliveryStatus || 'Assigned'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Local Zone: <strong className="text-gray-700">{order.localAreaName}</strong>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-lg font-black text-emerald-800">₹{order.totalAmount}</div>
                      <div className="text-[11px] font-semibold">
                        {isPaid ? (
                          <span className="text-emerald-700 flex items-center sm:justify-end gap-1">
                            <Check className="w-3 h-3" /> Paid via {order.paymentMethod === 'upi' ? 'UPI QR' : 'Online'}
                          </span>
                        ) : (
                          <span className="text-amber-700 flex items-center sm:justify-end gap-1">
                            <Clock className="w-3 h-3" /> Payment Pending ({order.isCOD ? 'COD / QR' : 'Pending'})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                      <div className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Customer Details</div>
                      <div className="font-bold text-gray-900 text-sm">{order.customerName}</div>
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call: {order.customerPhone}</span>
                        </a>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                      <div className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider">Delivery Destination</div>
                      <div className="flex items-start gap-1.5 text-gray-800">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{order.shippingAddress?.street || 'Customer Address'}</p>
                          <p className="text-gray-500 text-[11px]">
                            PIN: {order.shippingAddress?.pinCode} • {order.localAreaName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="text-xs text-gray-600 bg-emerald-50/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 border border-emerald-100">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Package className="w-4 h-4 text-emerald-700" />
                      <span>{order.items?.length || 0} Grocery Items in Basket</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-[11px] text-gray-500">
                        {order.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Delivery Fee: ₹{order.deliveryFee || 0} • Packaging: ₹{order.packagingFee || 0}
                    </div>
                  </div>

                  {/* Rider Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {order.deliveryStatus !== 'picked_up' && order.deliveryStatus !== 'out_for_delivery' && (
                      <button
                        type="button"
                        disabled={actionInProgress === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'picked_up')}
                        className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Package className="w-4 h-4" />
                        <span>Pick Up from Store</span>
                      </button>
                    )}

                    {order.deliveryStatus === 'picked_up' && (
                      <button
                        type="button"
                        disabled={actionInProgress === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                        className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Start Ride (Out for Delivery)</span>
                      </button>
                    )}

                    {/* QR Code & Payment Collection CTA */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForPayment(order)}
                      className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>
                        {isPaid ? 'Show Order QR Receipt' : `Collect Payment • QR Code (₹${order.totalAmount})`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : completedOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800">No completed deliveries yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Deliveries completed by collecting customer QR code payment or cash will be tracked here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 font-mono">#{order.orderNumber}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Delivered
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium text-[10px]">
                    Paid via {order.paymentMethod === 'upi' ? 'UPI QR Code' : order.paymentMethod === 'cod' ? 'Cash' : 'Online'}
                  </span>
                </div>
                <p className="text-gray-600">
                  Customer: <strong>{order.customerName}</strong> • {order.localAreaName}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="font-extrabold text-emerald-800 text-base">₹{order.totalAmount}</div>
                <div className="text-[11px] text-gray-500">
                  Rider Trip Share: ₹{Math.round((order.deliveryFee || 40) * 0.8)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code & Payment Modal */}
      {selectedOrderForPayment && (
        <DeliveryPaymentQRModal
          isOpen={!!selectedOrderForPayment}
          onClose={() => setSelectedOrderForPayment(null)}
          order={selectedOrderForPayment}
          masterSettings={masterSettings}
          riderName={userProfile?.displayName || 'Delivery Partner'}
          onConfirmPayment={handleConfirmPaymentAndDelivery}
        />
      )}

      {/* Driver Wallet Modal */}
      {isWalletOpen && (
        <DeliveryWalletView isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      )}

      {/* Rider Fleet Support & Business Office Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">
                {businessSettings.businessName || 'DOOARS DAILY BASKET'} • Rider Fleet Support
              </h4>
              <p className="text-xs text-gray-500">
                Dispatch support, route assistance, wallet settlements, and regional helpdesk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSupportOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Contact Dispatch</span>
            </button>
            <button
              onClick={() => setPolicyModal({ isOpen: true, tab: 'terms' })}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition"
            >
              Rider Terms
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-gray-700 border-t border-gray-100">
          {businessSettings.isWhatsAppEnabled && businessSettings.supportWhatsApp && (
            <a
              href={`https://wa.me/91${businessSettings.supportWhatsApp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg font-medium text-emerald-900 hover:bg-emerald-100"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="truncate">WhatsApp: {businessSettings.supportWhatsApp}</span>
            </a>
          )}
          {businessSettings.isEmailEnabled && businessSettings.supportEmail && (
            <a
              href={`mailto:${businessSettings.supportEmail}`}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg font-medium text-gray-800 hover:bg-gray-100"
            >
              <Mail className="w-4 h-4 text-gray-600 shrink-0" />
              <span className="truncate">{businessSettings.supportEmail}</span>
            </a>
          )}
          {businessSettings.officeAddress && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg font-medium text-gray-800">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">Office: Jalpaiguri, WB 734501</span>
            </div>
          )}
        </div>
      </div>

      {isSupportOpen && (
        <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      )}
      {policyModal.isOpen && (
        <BusinessPolicyModal
          isOpen={policyModal.isOpen}
          onClose={() => setPolicyModal({ isOpen: false, tab: 'terms' })}
          initialTab={policyModal.tab}
        />
      )}
    </div>
  );
};
