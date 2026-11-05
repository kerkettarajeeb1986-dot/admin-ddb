import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Truck,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Store,
  Bike,
  AlertTriangle,
  ArrowRight,
  Eye,
  X,
  CreditCard,
  RefreshCw,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { GroceryOrder, UserProfile, OrderStatus, PaymentStatus, DeliveryStatus } from '../../types';
import { orderService } from '../../services/orderService';
import { notificationService } from '../../services/notificationService';

interface AdminOrderManagerProps {
  orders: GroceryOrder[];
  deliveryPartners: UserProfile[];
  marketPartners: UserProfile[];
}

export const AdminOrderManager: React.FC<AdminOrderManagerProps> = ({
  orders,
  deliveryPartners,
  marketPartners,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<GroceryOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [assignRiderModal, setAssignRiderModal] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Available riders for assignment
  const availableRiders = deliveryPartners.filter((d) => d.status === 'active');

  const filteredOrders = orders.filter((order) => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        (order.orderNumber || '').toLowerCase().includes(q) ||
        (order.customerName || '').toLowerCase().includes(q) ||
        (order.customerPhone || '').includes(q) ||
        (order.localAreaName || '').toLowerCase().includes(q) ||
        (order.marketPartnerName || '').toLowerCase().includes(q) ||
        (order.deliveryPartnerName || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;

    // Payment filter
    if (paymentFilter === 'cod' && !order.isCOD) return false;
    if (paymentFilter === 'online' && order.isCOD) return false;
    if (paymentFilter === 'pending' && order.paymentStatus !== 'pending') return false;
    if (paymentFilter === 'completed' && order.paymentStatus !== 'completed') return false;

    return true;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setActionLoading(true);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setFeedback({ type: 'success', message: `Order marked as ${newStatus.replace(/_/g, ' ')}.` });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Status update failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRider = async () => {
    if (!selectedOrder || !selectedRiderId) return;
    const rider = availableRiders.find((r) => r.uid === selectedRiderId);
    if (!rider) return;

    setActionLoading(true);
    try {
      await orderService.assignDeliveryPartner(selectedOrder.id, rider.uid, rider.displayName);
      await notificationService.sendNotification(
        'delivery_assigned',
        'Delivery Partner Assigned',
        `Order ${selectedOrder.orderNumber} assigned to rider ${rider.displayName} in ${selectedOrder.localAreaName}`,
        'orders',
        selectedOrder.id
      );
      setFeedback({
        type: 'success',
        message: `Assigned rider ${rider.displayName} to order ${selectedOrder.orderNumber}.`,
      });
      setSelectedOrder({
        ...selectedOrder,
        deliveryPartnerId: rider.uid,
        deliveryPartnerName: rider.displayName,
        deliveryStatus: 'assigned',
      });
      setAssignRiderModal(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Rider assignment failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) {
      alert('Please enter a cancellation reason.');
      return;
    }
    setActionLoading(true);
    try {
      await orderService.cancelOrder(selectedOrder.id, cancelReason.trim());
      await notificationService.sendNotification(
        'order_cancelled',
        'Order Cancelled',
        `Order ${selectedOrder.orderNumber} was cancelled. Reason: ${cancelReason}`,
        'orders',
        selectedOrder.id
      );
      setFeedback({ type: 'success', message: `Order ${selectedOrder.orderNumber} cancelled.` });
      setSelectedOrder({ ...selectedOrder, status: 'cancelled', cancellationReason: cancelReason.trim() });
      setCancelModalOpen(false);
      setCancelReason('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Cancellation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessRefund = async (orderId: string) => {
    if (!window.confirm('Process refund for this order?')) return;
    setActionLoading(true);
    try {
      await orderService.updateRefundStatus(orderId, 'processed');
      setFeedback({ type: 'success', message: 'Refund marked as processed successfully.' });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, refundStatus: 'processed', paymentStatus: 'refunded' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Refund processing failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
              <span>Real-Time Order & Delivery Management</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {orders.length} Total
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live streaming orders across Dooars with full dispatch controls, COD settlement, and timeline auditing
            </p>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order ID, customer, zone, rider..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">Status:</span>
          {['all', 'pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}

          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-2 mr-1">Payment:</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">All Payments</option>
            <option value="cod">💵 Cash on Delivery (COD)</option>
            <option value="online">💳 Online / UPI</option>
            <option value="pending">Pending Payment</option>
            <option value="completed">Settled Payment</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>No orders match the current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Local Area</th>
                  <th className="py-3 px-4">Items & Total</th>
                  <th className="py-3 px-4">Payment & COD</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Assigned Rider</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const dateStr = order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Just now';

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 font-mono text-sm">
                          {order.orderNumber || order.id.slice(0, 8)}
                        </div>
                        <div className="text-[11px] text-gray-400">{dateStr}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{order.customerName}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{order.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{order.localAreaName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 text-sm">₹{order.totalAmount}</div>
                        <div className="text-[11px] text-gray-500">{order.items?.length || 0} grocery items</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.paymentMethod === 'upi'
                              ? 'bg-purple-100 text-purple-900'
                              : order.isCOD
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {order.paymentMethod === 'upi'
                            ? '📱 UPI QR'
                            : order.isCOD
                            ? '💵 COD'
                            : '💳 Online Paid'}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5 capitalize">
                          Status: {order.paymentStatus || 'pending'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : order.status === 'out_for_delivery'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {(order.status || 'pending').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {order.deliveryPartnerName ? (
                          <div className="flex items-center gap-1 text-gray-900 font-medium">
                            <Bike className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{order.deliveryPartnerName}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                            title="View Full Order Details & Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Order Detail & Dispatch Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-xl border border-gray-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 font-mono">
                    Order #{selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full capitalize ${
                      selectedOrder.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrder.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Local Service Zone: <span className="font-semibold text-gray-800">{selectedOrder.localAreaName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Triad Info: Customer, Store, Rider */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-600" /> Customer
                </span>
                <div className="font-bold text-gray-900 mt-1">{selectedOrder.customerName}</div>
                <div className="text-gray-500 text-[11px]">{selectedOrder.customerPhone}</div>
                <div className="text-gray-400 text-[10px] truncate mt-1">
                  {selectedOrder.shippingAddress?.street || (selectedOrder.shippingAddress as any)?.streetAddress || 'Doorstep delivery'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Store className="w-3 h-3 text-blue-600" /> Market Partner
                </span>
                <div className="font-bold text-gray-900 mt-1">
                  {selectedOrder.marketPartnerName || 'Dooars Central Partner'}
                </div>
                <div className="text-gray-500 text-[11px]">Zone: {selectedOrder.localAreaName}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Bike className="w-3 h-3 text-indigo-600" /> Delivery Fleet
                </span>
                <div className="font-bold text-gray-900 mt-1">
                  {selectedOrder.deliveryPartnerName || 'Unassigned'}
                </div>
                <button
                  onClick={() => setAssignRiderModal(true)}
                  className="text-[11px] text-indigo-700 font-bold hover:underline mt-1 block cursor-pointer"
                >
                  {selectedOrder.deliveryPartnerName ? 'Change Rider' : '+ Assign Rider'}
                </button>
              </div>
            </div>

            {/* Items Ordered List */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Order Items ({selectedOrder.items?.length || 0})
              </h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white">
                    <div>
                      <span className="font-bold text-gray-900">{item.productName}</span>
                      <span className="text-gray-400 ml-2">({item.unit})</span>
                      <div className="text-[11px] text-gray-500">
                        Qty: {item.quantity} × ₹{item.price}
                      </div>
                    </div>
                    <div className="font-bold text-gray-900">₹{item.price * item.quantity}</div>
                  </div>
                ))}

                {/* Subtotals */}
                <div className="p-3 bg-gray-50 text-xs space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee:</span>
                    <span>₹{selectedOrder.deliveryFee || 0}</span>
                  </div>
                  {selectedOrder.packagingFee !== undefined && (
                    <div className="flex justify-between text-gray-600">
                      <span>Packaging Fee:</span>
                      <span>₹{selectedOrder.packagingFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total Order Value:</span>
                    <span className="text-emerald-800">₹{selectedOrder.totalAmount}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 pt-1 flex items-center justify-between">
                    <span>
                      Payment Mode:{' '}
                      {selectedOrder.paymentMethod === 'upi'
                        ? '📱 UPI QR Code Payment'
                        : selectedOrder.isCOD
                        ? '💵 Cash on Delivery'
                        : '💳 Online Payment'}
                    </span>
                    <span className="font-semibold capitalize">Status: {selectedOrder.paymentStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Timeline */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Order Status & Timeline
              </h4>
              <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 ? (
                  selectedOrder.timeline.map((event, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900">{event.title}</span>
                        {event.note && <span className="text-gray-500 text-[11px] block">{event.note}</span>}
                        <span className="text-[10px] text-gray-400">
                          {event.timestamp ? new Date(event.timestamp).toLocaleString('en-IN') : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">Initial placed order state logged.</p>
                )}
              </div>
            </div>

            {/* Admin Order Control Actions */}
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500 mr-1">Update Status:</span>
                {selectedOrder.status !== 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    Confirm
                  </button>
                )}
                {selectedOrder.status !== 'packing' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'packing')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    Pack Order
                  </button>
                )}
                {selectedOrder.status !== 'out_for_delivery' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'out_for_delivery')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    Dispatch
                  </button>
                )}
                {selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    Mark Delivered
                  </button>
                )}
                {selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
                {selectedOrder.status === 'cancelled' && selectedOrder.refundStatus !== 'processed' && (
                  <button
                    onClick={() => handleProcessRefund(selectedOrder.id)}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    Process Refund
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Rider Sub-Modal */}
      {assignRiderModal && selectedOrder && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Dispatch Rider for Order #{selectedOrder.orderNumber}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Select an approved active rider in {selectedOrder.localAreaName} to handle pickup and doorstep delivery.
            </p>

            {availableRiders.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-4">
                No active delivery riders approved in the fleet currently. Please approve riders first.
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                <label className="block text-xs font-semibold text-gray-700">Choose Fleet Rider:</label>
                <select
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white font-medium"
                >
                  <option value="">-- Select Rider --</option>
                  {availableRiders.map((r) => (
                    <option key={r.uid} value={r.uid}>
                      {r.displayName} ({r.vehicleType || 'Bike'}) — Zone: {r.localAreaName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAssignRiderModal(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRider}
                disabled={!selectedRiderId || actionLoading}
                className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Confirm Dispatch Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Cancel Order #{selectedOrder.orderNumber}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter official reason for cancelling this customer order (e.g. out of stock, customer requested).
            </p>

            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              className="w-full p-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-600 focus:outline-none mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
