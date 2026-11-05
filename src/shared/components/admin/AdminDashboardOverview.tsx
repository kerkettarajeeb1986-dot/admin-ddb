import React from 'react';
import {
  Users,
  Store,
  Bike,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  MapPin,
  ArrowRight,
  ShieldAlert,
  Wallet,
  Truck,
  CheckCircle2,
  QrCode,
  Settings,
  Building2,
} from 'lucide-react';
import { UserProfile, GroceryOrder, Dispute, LocalArea } from '../../types';

interface AdminDashboardOverviewProps {
  customers: UserProfile[];
  marketPartners: UserProfile[];
  deliveryPartners: UserProfile[];
  orders: GroceryOrder[];
  disputes: Dispute[];
  localAreas: LocalArea[];
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  customers = [],
  marketPartners = [],
  deliveryPartners = [],
  orders = [],
  disputes = [],
  localAreas = [],
  onNavigateTab,
}) => {
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeMarketPartners = Array.isArray(marketPartners) ? marketPartners : [];
  const safeDeliveryPartners = Array.isArray(deliveryPartners) ? deliveryPartners : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeDisputes = Array.isArray(disputes) ? disputes : [];
  const safeLocalAreas = Array.isArray(localAreas) ? localAreas : [];

  // Calculations
  const totalCustomers = safeCustomers.length;
  // new customers within last 7 days or total if small
  const newCustomers = safeCustomers.filter((c) => {
    if (!c.createdAt) return true;
    try {
      const date = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      const diff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    } catch {
      return true;
    }
  }).length;

  const totalMarketPartners = safeMarketPartners.length;
  const pendingMarketPartners = safeMarketPartners.filter((p) => (p.status || 'pending') === 'pending').length;
  const onlineMarketPartners = safeMarketPartners.filter((p) => p.status === 'active' && p.isOnline !== false).length;

  const totalDeliveryPartners = safeDeliveryPartners.length;
  const pendingDeliveryPartners = safeDeliveryPartners.filter((d) => (d.status || 'pending') === 'pending').length;
  const activeDeliveryRiders = safeDeliveryPartners.filter((d) => d.status === 'active' && d.isAvailable !== false).length;

  const activeOrders = safeOrders.filter((o) =>
    ['pending', 'confirmed', 'packing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status || 'pending')
  ).length;

  const completedOrders = safeOrders.filter((o) => (o.status || '') === 'delivered').length;
  const cancelledOrders = safeOrders.filter((o) => (o.status || '') === 'cancelled').length;

  const pendingPayments = safeOrders.filter((o) => (o.paymentStatus || 'pending') === 'pending').length;
  const codOrders = safeOrders.filter((o) => Boolean(o.isCOD)).length;

  const openDisputes = safeDisputes.filter((d) => (d.status || 'open') === 'open' || d.status === 'under_review').length;

  // Financial calculations
  const totalGrossOrderVolume = safeOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Delivery earnings estimate (e.g. delivery fee collected)
  const totalDeliveryFees = safeOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

  // Partner payout estimate (~85% of item totals)
  const totalPartnerEarnings = safeOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + Math.max(0, (o.totalAmount || 0) - (o.deliveryFee || 0)) * 0.85, 0);

  // Admin platform commission (~15% platform fee)
  const adminRevenue = safeOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + Math.max(0, (o.totalAmount || 0) - (o.deliveryFee || 0)) * 0.15, 0);

  const activeAreasCount = safeLocalAreas.filter((a) => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Platform Attention Banner if pending approvals or disputes */}
      {(pendingMarketPartners > 0 || pendingDeliveryPartners > 0 || openDisputes > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Action Required by Super Admin</h4>
              <p className="text-xs text-amber-700">
                You have{' '}
                <span className="font-bold">{pendingMarketPartners} pending partner</span>,{' '}
                <span className="font-bold">{pendingDeliveryPartners} pending rider applications</span>, and{' '}
                <span className="font-bold">{openDisputes} active dispute(s)</span> requiring review.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingMarketPartners > 0 && (
              <button
                onClick={() => onNavigateTab('market_partners')}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Review Partners ({pendingMarketPartners})
              </button>
            )}
            {pendingDeliveryPartners > 0 && (
              <button
                onClick={() => onNavigateTab('delivery_partners')}
                className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Review Riders ({pendingDeliveryPartners})
              </button>
            )}
            {openDisputes > 0 && (
              <button
                onClick={() => onNavigateTab('disputes')}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                View Disputes ({openDisputes})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Rate & Payment Configuration Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delivery & Packaging Rates Shortcut */}
        <div
          onClick={() => onNavigateTab('shipping')}
          className="bg-white border-2 border-emerald-500/20 hover:border-emerald-500 rounded-2xl p-4 shadow-xs transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900">Delivery & Packaging Rates</h4>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ₹40 + ₹15/km
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Change Base Delivery Fee, Per KM rate, and Packaging fees anytime.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 bg-emerald-700 group-hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ml-2"
          >
            <span>Edit Rates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* UPI QR Code & Payment Setup Shortcut */}
        <div
          onClick={() => onNavigateTab('upi_qr')}
          className="bg-white border-2 border-emerald-500/30 hover:border-emerald-500 rounded-2xl p-4 shadow-xs transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900">Fix UPI QR Code (फिक्स क्यूआर कोड)</h4>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  📌 Fix QR Code
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                राशि फिक्स नहीं रहेगी — क्यूआर कोड फिक्स रहेगा। ग्राहक स्कैन करके अपना आर्डर अमाउंट खुद भरेगा।
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 bg-emerald-700 group-hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ml-2"
          >
            <span>क्यूआर सेटिंग्स</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Business Settings & Profile Shortcut */}
        <div
          onClick={() => onNavigateTab('business_settings')}
          className="bg-white border-2 border-emerald-500/30 hover:border-emerald-500 rounded-2xl p-4 shadow-xs transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900">Business Settings (बिजनेस सेटिंग्स)</h4>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Firebase Live
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Business Name, Logo, Office Address, WhatsApp Support (9609882564), Email, Policies & Hours.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 bg-emerald-700 group-hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ml-2"
          >
            <span>बिजनेस सेटिंग्स</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (16 Real-Time Summary Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Real-Time Operations & Metrics
          </h3>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ● Live Firebase Sync
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {/* 1. Total Customers */}
          <div
            onClick={() => onNavigateTab('customers')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-emerald-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Total Customers</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900">{totalCustomers}</span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                +{newCustomers} this week
              </span>
            </div>
          </div>

          {/* 2. New Customer Registrations */}
          <div
            onClick={() => onNavigateTab('customers')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-emerald-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">New Registrations</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-100 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-gray-900">{newCustomers}</span>
              <span className="text-[11px] text-gray-400 ml-1.5">recent customers</span>
            </div>
          </div>

          {/* 3. Total Market Partners */}
          <div
            onClick={() => onNavigateTab('market_partners')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-emerald-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Market Partners</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-100 transition">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900">{totalMarketPartners}</span>
              <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                {onlineMarketPartners} Online
              </span>
            </div>
          </div>

          {/* 4. Pending Partner Approvals */}
          <div
            onClick={() => onNavigateTab('market_partners')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-amber-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Pending Partners</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{pendingMarketPartners}</span>
              <span className="text-[11px] text-amber-700 font-medium">awaiting review</span>
            </div>
          </div>

          {/* 5. Total Delivery Partners */}
          <div
            onClick={() => onNavigateTab('delivery_partners')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-indigo-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Delivery Fleet</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-100 transition">
                <Bike className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900">{totalDeliveryPartners}</span>
              <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                {activeDeliveryRiders} Available
              </span>
            </div>
          </div>

          {/* 6. Pending Delivery Approvals */}
          <div
            onClick={() => onNavigateTab('delivery_partners')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-indigo-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Pending Riders</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-100 transition">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-purple-700">{pendingDeliveryPartners}</span>
              <span className="text-[11px] text-purple-700 font-medium ml-1.5">applications</span>
            </div>
          </div>

          {/* 7. Online / Offline Partners */}
          <div
            onClick={() => onNavigateTab('market_partners')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-emerald-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Active Stores</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-800">{onlineMarketPartners}</span>
              <span className="text-[11px] text-gray-400 ml-1.5">open in local areas</span>
            </div>
          </div>

          {/* 8. Active Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-amber-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Active Live Orders</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{activeOrders}</span>
              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                in transit / prep
              </span>
            </div>
          </div>

          {/* 9. Completed Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-emerald-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Delivered Orders</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-gray-900">{completedOrders}</span>
              <span className="text-[11px] text-emerald-700 font-medium ml-1.5">fulfilled</span>
            </div>
          </div>

          {/* 10. Cancelled Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-rose-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Cancelled Orders</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-rose-700">{cancelledOrders}</span>
              <span className="text-[11px] text-rose-700 font-medium ml-1.5">cancelled</span>
            </div>
          </div>

          {/* 11. Pending Payments */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-amber-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Pending Payments</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-amber-700">{pendingPayments}</span>
              <span className="text-[11px] text-gray-400 ml-1.5">unsettled</span>
            </div>
          </div>

          {/* 12. COD Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-blue-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">COD Orders</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-gray-900">{codOrders}</span>
              <span className="text-[11px] text-blue-700 font-medium ml-1.5">cash collected</span>
            </div>
          </div>

          {/* 13. Disputes & Complaints */}
          <div
            onClick={() => onNavigateTab('disputes')}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-rose-500 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Disputes & Complaints</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700">{openDisputes}</span>
              <span className="text-[11px] text-gray-400 font-medium">({disputes.length} total)</span>
            </div>
          </div>

          {/* 14. Partner Earnings */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Partner Earnings</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-gray-900">₹{Math.round(totalPartnerEarnings).toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-gray-400 block mt-0.5">85% store payout pool</span>
            </div>
          </div>

          {/* 15. Delivery Fleet Earnings */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Rider Payouts</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-gray-900">₹{Math.round(totalDeliveryFees).toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-gray-400 block mt-0.5">delivery fee distributions</span>
            </div>
          </div>

          {/* 16. Admin Platform Revenue */}
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-4 rounded-xl text-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Admin Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-700/50 text-white flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-white">₹{Math.round(adminRevenue).toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-emerald-200 block mt-0.5">GMV: ₹{Math.round(totalGrossOrderVolume).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Highlights Split: Recent Live Orders & Active Service Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders in Transit / Placed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Recent Live Orders</h4>
              <p className="text-xs text-gray-500">Live order flow across Dooars local zones</p>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all orders <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {safeOrders.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600">No customer orders placed yet</p>
              <p className="text-[11px] text-gray-400 mt-1">Orders placed by customers will stream here in real time.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {safeOrders.slice(0, 5).map((order) => {
                const ordStatus = order.status || 'pending';
                return (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{order.orderNumber || order.id?.slice(0, 8) || 'Order'}</span>
                        <span className="text-gray-400">·</span>
                        <span className="font-semibold text-gray-700 truncate">{order.customerName || 'Customer'}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                          {order.localAreaName || 'Zone'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                        {order.items?.length || 0} item(s) · {order.isCOD ? '💵 Cash on Delivery' : '💳 Online Payment'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-gray-900">₹{order.totalAmount || 0}</div>
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full capitalize mt-0.5 ${
                          ordStatus === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ordStatus === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : ordStatus === 'out_for_delivery'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ordStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Local Service Areas Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Active Service Zones</h4>
                <p className="text-xs text-gray-500">{activeAreasCount} of {safeLocalAreas.length} zones active</p>
              </div>
              <button
                onClick={() => onNavigateTab('local_areas')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {safeLocalAreas.slice(0, 5).map((area) => (
                <div
                  key={area.id}
                  className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-gray-800">{area.name || 'Local Zone'}</span>
                      <span className="text-[10px] text-gray-500 block">
                        {area.district || 'West Bengal'} · PINs: {Array.isArray(area.pinCodes) ? area.pinCodes.join(', ') : (area.pinCodes || '—')}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${
                      area.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {area.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => onNavigateTab('local_areas')}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition text-center cursor-pointer"
            >
              Configure Dooars Delivery Zones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
