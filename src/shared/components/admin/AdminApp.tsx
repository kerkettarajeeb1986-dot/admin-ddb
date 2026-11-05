import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  ShoppingBag,
  Package,
  ShieldAlert,
  MapPin,
  TrendingUp,
  CreditCard,
  Truck,
  Percent,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Search,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  QrCode,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SuperAdminRoleGuard } from '../../../guards/SuperAdminRoleGuard';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminProductCatalogManager } from './AdminProductCatalogManager';
import { AdminCustomerManager } from './AdminCustomerManager';
import { AdminMarketPartnerManager } from './AdminMarketPartnerManager';
import { AdminDeliveryPartnerManager } from './AdminDeliveryPartnerManager';
import { AdminOrderManager } from './AdminOrderManager';
import { AdminDisputeManager } from './AdminDisputeManager';
import { AdminNotificationCenter } from './AdminNotificationCenter';
import { AdminServiceAreaManager } from './AdminServiceAreaManager';
import { AdminRevenueDashboard } from './AdminRevenueDashboard';
import { AdminMarketPayoutsView } from './AdminMarketPayoutsView';
import { AdminWeeklyPayoutsView } from './AdminWeeklyPayoutsView';
import { AdminGroceryShippingManager } from './AdminGroceryShippingManager';
import { AdminUpiQrManager } from './AdminUpiQrManager';
import { CommissionPayoutSettings } from './CommissionPayoutSettings';
import { MasterSettingsManager } from './MasterSettingsManager';
import { AdminBusinessSettingsManager } from './AdminBusinessSettingsManager';

import { userService } from '../../services/userService';
import { orderService } from '../../services/orderService';
import { disputeService } from '../../services/disputeService';
import { notificationService } from '../../services/notificationService';
import { serviceAreaService } from '../../services/serviceAreaService';
import { productService } from '../../services/productService';
import { UserProfile, GroceryOrder, Dispute, AdminNotification, LocalArea, GroceryProduct } from '../../types';

export type AdminTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'market_partners'
  | 'delivery_partners'
  | 'customers'
  | 'local_areas'
  | 'disputes'
  | 'revenue'
  | 'market_payouts'
  | 'delivery_payouts'
  | 'shipping'
  | 'upi_qr'
  | 'commissions'
  | 'business_settings'
  | 'settings';

export const pathToAdminTab = (pathname: string): AdminTab => {
  if (pathname === '/admin' || pathname === '/admin/dashboard') return 'overview';
  if (pathname.startsWith('/admin/products') || pathname.startsWith('/admin/catalog') || pathname.startsWith('/admin/items') || pathname.startsWith('/admin/categories')) return 'products';
  if (pathname.startsWith('/admin/customers')) return 'customers';
  if (pathname.startsWith('/admin/market-partners')) return 'market_partners';
  if (pathname.startsWith('/admin/delivery-partners')) return 'delivery_partners';
  if (pathname.startsWith('/admin/orders')) return 'orders';
  if (pathname.startsWith('/admin/upi') || pathname.startsWith('/admin/qr')) return 'upi_qr';
  if (pathname.startsWith('/admin/local-areas')) return 'local_areas';
  if (pathname.startsWith('/admin/disputes')) return 'disputes';
  if (pathname.startsWith('/admin/shipping')) return 'shipping';
  if (pathname.startsWith('/admin/commissions')) return 'commissions';
  if (pathname.startsWith('/admin/payments')) return 'market_payouts';
  if (pathname.startsWith('/admin/reports')) return 'revenue';
  if (pathname.startsWith('/admin/business')) return 'business_settings';
  if (pathname.startsWith('/admin/settings')) return 'settings';
  return 'overview';
};

const adminTabToPath: Record<AdminTab, string> = {
  overview: '/admin/dashboard',
  products: '/admin/products',
  orders: '/admin/orders',
  market_partners: '/admin/market-partners',
  delivery_partners: '/admin/delivery-partners',
  customers: '/admin/customers',
  local_areas: '/admin/local-areas',
  disputes: '/admin/disputes',
  revenue: '/admin/reports',
  market_payouts: '/admin/payments',
  delivery_payouts: '/admin/payments',
  shipping: '/admin/shipping',
  upi_qr: '/admin/upi-qr',
  commissions: '/admin/commissions',
  business_settings: '/admin/business-settings',
  settings: '/admin/settings',
};

export const AdminApp: React.FC = () => {
  const { userProfile, logoutAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(() => pathToAdminTab(window.location.pathname));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Synchronize tab changes with URL path
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    const targetPath = adminTabToPath[tab] || '/admin/dashboard';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(pathToAdminTab(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Real-time State from Firebase
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<GroceryOrder[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [localAreas, setLocalAreas] = useState<LocalArea[]>([]);
  const [products, setProducts] = useState<GroceryProduct[]>([]);
  const [preselectedPartner, setPreselectedPartner] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firestore Subscriptions
  useEffect(() => {
    setIsLoading(true);

    const unsubUsers = userService.subscribeToAllUsers((usersList) => {
      setAllUsers(usersList);
      setIsLoading(false);
    });

    const unsubOrders = orderService.subscribeToOrders({}, (ordersList) => {
      setOrders(ordersList);
    });

    const unsubDisputes = disputeService.subscribeToAllDisputes((disputesList) => {
      setDisputes(disputesList);
    });

    const unsubNotifs = notificationService.subscribeToAdminNotifications((notifsList) => {
      setNotifications(notifsList);
    });

    const unsubAreas = serviceAreaService.subscribeToLocalAreas((areasList) => {
      setLocalAreas(areasList);
    });

    const unsubProducts = productService.subscribeToProducts(undefined, (prods) => {
      setProducts(prods);
    });

    return () => {
      unsubUsers();
      unsubOrders();
      unsubDisputes();
      unsubNotifs();
      unsubAreas();
      unsubProducts();
    };
  }, []);

  // Categorize Users (case-tolerant & robust against uppercase roles like DELIVERY_BOY or ADMIN)
  const customers = allUsers.filter((u) => (u.role || '').toLowerCase() === 'customer');
  const marketPartners = allUsers.filter(
    (u) =>
      (u.role || '').toLowerCase() === 'market_partner' ||
      (u.role || '').toLowerCase() === 'partner' ||
      (u.role || '').toLowerCase() === 'seller' ||
      Boolean(u.storeName) ||
      Boolean((u as any).marketPartnerName)
  );
  const deliveryPartners = allUsers.filter(
    (u) =>
      (u.role || '').toLowerCase() === 'delivery_partner' ||
      (u.role || '').toLowerCase() === 'delivery_boy'
  );

  // Badges & Counts
  const pendingPartners = marketPartners.filter((p) => p.status === 'pending').length;
  const pendingRiders = deliveryPartners.filter((d) => d.status === 'pending').length;
  const openDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length;
  const activeOrdersCount = orders.filter((o) =>
    ['pending', 'confirmed', 'packing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status)
  ).length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const navigationGroups = [
    {
      group: 'Core Operations',
      items: [
        {
          id: 'overview' as AdminTab,
          name: 'Dashboard Overview',
          icon: LayoutDashboard,
        },
        {
          id: 'products' as AdminTab,
          name: 'Grocery Catalog & Stock (सामान)',
          icon: Package,
          badge: products.length > 0 ? `${products.length} Live` : 'Add Items',
          badgeColor: 'bg-emerald-600',
        },
        {
          id: 'orders' as AdminTab,
          name: 'Orders & Deliveries',
          icon: ShoppingBag,
          badge: activeOrdersCount > 0 ? `${activeOrdersCount} Live` : undefined,
          badgeColor: 'bg-amber-600',
        },
        {
          id: 'market_partners' as AdminTab,
          name: 'Market Partners',
          icon: Store,
          badge: pendingPartners > 0 ? `${pendingPartners} New` : undefined,
          badgeColor: 'bg-blue-600',
        },
        {
          id: 'delivery_partners' as AdminTab,
          name: 'Delivery Fleet / Riders',
          icon: Bike,
          badge: pendingRiders > 0 ? `${pendingRiders} New` : undefined,
          badgeColor: 'bg-indigo-600',
        },
        {
          id: 'customers' as AdminTab,
          name: 'Customers',
          icon: Users,
          count: customers.length,
        },
        {
          id: 'local_areas' as AdminTab,
          name: 'Local Service Areas',
          icon: MapPin,
          badge: `${localAreas.filter((a) => a.status === 'active').length} Active`,
          badgeColor: 'bg-emerald-700',
        },
        {
          id: 'disputes' as AdminTab,
          name: 'Disputes & Complaints',
          icon: ShieldAlert,
          badge: openDisputes > 0 ? `${openDisputes} Open` : undefined,
          badgeColor: 'bg-rose-600',
        },
      ],
    },
    {
      group: 'Finance & Logistics',
      items: [
        {
          id: 'revenue' as AdminTab,
          name: 'Revenue & Operations',
          icon: TrendingUp,
        },
        {
          id: 'market_payouts' as AdminTab,
          name: 'Market Partner Payouts',
          icon: CreditCard,
        },
        {
          id: 'delivery_payouts' as AdminTab,
          name: 'Delivery Fleet Payouts',
          icon: Truck,
        },
        {
          id: 'shipping' as AdminTab,
          name: 'Delivery & Packaging Rates',
          icon: Truck,
        },
        {
          id: 'upi_qr' as AdminTab,
          name: 'Fix UPI QR Code (फिक्स क्यूआर कोड)',
          icon: QrCode,
          badge: '📌 Fix QR',
          badgeColor: 'bg-emerald-600',
        },
        {
          id: 'commissions' as AdminTab,
          name: 'Commission Structure',
          icon: Percent,
        },
        {
          id: 'business_settings' as AdminTab,
          name: 'Business Settings (बिजनेस सेटिंग्स)',
          icon: Building2,
          badge: 'Live',
          badgeColor: 'bg-emerald-600',
        },
        {
          id: 'settings' as AdminTab,
          name: 'Master Settings',
          icon: Settings,
        },
      ],
    },
  ];

  const handleNavigateFromComponent = (tab: string) => {
    setActiveTab(tab as AdminTab);
  };

  return (
    <SuperAdminRoleGuard>
      <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row text-gray-900 font-sans">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-emerald-950 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Dooars Daily Basket"
              className="w-8 h-8 object-contain rounded-full border border-emerald-400 bg-white"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xs font-black uppercase tracking-wider text-white">Dooars Daily Basket</h1>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Super Admin Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={logoutAdmin}
              title="Logout"
              className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-black uppercase flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-2 text-white/80 hover:text-white rounded-lg bg-emerald-900/60"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold rounded-full flex items-center justify-center text-white">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white rounded-lg bg-emerald-900"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Brand header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md border-2 border-emerald-500 shrink-0">
                <img
                  src="/logo.png"
                  alt="Dooars Daily Basket"
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-white tracking-wide truncate">
                  Dooars Daily Basket
                </h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-emerald-400">Super Admin Panel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
            {navigationGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-3 tracking-wider">
                  {group.group}
                </span>
                <div className="space-y-0.5 mt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleTabChange(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                          />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                              item.badgeColor || 'bg-emerald-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.count !== undefined && !item.badge && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Super Admin User info & Prominent LOGOUT */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 space-y-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                SA
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {userProfile?.displayName || 'Super Admin'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  UID: yFxa1vrBF5Pd...
                </p>
              </div>
            </div>

            <button
              onClick={logoutAdmin}
              className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
          </div>
        </aside>

        {/* Mobile menu backdrop */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs"
          />
        )}

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Swiggy/Zomato-Style App Bar */}
          <header className="hidden lg:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
            {/* Left Title & Status */}
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-sm font-black text-gray-900 capitalize tracking-wide flex items-center gap-2">
                  <span>{activeTab.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ● Real-Time Firebase Connected
                  </span>
                </h1>
                <p className="text-[11px] text-gray-500">
                  Super Admin Management Portal · Dooars Daily Basket
                </p>
              </div>
            </div>

            {/* Right Controls: Notification Bell, System State & Super Admin badge */}
            <div className="flex items-center gap-3">
              {/* Notification Bell with Badge */}
              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                title="Open Real-time Alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-[10px] font-black rounded-full flex items-center justify-center text-white ring-2 ring-white">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              <div className="h-6 w-px bg-gray-200" />

              {/* Super Admin ID badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <div className="leading-tight">
                  <span className="font-bold text-gray-800 block text-[11px]">Authorized Super Admin</span>
                  <span className="text-[10px] text-gray-500 font-mono">UID: yFxa...iNW2</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logoutAdmin}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOGOUT</span>
              </button>
            </div>
          </header>

          {/* Active View Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto">
            {activeTab === 'overview' && (
              <AdminDashboardOverview
                customers={customers}
                marketPartners={marketPartners}
                deliveryPartners={deliveryPartners}
                orders={orders}
                disputes={disputes}
                localAreas={localAreas}
                onNavigateTab={handleNavigateFromComponent}
              />
            )}

            {activeTab === 'products' && (
              <AdminProductCatalogManager
                products={products}
                marketPartners={marketPartners}
                localAreas={localAreas}
                initialPartnerId={preselectedPartner?.uid}
                initialStoreName={preselectedPartner?.storeName || preselectedPartner?.displayName}
              />
            )}

            {activeTab === 'orders' && (
              <AdminOrderManager
                orders={orders}
                deliveryPartners={deliveryPartners}
                marketPartners={marketPartners}
              />
            )}

            {activeTab === 'market_partners' && (
              <AdminMarketPartnerManager
                marketPartners={marketPartners}
                products={products}
                orders={orders}
                localAreas={localAreas}
                onAddProductForPartner={(partner) => {
                  setPreselectedPartner(partner);
                  handleTabChange('products');
                }}
              />
            )}

            {activeTab === 'delivery_partners' && (
              <AdminDeliveryPartnerManager
                deliveryPartners={deliveryPartners}
                orders={orders}
                disputes={disputes}
              />
            )}

            {activeTab === 'customers' && (
              <AdminCustomerManager
                customers={customers}
                orders={orders}
                disputes={disputes}
              />
            )}

            {activeTab === 'local_areas' && <AdminServiceAreaManager />}

            {activeTab === 'disputes' && <AdminDisputeManager disputes={disputes} />}

            {activeTab === 'revenue' && <AdminRevenueDashboard />}

            {activeTab === 'market_payouts' && <AdminMarketPayoutsView />}

            {activeTab === 'delivery_payouts' && <AdminWeeklyPayoutsView />}

            {activeTab === 'shipping' && <AdminGroceryShippingManager />}

            {activeTab === 'upi_qr' && <AdminUpiQrManager />}

            {activeTab === 'commissions' && <CommissionPayoutSettings />}

            {activeTab === 'business_settings' && <AdminBusinessSettingsManager />}

            {activeTab === 'settings' && <MasterSettingsManager onNavigateTab={handleNavigateFromComponent} />}
          </main>
        </div>

        {/* Real-time Notification Center Drawer */}
        <AdminNotificationCenter
          notifications={notifications}
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          onNavigateTab={(tab) => {
            setActiveTab(tab as AdminTab);
            setIsNotificationOpen(false);
          }}
        />
      </div>
    </SuperAdminRoleGuard>
  );
};
