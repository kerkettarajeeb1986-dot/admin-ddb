import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  FileText,
  User,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Dispute, DisputeStatus } from '../../types';
import { disputeService } from '../../services/disputeService';
import { notificationService } from '../../services/notificationService';

interface AdminDisputeManagerProps {
  disputes: Dispute[];
}

export const AdminDisputeManager: React.FC<AdminDisputeManagerProps> = ({ disputes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [compensationAmount, setCompensationAmount] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredDisputes = disputes.filter((dispute) => {
    if (statusFilter !== 'all' && dispute.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        (dispute.subject || '').toLowerCase().includes(q) ||
        (dispute.description || '').toLowerCase().includes(q) ||
        (dispute.raisedByName || '').toLowerCase().includes(q) ||
        (dispute.orderNumber || '').toLowerCase().includes(q) ||
        (dispute.raisedByRole || dispute.raisedByType || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleUpdateStatus = async (disputeId: string, newStatus: DisputeStatus) => {
    setActionLoading(true);
    try {
      await disputeService.updateDisputeStatus(disputeId, newStatus, resolutionNotes, compensationAmount);
      setFeedback({ type: 'success', message: `Dispute status updated to ${newStatus}.` });
      if (selectedDispute?.id === disputeId) {
        setSelectedDispute({
          ...selectedDispute,
          status: newStatus,
          resolutionNotes: resolutionNotes || selectedDispute.resolutionNotes,
          compensationAmount: compensationAmount || selectedDispute.compensationAmount,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update dispute.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
              <span>Disputes & Customer Complaints</span>
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                {disputes.length} Total
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review issues raised by customers, market partners, and delivery riders with resolution workflows
            </p>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subject, user, order #..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          {['all', 'open', 'under_review', 'resolved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
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

      {/* Disputes Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredDisputes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            <ShieldAlert className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>No disputes or complaints found in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Subject & Description</th>
                  <th className="py-3 px-4">Complainant</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDisputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-gray-900">{dispute.subject}</div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{dispute.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{dispute.raisedByName}</div>
                      <div className="text-[10px] text-gray-400">{dispute.raisedByEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                        {dispute.raisedByRole || dispute.raisedByType || 'Complainant'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-gray-700">
                      {dispute.orderNumber || dispute.orderId ? (
                        <span>#{dispute.orderNumber || dispute.orderId?.slice(0, 8)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          dispute.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : dispute.status === 'rejected'
                            ? 'bg-gray-200 text-gray-700'
                            : dispute.status === 'under_review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {dispute.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setResolutionNotes(dispute.resolutionNotes || '');
                          setCompensationAmount(dispute.compensationAmount || 0);
                        }}
                        className="p-1.5 text-gray-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        title="Review and resolve dispute"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedDispute.subject}</h3>
                <p className="text-xs text-gray-500">
                  Complainant: {selectedDispute.raisedByName} ({selectedDispute.raisedByRole || selectedDispute.raisedByType || 'Complainant'})
                </p>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-bold text-gray-700 block mb-1">Detailed Description:</span>
                <p className="text-gray-600 leading-relaxed">{selectedDispute.description}</p>
              </div>

              {selectedDispute.orderNumber && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-center justify-between">
                  <span>Linked Order: #{selectedDispute.orderNumber}</span>
                  <span className="font-mono text-[11px]">ID: {selectedDispute.orderId}</span>
                </div>
              )}

              {/* Resolution Notes & Actions */}
              <div className="space-y-3 pt-2">
                <label className="block font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                  Super Admin Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter investigation outcome, vendor liability, or settlement notes..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />

                <div className="flex items-center gap-3">
                  <div className="w-1/2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Compensation / Refund Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={compensationAmount}
                      onChange={(e) => setCompensationAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="w-1/2 flex items-end">
                    <span className="text-[11px] text-gray-500">
                      Refunds are automatically processed to user's payment method.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-5 mt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedDispute.id, 'under_review')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Under Review
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedDispute.id, 'resolved')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Resolve & Close
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedDispute.id, 'rejected')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Reject Dispute
                </button>
              </div>

              <button
                onClick={() => setSelectedDispute(null)}
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
