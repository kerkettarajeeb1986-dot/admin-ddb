import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  MapPin,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
  X,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, GroceryOrder, Dispute, UserStatus } from '../../types';
import { userService } from '../../services/userService';

interface AdminCustomerManagerProps {
  customers: UserProfile[];
  orders: GroceryOrder[];
  disputes: Dispute[];
}

export const AdminCustomerManager: React.FC<AdminCustomerManagerProps> = ({
  customers,
  orders,
  disputes,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [localAreaFilter, setLocalAreaFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Distinct local areas among customers
  const localAreas = Array.from(
    new Set(customers.map((c) => c.localAreaName).filter(Boolean))
  ) as string[];

  // Filtered customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      (customer.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || '').includes(searchTerm) ||
      (customer.localAreaName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesArea = localAreaFilter === 'all' || customer.localAreaName === localAreaFilter;

    return matchesSearch && matchesStatus && matchesArea;
  });

  const handleToggleStatus = async (customer: UserProfile) => {
    const newStatus: UserStatus = customer.status === 'active' ? 'suspended' : 'active';
    setActionLoading(true);
    try {
      await userService.updateUserStatus(customer.uid, newStatus);
      setFeedback({
        type: 'success',
        message: `Customer ${customer.displayName || customer.email} is now ${newStatus}.`,
      });
      if (selectedCustomer?.uid === customer.uid) {
        setSelectedCustomer({ ...selectedCustomer, status: newStatus });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Status update failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (customer: UserProfile) => {
    setEditFormData({
      displayName: customer.displayName,
      phone: customer.phone,
      address: customer.address,
      pinCode: customer.pinCode,
      status: customer.status,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;
    setActionLoading(true);
    try {
      await userService.updateUserProfile(selectedCustomer.uid, editFormData);
      setFeedback({ type: 'success', message: 'Customer profile updated successfully.' });
      setSelectedCustomer({ ...selectedCustomer, ...editFormData });
      setIsEditing(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update customer.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCustomer = async (uid: string) => {
    setActionLoading(true);
    try {
      await userService.deleteUser(uid);
      setFeedback({ type: 'success', message: 'Customer record removed.' });
      setSelectedCustomer(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete customer.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Stats for selected customer
  const customerOrders = selectedCustomer
    ? orders.filter((o) => o.customerId === selectedCustomer.uid || o.customerEmail === selectedCustomer.email)
    : [];

  const customerDisputes = selectedCustomer
    ? disputes.filter((d) => d.raisedById === selectedCustomer.uid || d.raisedByEmail === selectedCustomer.email)
    : [];

  const totalSpent = customerOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <span>Customer Management</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {filteredCustomers.length} Total
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Registered customer accounts streaming directly from Firebase in real time
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, phone, email..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Area Filter */}
          <select
            value={localAreaFilter}
            onChange={(e) => setLocalAreaFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 focus:outline-none"
          >
            <option value="all">All Local Areas</option>
            {localAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
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

      {/* Customer List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">No customers found</p>
            <p className="text-xs text-gray-400 mt-1">Real registered customer accounts will appear here automatically.</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>No customers match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Local Area & PIN</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const regDate = customer.createdAt?.toDate
                    ? customer.createdAt.toDate().toLocaleDateString('en-IN')
                    : customer.createdAt
                    ? new Date(customer.createdAt).toLocaleDateString('en-IN')
                    : 'Recent';

                  return (
                    <tr key={customer.uid} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{customer.displayName || 'Customer'}</div>
                        <div className="text-[11px] text-gray-400 font-mono">UID: {customer.uid.slice(0, 10)}...</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{customer.localAreaName || 'Not selected'}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {customer.district ? `${customer.district}, ` : ''}PIN: {customer.pinCode || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            customer.status === 'active' || !customer.status
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {customer.status === 'active' || !customer.status ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {customer.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{regDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                            title="View Full Profile & Order History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(customer)}
                            disabled={actionLoading}
                            className={`p-1.5 rounded-md transition cursor-pointer ${
                              customer.status === 'active' || !customer.status
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={customer.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                          >
                            {customer.status === 'active' || !customer.status ? (
                              <ShieldAlert className="w-4 h-4" />
                            ) : (
                              <ShieldCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.uid)}
                            disabled={actionLoading}
                            className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="Remove Record"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Customer Profile & Activity Modal / Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.displayName}</h3>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${
                      selectedCustomer.status === 'active' || !selectedCustomer.status
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedCustomer.status || 'active'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Customer UID: {selectedCustomer.uid}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setIsEditing(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview or Edit Form */}
            {isEditing ? (
              <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Edit Allowed Profile Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editFormData.displayName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Delivery Address</label>
                    <input
                      type="text"
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={editFormData.pinCode || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, pinCode: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Account Status</label>
                    <select
                      value={editFormData.status || 'active'}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as UserStatus })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Email</span>
                  <div className="text-xs font-semibold text-gray-900 mt-1 truncate">{selectedCustomer.email}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Phone</span>
                  <div className="text-xs font-semibold text-gray-900 mt-1">{selectedCustomer.phone || '—'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Local Area</span>
                  <div className="text-xs font-semibold text-gray-900 mt-1">{selectedCustomer.localAreaName || '—'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Total Spent</span>
                  <div className="text-xs font-bold text-emerald-700 mt-1">₹{totalSpent}</div>
                </div>
              </div>
            )}

            {/* Address Banner */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs mb-6 flex items-start justify-between">
              <div>
                <span className="font-bold text-gray-700 block">Registered Shipping Address:</span>
                <span className="text-gray-600 mt-0.5 block">
                  {selectedCustomer.address || 'No specific street address provided'} · PIN: {selectedCustomer.pinCode || '—'}
                </span>
              </div>
              {!isEditing && (
                <button
                  onClick={() => handleOpenEdit(selectedCustomer)}
                  className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Details
                </button>
              )}
            </div>

            {/* Customer Orders History */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Order History ({customerOrders.length})</span>
                <span className="text-[11px] text-gray-400 font-normal">Active & delivered baskets</span>
              </h4>

              {customerOrders.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-center text-xs text-gray-400">
                  No orders placed yet by this customer.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 rounded-lg border border-gray-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-900">{order.orderNumber || order.id.slice(0, 8)}</div>
                        <div className="text-[11px] text-gray-500">
                          {order.items?.length || 0} item(s) · {order.isCOD ? 'COD' : 'Online'} · ₹{order.totalAmount}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${
                          order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Disputes & Complaints */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Customer Complaints / Disputes ({customerDisputes.length})
              </h4>
              {customerDisputes.length === 0 ? (
                <div className="p-3 bg-emerald-50/50 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No complaints or disputes lodged by this customer. Perfect standing.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {customerDisputes.map((dispute) => (
                    <div key={dispute.id} className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900">{dispute.subject}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-rose-800 capitalize">
                          {dispute.status}
                        </span>
                      </div>
                      <p className="text-rose-700 text-[11px] mt-1">{dispute.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => handleToggleStatus(selectedCustomer)}
                disabled={actionLoading}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  selectedCustomer.status === 'active' || !selectedCustomer.status
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                }`}
              >
                {selectedCustomer.status === 'active' || !selectedCustomer.status
                  ? 'Suspend Customer Account'
                  : 'Re-activate Customer Account'}
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
