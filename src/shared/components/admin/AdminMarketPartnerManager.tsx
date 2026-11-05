import React, { useState } from 'react';
import {
  Store,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  MapPin,
  Mail,
  Phone,
  FileText,
  CreditCard,
  Eye,
  Edit2,
  Trash2,
  ShoppingBag,
  IndianRupee,
  X,
  AlertTriangle,
  RefreshCw,
  Power,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { UserProfile, GroceryProduct, GroceryOrder, UserStatus, LocalArea } from '../../types';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';
import { productService } from '../../services/productService';
import { AdminRegisterPartnerModal } from './AdminRegisterPartnerModal';
import { DEFAULT_DOOARS_AREAS } from './AdminProductCatalogManager';

interface AdminMarketPartnerManagerProps {
  marketPartners: UserProfile[];
  products: GroceryProduct[];
  orders: GroceryOrder[];
  localAreas?: LocalArea[];
  onAddProductForPartner?: (partner: UserProfile) => void;
}

export const AdminMarketPartnerManager: React.FC<AdminMarketPartnerManagerProps> = ({
  marketPartners,
  products,
  orders,
  localAreas = [],
  onAddProductForPartner,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'rejected' | 'suspended' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<UserProfile | null>(null);
  const [isRegisterShopModalOpen, setIsRegisterShopModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [partnerToReject, setPartnerToReject] = useState<UserProfile | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Permanent Delete Partner state
  const [partnerToDelete, setPartnerToDelete] = useState<UserProfile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingPartner, setIsDeletingPartner] = useState(false);

  const handleOpenDeletePartner = (partner: UserProfile) => {
    setPartnerToDelete(partner);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeletePartner = async () => {
    if (!partnerToDelete) return;
    setIsDeletingPartner(true);
    try {
      // 1. Permanently delete all products belonging to this market partner
      const prodsToDelete = products.filter(
        (p) =>
          p.partnerId === partnerToDelete.uid ||
          (p.partnerName && p.partnerName.toLowerCase() === (partnerToDelete.storeName || '').toLowerCase())
      );
      for (const prod of prodsToDelete) {
        try {
          await productService.deleteProduct(prod.id);
        } catch (err) {
          console.warn('Could not delete associated product:', prod.id, err);
        }
      }

      // 2. Permanently delete the user document from Firestore
      await userService.deleteUser(partnerToDelete.uid);

      setFeedback({
        type: 'success',
        message: `Market Partner "${partnerToDelete.storeName || partnerToDelete.displayName}" and all associated products permanently deleted from Firebase.`,
      });
      setIsDeleteModalOpen(false);
      if (selectedPartner?.uid === partnerToDelete.uid) {
        setSelectedPartner(null);
      }
      setPartnerToDelete(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to permanently delete Market Partner.',
      });
    } finally {
      setIsDeletingPartner(false);
    }
  };

  // Tab counts
  const pendingCount = marketPartners.filter((p) => p.status === 'pending').length;
  const approvedCount = marketPartners.filter((p) => p.status === 'active').length;
  const rejectedCount = marketPartners.filter((p) => p.status === 'rejected').length;
  const suspendedCount = marketPartners.filter((p) => p.status === 'suspended').length;

  const filteredPartners = marketPartners.filter((partner) => {
    // Status tab filter
    if (activeTab !== 'all') {
      const pStatus = partner.status || 'pending';
      if (pStatus !== activeTab) return false;
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        (partner.storeName || '').toLowerCase().includes(q) ||
        (partner.displayName || '').toLowerCase().includes(q) ||
        (partner.email || '').toLowerCase().includes(q) ||
        (partner.phone || '').includes(q) ||
        (partner.localAreaName || '').toLowerCase().includes(q) ||
        (partner.category || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleApprovePartner = async (partner: UserProfile) => {
    setActionLoading(true);
    try {
      await userService.updateUserStatus(partner.uid, 'active');
      await notificationService.sendNotification(
        'new_partner_application',
        'Market Partner Approved',
        `Partner ${partner.storeName} (${partner.displayName}) has been approved for sales in ${partner.localAreaName}.`,
        'market_partners',
        partner.uid
      );
      setFeedback({ type: 'success', message: `${partner.storeName} is now APPROVED and active in Dooars Basket!` });
      if (selectedPartner?.uid === partner.uid) {
        setSelectedPartner({ ...selectedPartner, status: 'active' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Approval failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (partner: UserProfile) => {
    setPartnerToReject(partner);
    setRejectionReason('');
    setRejectionModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!partnerToReject) return;
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason for the applicant.');
      return;
    }
    setActionLoading(true);
    try {
      await userService.updateUserStatus(partnerToReject.uid, 'rejected', rejectionReason.trim());
      setFeedback({
        type: 'success',
        message: `Application for ${partnerToReject.storeName} marked as rejected.`,
      });
      setRejectionModalOpen(false);
      setPartnerToReject(null);
      if (selectedPartner?.uid === partnerToReject.uid) {
        setSelectedPartner({ ...selectedPartner, status: 'rejected', rejectionReason: rejectionReason.trim() });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Rejection update failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = async (partner: UserProfile) => {
    const newStatus: UserStatus = partner.status === 'suspended' ? 'active' : 'suspended';
    setActionLoading(true);
    try {
      await userService.updateUserStatus(partner.uid, newStatus);
      setFeedback({
        type: 'success',
        message: `${partner.storeName} status changed to ${newStatus}.`,
      });
      if (selectedPartner?.uid === partner.uid) {
        setSelectedPartner({ ...selectedPartner, status: newStatus });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Associated products and orders for selected partner
  const partnerProducts = selectedPartner
    ? products.filter((p) => p.partnerId === selectedPartner.uid)
    : [];

  const partnerOrders = selectedPartner
    ? orders.filter((o) => o.marketPartnerId === selectedPartner.uid)
    : [];

  const partnerGrossVolume = partnerOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const estimatedPartnerEarnings = Math.round(partnerGrossVolume * 0.85);

  return (
    <div className="space-y-5">
      {/* Header & Status Tabs */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-700" />
              <span>Market Partner Management</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {marketPartners.length} Total
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review new store applications, approve merchants, track products & manage local vendor status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search store, owner, area, FSSAI..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Register New Shop Button */}
            <button
              type="button"
              onClick={() => setIsRegisterShopModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Shop (नया दुकान जोड़ें)</span>
            </button>
          </div>
        </div>

        {/* Status Nav Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
            <span className="bg-amber-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'active'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approved Partners</span>
            <span className="bg-emerald-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
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
            All Partners ({marketPartners.length})
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

      {/* Partner Table / Cards */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredPartners.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>No market partners in the "{activeTab}" category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Store & Proprietor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Local Area & Address</th>
                  <th className="py-3 px-4">FSSAI / Reg</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Store Open</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPartners.map((partner) => {
                  const status = partner.status || 'pending';

                  return (
                    <tr key={partner.uid} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 text-sm">{partner.storeName || 'Store'}</div>
                        <div className="text-[11px] text-gray-500 font-medium">Owner: {partner.displayName}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {partner.phone || partner.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium text-[11px]">
                          {partner.category || 'Grocery'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{partner.localAreaName || 'Not Assigned'}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[180px] mt-0.5">
                          {partner.address || '—'} (PIN: {partner.pinCode || '—'})
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-gray-700">
                          {partner.fssaiNumber || 'Pending verification'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            partner.isOnline !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {partner.isOnline !== false ? '🟢 Online' : '⚪ Offline'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onAddProductForPartner && (
                            <button
                              onClick={() => onAddProductForPartner(partner)}
                              className="px-2 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Add Product for this Shop (इस दुकान के लिए सामान जोड़ें)"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="hidden sm:inline">Add Item</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedPartner(partner)}
                            className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                            title="View Full Application & Documents"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprovePartner(partner)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-bold shadow-xs transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenReject(partner)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-[11px] font-bold transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {status === 'active' && (
                            <button
                              onClick={() => handleToggleSuspend(partner)}
                              disabled={actionLoading}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition cursor-pointer"
                              title="Suspend Store"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {status === 'suspended' && (
                            <button
                              onClick={() => handleToggleSuspend(partner)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-md text-[11px] font-bold transition cursor-pointer"
                            >
                              Re-activate
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenDeletePartner(partner)}
                            disabled={actionLoading || isDeletingPartner}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Permanently Delete Partner from Firebase (मार्केट पार्टनर हटाएं)"
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

      {/* Rejection Reason Modal */}
      {rejectionModalOpen && partnerToReject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Reject Partner Application: {partnerToReject.storeName}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Please enter the official reason for rejecting this merchant application (e.g. invalid FSSAI, non-serviceable address).
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

      {/* Full Partner Profile & Documents Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-gray-200">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedPartner.storeName}</h3>
                <p className="text-xs text-gray-500">
                  Owner: {selectedPartner.displayName} · Operational Zone: {selectedPartner.localAreaName}
                </p>
              </div>
              <button
                onClick={() => setSelectedPartner(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500">Status</span>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${
                      selectedPartner.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedPartner.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedPartner.status || 'pending'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500">Category</span>
                <div className="text-xs font-semibold text-gray-900 mt-1">{selectedPartner.category || 'Grocery'}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500">FSSAI License</span>
                <div className="text-xs font-mono text-gray-900 mt-1">{selectedPartner.fssaiNumber || 'Pending'}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-500">Estimated Earnings</span>
                <div className="text-xs font-bold text-emerald-700 mt-1">₹{estimatedPartnerEarnings}</div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs mb-5">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bank & Payout Settlement Details</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <div>
                  <span className="text-gray-400">UPI ID:</span>{' '}
                  <span className="font-mono font-medium text-gray-800">
                    {selectedPartner.bankDetails?.upiId || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Account / IFSC:</span>{' '}
                  <span className="font-mono font-medium text-gray-800">
                    {selectedPartner.bankDetails?.accountNumber || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rejection notice if present */}
            {selectedPartner.status === 'rejected' && selectedPartner.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 mb-5">
                <span className="font-bold block">Rejection Reason:</span>
                <p className="mt-0.5">{selectedPartner.rejectionReason}</p>
              </div>
            )}

            {/* Partner's Listed Products */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Grocery Catalog ({partnerProducts.length} Items)
                </h4>
                {onAddProductForPartner && (
                  <button
                    onClick={() => {
                      const p = selectedPartner;
                      setSelectedPartner(null);
                      onAddProductForPartner(p);
                    }}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product for this Store</span>
                  </button>
                )}
              </div>

              {partnerProducts.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-lg text-center text-xs text-gray-400">
                  No products uploaded by this partner yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {partnerProducts.map((p) => (
                    <div key={p.id} className="p-2.5 border border-gray-200 rounded-xl text-xs bg-white flex items-center justify-between shadow-2xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-gray-900 truncate">{p.name}</div>
                        <div className="text-emerald-700 font-bold mt-0.5">₹{p.price} / {p.unit}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await productService.toggleAvailability(p.id, !p.isAvailable);
                            } catch (e: any) {
                              setFeedback({ type: 'error', message: e.message || 'Failed to update stock.' });
                            }
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            p.isAvailable ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {p.isAvailable ? 'In Stock' : 'Out'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await productService.deleteProduct(p.id);
                              setFeedback({ type: 'success', message: `Deleted "${p.name}".` });
                            } catch (e: any) {
                              setFeedback({ type: 'error', message: e.message || 'Failed to delete.' });
                            }
                          }}
                          title="Delete Product"
                          className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-md transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedPartner.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprovePartner(selectedPartner)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer"
                    >
                      Approve Partner
                    </button>
                    <button
                      onClick={() => handleOpenReject(selectedPartner)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Reject Application
                    </button>
                  </>
                )}
                {selectedPartner.status === 'active' && (
                  <button
                    onClick={() => handleToggleSuspend(selectedPartner)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Suspend Store
                  </button>
                )}
                {selectedPartner.status === 'suspended' && (
                  <button
                    onClick={() => handleToggleSuspend(selectedPartner)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Re-activate Store
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenDeletePartner(selectedPartner)}
                  disabled={actionLoading || isDeletingPartner}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Partner (दुकानदार हमेशा के लिए हटाएं)</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedPartner(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Market Partner Confirmation Modal */}
      {isDeleteModalOpen && partnerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">
                Permanently Delete Market Partner?
              </h3>
              <p className="text-xs text-rose-700 font-medium mt-1">
                मार्केट पार्टनर को हमेशा के लिए Firebase से हटाएं
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left mt-3 space-y-1">
                <p className="text-xs text-gray-800 font-bold">
                  Shop: {partnerToDelete.storeName || 'Store'}
                </p>
                <p className="text-xs text-gray-600">
                  Owner: {partnerToDelete.displayName} ({partnerToDelete.email || partnerToDelete.phone})
                </p>
                <p className="text-[11px] text-gray-500">
                  Area: {partnerToDelete.localAreaName || 'Dooars Region'}
                </p>
                <p className="text-[11px] text-rose-600 font-semibold pt-1 border-t border-rose-200">
                  ⚠️ Warning: This will permanently delete this partner's profile and all their listed grocery products from Firebase Firestore. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setPartnerToDelete(null);
                }}
                disabled={isDeletingPartner}
                className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel (रद्द करें)
              </button>

              <button
                type="button"
                onClick={handleConfirmDeletePartner}
                disabled={isDeletingPartner}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                {isDeletingPartner ? (
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

      {/* Register New Shop / Partner Modal */}
      <AdminRegisterPartnerModal
        isOpen={isRegisterShopModalOpen}
        onClose={() => setIsRegisterShopModalOpen(false)}
        localAreas={localAreas.length > 0 ? localAreas : DEFAULT_DOOARS_AREAS}
        onPartnerRegistered={(newPartner) => {
          setFeedback({
            type: 'success',
            message: `Shop "${newPartner.storeName}" (${newPartner.displayName}) registered and activated successfully!`,
          });
          if (onAddProductForPartner) {
            // Optional: offer or auto-open
          }
        }}
      />
    </div>
  );
};
