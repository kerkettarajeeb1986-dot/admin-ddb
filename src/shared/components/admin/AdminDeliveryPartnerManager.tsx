import React, { useState } from 'react';
import {
  Bike,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Eye,
  Trash2,
  X,
  Truck,
  IndianRupee,
  Navigation,
  FileText,
  UserCheck,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, GroceryOrder, Dispute, UserStatus } from '../../types';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';
import { orderService } from '../../services/orderService';

interface AdminDeliveryPartnerManagerProps {
  deliveryPartners: UserProfile[];
  orders: GroceryOrder[];
  disputes: Dispute[];
}

export const AdminDeliveryPartnerManager: React.FC<AdminDeliveryPartnerManagerProps> = ({
  deliveryPartners,
  orders,
  disputes,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'rejected' | 'suspended' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRider, setSelectedRider] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [riderToReject, setRiderToReject] = useState<UserProfile | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Permanent Delete Rider State
  const [riderToDelete, setRiderToDelete] = useState<UserProfile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingRider, setIsDeletingRider] = useState(false);

  const handleOpenDeleteRider = (rider: UserProfile) => {
    setRiderToDelete(rider);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteRider = async () => {
    if (!riderToDelete) return;
    setIsDeletingRider(true);
    try {
      await userService.deleteUser(riderToDelete.uid);
      setFeedback({
        type: 'success',
        message: `Delivery Rider "${riderToDelete.displayName}" permanently deleted from Firebase.`,
      });
      setIsDeleteModalOpen(false);
      if (selectedRider?.uid === riderToDelete.uid) {
        setSelectedRider(null);
      }
      setRiderToDelete(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to permanently delete delivery partner.',
      });
    } finally {
      setIsDeletingRider(false);
    }
  };

  // Tab counts
  const pendingCount = deliveryPartners.filter((d) => d.status === 'pending').length;
  const approvedCount = deliveryPartners.filter((d) => d.status === 'active').length;
  const rejectedCount = deliveryPartners.filter((d) => d.status === 'rejected').length;
  const suspendedCount = deliveryPartners.filter((d) => d.status === 'suspended').length;

  const filteredRiders = deliveryPartners.filter((rider) => {
    // Status tab filter
    if (activeTab !== 'all') {
      const rStatus = rider.status || 'pending';
      if (rStatus !== activeTab) return false;
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        (rider.displayName || '').toLowerCase().includes(q) ||
        (rider.email || '').toLowerCase().includes(q) ||
        (rider.phone || '').includes(q) ||
        (rider.localAreaName || '').toLowerCase().includes(q) ||
        (rider.vehicleType || '').toLowerCase().includes(q) ||
        (rider.vehicleNumber || '').toLowerCase().includes(q) ||
        (rider.drivingLicenseNumber || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleApproveRider = async (rider: UserProfile) => {
    setActionLoading(true);
    try {
      await userService.updateUserStatus(rider.uid, 'active');
      await notificationService.sendNotification(
        'new_rider_application',
        'Delivery Rider Approved',
        `Rider ${rider.displayName} (${rider.vehicleType}) approved for deliveries in ${rider.localAreaName}.`,
        'delivery_partners',
        rider.uid
      );
      setFeedback({ type: 'success', message: `${rider.displayName} is now APPROVED for delivery dispatch!` });
      if (selectedRider?.uid === rider.uid) {
        setSelectedRider({ ...selectedRider, status: 'active' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Approval failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (rider: UserProfile) => {
    setRiderToReject(rider);
    setRejectionReason('');
    setRejectionModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!riderToReject) return;
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason for the applicant.');
      return;
    }
    setActionLoading(true);
    try {
      await userService.updateUserStatus(riderToReject.uid, 'rejected', rejectionReason.trim());
      setFeedback({
        type: 'success',
        message: `Rider application for ${riderToReject.displayName} rejected.`,
      });
      setRejectionModalOpen(false);
      setRiderToReject(null);
      if (selectedRider?.uid === riderToReject.uid) {
        setSelectedRider({ ...selectedRider, status: 'rejected', rejectionReason: rejectionReason.trim() });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Rejection failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = async (rider: UserProfile) => {
    const newStatus: UserStatus = rider.status === 'suspended' ? 'active' : 'suspended';
    setActionLoading(true);
    try {
      await userService.updateUserStatus(rider.uid, newStatus);
      setFeedback({
        type: 'success',
        message: `Rider ${rider.displayName} status updated to ${newStatus}.`,
      });
      if (selectedRider?.uid === rider.uid) {
        setSelectedRider({ ...selectedRider, status: newStatus });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Status update failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Associated deliveries & stats for selected rider
  const riderDeliveries = selectedRider
    ? orders.filter((o) => o.deliveryPartnerId === selectedRider.uid)
    : [];

  const completedDeliveries = riderDeliveries.filter((o) => o.status === 'delivered').length;
  const activeDelivery = riderDeliveries.find((o) =>
    ['confirmed', 'packing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status)
  );

  const totalRiderEarnings = riderDeliveries
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.deliveryFee || 35), 0);

  const riderDisputes = selectedRider
    ? disputes.filter(
        (d) =>
          d.raisedById === selectedRider.uid ||
          d.raisedByName?.toLowerCase().includes((selectedRider.displayName || '').toLowerCase())
      )
    : [];

  return (
    <div className="space-y-5">
      {/* Header & Status Tabs */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Bike className="w-5 h-5 text-indigo-700" />
              <span>Delivery Fleet & Rider Management</span>
              <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                {deliveryPartners.length} Total
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review rider registrations, verify driving credentials, track live assignments & manage payouts
            </p>
          </div>

          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rider, vehicle, area, license..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Status Nav Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
            <span className="bg-purple-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'active'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approved Fleet</span>
            <span className="bg-indigo-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
            <span className="bg-rose-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {rejectedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('suspended')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'suspended'
                ? 'bg-gray-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Suspended</span>
            <span className="bg-gray-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {suspendedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Riders ({deliveryPartners.length})
          </button>
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

      {/* Riders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredRiders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            <Bike className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>No delivery riders in the "{activeTab}" category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Rider</th>
                  <th className="py-3 px-4">Vehicle & DL</th>
                  <th className="py-3 px-4">Delivery Zone</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRiders.map((rider) => {
                  const status = rider.status || 'pending';

                  return (
                    <tr key={rider.uid} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 text-sm">{rider.displayName}</div>
                        <div className="text-[11px] text-gray-500">{rider.phone || rider.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800">{rider.vehicleType || 'Motorcycle'}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {rider.vehicleNumber ? `Reg: ${rider.vehicleNumber}` : 'Reg pending'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{rider.localAreaName || 'General Zone'}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[160px] mt-0.5">
                          PIN: {rider.pinCode || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            rider.isAvailable !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {rider.isAvailable !== false ? '🟢 Ready to Dispatch' : '🟠 Busy / On Delivery'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            status === 'active'
                              ? 'bg-indigo-100 text-indigo-800'
                              : status === 'pending'
                              ? 'bg-purple-100 text-purple-800'
                              : status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedRider(rider)}
                            className="p-1.5 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                            title="View Full Application & Delivery History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveRider(rider)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md text-[11px] font-bold shadow-xs transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenReject(rider)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-[11px] font-bold transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {status === 'active' && (
                            <button
                              onClick={() => handleToggleSuspend(rider)}
                              disabled={actionLoading}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition cursor-pointer"
                              title="Suspend Rider"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {status === 'suspended' && (
                            <button
                              onClick={() => handleToggleSuspend(rider)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 rounded-md text-[11px] font-bold transition cursor-pointer"
                            >
                              Re-activate
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenDeleteRider(rider)}
                            disabled={actionLoading || isDeletingRider}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Permanently Delete Delivery Rider from Firebase (राइडर हटाएं)"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
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

      {/* Rejection Modal */}
      {rejectionModalOpen && riderToReject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Reject Rider Application: {riderToReject.displayName}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter reason for declining application (e.g. invalid driving license, outside fleet zones).
            </p>

            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason here..."
              className="w-full p-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-600 focus:outline-none mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Rider Details Drawer / Modal */}
      {selectedRider && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-gray-200">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedRider.displayName}</h3>
                <p className="text-xs text-gray-500">
                  Fleet Rider · Vehicle: {selectedRider.vehicleType} ({selectedRider.vehicleNumber || 'No reg'})
                </p>
              </div>
              <button
                onClick={() => setSelectedRider(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500">Status</span>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${
                      selectedRider.status === 'active'
                        ? 'bg-indigo-100 text-indigo-800'
                        : selectedRider.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {selectedRider.status || 'pending'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500">Completed Runs</span>
                <div className="text-xs font-bold text-gray-900 mt-1">{completedDeliveries}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500">License Number</span>
                <div className="text-xs font-mono text-gray-900 mt-1 truncate">
                  {selectedRider.drivingLicenseNumber || 'Not submitted'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500">Total Earnings</span>
                <div className="text-xs font-bold text-indigo-700 mt-1">₹{totalRiderEarnings}</div>
              </div>
            </div>

            {/* Contact & Residential Zone */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs mb-5">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Zone & Residential Address</span>
              </h4>
              <p className="text-gray-700">
                {selectedRider.address || 'Address not provided'} · PIN: {selectedRider.pinCode || '—'} · Zone: {selectedRider.localAreaName}
              </p>
              <div className="mt-2 text-gray-600 flex items-center gap-3">
                <span>Phone: {selectedRider.phone || '—'}</span>
                <span>Email: {selectedRider.email}</span>
                <span>UPI ID: {selectedRider.bankDetails?.upiId || '—'}</span>
              </div>
            </div>

            {/* Currently Assigned Order */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Active Assigned Delivery
              </h4>
              {activeDelivery ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-900">Order #{activeDelivery.orderNumber}</div>
                    <div className="text-amber-700 text-[11px]">
                      Customer: {activeDelivery.customerName} · Zone: {activeDelivery.localAreaName} · Total: ₹{activeDelivery.totalAmount}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-bold text-[10px] capitalize">
                    {activeDelivery.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-center text-xs text-gray-400">
                  No active delivery order currently assigned to this rider.
                </div>
              )}
            </div>

            {/* Past Delivery History */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Delivery Run History ({riderDeliveries.length})
              </h4>
              {riderDeliveries.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-lg text-center text-xs text-gray-400">
                  No completed delivery records yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {riderDeliveries.map((order) => (
                    <div
                      key={order.id}
                      className="p-2 border border-gray-200 rounded-lg text-xs bg-white flex items-center justify-between"
                    >
                      <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                      <span className="text-gray-500">{order.localAreaName}</span>
                      <span className="font-bold text-indigo-700">Fee: ₹{order.deliveryFee || 35}</span>
                      <span className="text-[10px] font-bold capitalize text-emerald-700">{order.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedRider.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApproveRider(selectedRider)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer"
                    >
                      Approve Rider
                    </button>
                    <button
                      onClick={() => handleOpenReject(selectedRider)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Reject Application
                    </button>
                  </>
                )}
                {selectedRider.status === 'active' && (
                  <button
                    onClick={() => handleToggleSuspend(selectedRider)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Suspend Rider
                  </button>
                )}
                {selectedRider.status === 'suspended' && (
                  <button
                    onClick={() => handleToggleSuspend(selectedRider)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Re-activate Rider
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenDeleteRider(selectedRider)}
                  disabled={actionLoading || isDeletingRider}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Rider (राइडर हमेशा के लिए हटाएं)</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedRider(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Rider Confirmation Modal */}
      {isDeleteModalOpen && riderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">
                Permanently Delete Delivery Rider?
              </h3>
              <p className="text-xs text-rose-700 font-medium mt-1">
                डिलीवरी पार्टनर को हमेशा के लिए Firebase से हटाएं
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left mt-3 space-y-1">
                <p className="text-xs text-gray-800 font-bold">
                  Name: {riderToDelete.displayName}
                </p>
                <p className="text-xs text-gray-600">
                  Contact: {riderToDelete.email || riderToDelete.phone}
                </p>
                <p className="text-[11px] text-gray-500">
                  Vehicle: {riderToDelete.vehicleType || 'Bike'} ({riderToDelete.vehicleNumber || '—'})
                </p>
                <p className="text-[11px] text-rose-600 font-semibold pt-1 border-t border-rose-200">
                  ⚠️ Warning: This will permanently delete this rider's account from Firebase Firestore. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRiderToDelete(null);
                }}
                disabled={isDeletingRider}
                className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel (रद्द करें)
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteRider}
                disabled={isDeletingRider}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                {isDeletingRider ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
