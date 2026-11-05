import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Headphones,
  FileText,
  ShieldCheck,
  ExternalLink,
  Package,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { GroceryShippingCheckout } from './GroceryShippingCheckout';
import { BusinessPolicyModal, PolicyType } from '../common/BusinessPolicyModal';
import { productService } from '../../services/productService';
import { GroceryProduct, isProductInCategory, normalizeCategoryName } from '../../types';

export const CustomerApp: React.FC = () => {
  const {
    activeLocalAreas,
    isLoadingAreas,
    selectedLocalArea,
    setSelectedLocalArea,
    checkServiceability,
    cart,
    addToCart,
    businessSettings,
    activeCategories,
  } = useStore();

  const [pinCodeInput, setPinCodeInput] = useState('');
  const [checkingPin, setCheckingPin] = useState(false);
  const [serviceabilityResult, setServiceabilityResult] = useState<{
    tested: boolean;
    isServiceable: boolean;
    message: string;
  } | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [liveProducts, setLiveProducts] = useState<GroceryProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; tab: PolicyType }>({
    isOpen: false,
    tab: 'terms',
  });

  // Subscribe to real-time products catalog
  useEffect(() => {
    const unsub = productService.subscribeToProducts(undefined, (prods) => {
      setLiveProducts(prods);
    });
    return () => unsub();
  }, []);

  // Use live products from Firestore (zero demo/fallback items)
  const sourceProducts = liveProducts;

  const filteredProducts = sourceProducts.filter((p) => {
    if (selectedCategory !== 'All' && !isProductInCategory(p.category, selectedCategory)) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        normalizeCategoryName(p.category).toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCheckPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCodeInput.trim()) return;

    setCheckingPin(true);
    setServiceabilityResult(null);

    const result = await checkServiceability(pinCodeInput.trim());
    setServiceabilityResult({
      tested: true,
      isServiceable: result.isServiceable,
      message: result.message,
    });

    if (result.isServiceable && result.area) {
      setSelectedLocalArea(result.area);
    }
    setCheckingPin(false);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Brand Hero Welcome Banner with Logo */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-emerald-50 rounded-full p-1 border border-emerald-200 shadow-xs flex items-center justify-center overflow-hidden">
          {businessSettings.isLogoEnabled && businessSettings.logoUrl ? (
            <img
              src={businessSettings.logoUrl}
              alt={businessSettings.businessName}
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-lg">
              {businessSettings.businessName ? businessSettings.businessName.slice(0, 2).toUpperCase() : 'DB'}
            </div>
          )}
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Fresh Local Harvest & Daily Essentials</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
            {businessSettings.businessName || 'Dooars Daily Basket'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-2xl">
            {businessSettings.businessDescription ||
              'Everything you need, delivered fresh & fast across verified local service areas.'}
          </p>
        </div>
      </div>

      {/* Location Serviceability Bar */}
      <div className="bg-emerald-800 text-white rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-300 shrink-0" />
              <h2 className="font-bold text-lg text-white">Your Delivery Location</h2>
            </div>
            <p className="text-xs text-emerald-100 max-w-lg">
              We deliver daily groceries directly across Admin-managed active local operational zones in Dooars.
            </p>
          </div>

          {/* Area Selector / PIN checker */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Dynamic Local Area Dropdown from Firebase */}
            <div className="min-w-[240px]">
              <select
                value={selectedLocalArea?.id || ''}
                onChange={(e) => {
                  const areaId = e.target.value;
                  const area = activeLocalAreas.find((a) => a.id === areaId);
                  if (area) {
                    setSelectedLocalArea(area);
                    if (area.pinCodes && area.pinCodes.length > 0) {
                      setPinCodeInput(area.pinCodes[0]);
                    }
                    setServiceabilityResult({
                      isServiceable: area.deliveryAvailable,
                      message: area.deliveryAvailable
                        ? `✓ Delivery is active & operational in ${area.name}, ${area.district} (PIN: ${area.pinCodes.join(', ')})!`
                        : `Delivery is currently paused in ${area.name}.`,
                      tested: true,
                    });
                  } else {
                    setSelectedLocalArea(null);
                    setPinCodeInput('');
                    setServiceabilityResult(null);
                  }
                }}
                className="w-full px-3 py-2 bg-white text-gray-900 border-2 border-emerald-400 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-300 focus:outline-none shadow-xs"
              >
                <option value="" className="text-gray-500 font-normal">
                  📍 Choose Active Local Area ({activeLocalAreas.length} available)
                </option>
                {activeLocalAreas.map((area) => (
                  <option key={area.id} value={area.id} className="text-gray-900 font-medium py-1">
                    🟢 {area.name} ({area.district}) — PIN: {area.pinCodes.join(', ')}
                  </option>
                ))}
              </select>
            </div>

            {/* PIN Code Quick Checker */}
            <form onSubmit={handleCheckPin} className="flex gap-1.5">
              <input
                type="text"
                maxLength={6}
                value={pinCodeInput}
                onChange={(e) => setPinCodeInput(e.target.value)}
                placeholder="Enter 6-digit PIN"
                className="w-32 px-3 py-2 bg-white text-gray-900 rounded-lg text-xs font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="submit"
                disabled={checkingPin}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition disabled:opacity-50"
              >
                {checkingPin ? 'Checking...' : 'Check'}
              </button>
            </form>
          </div>
        </div>

        {/* Dynamic Serviceability Feedback Alert */}
        {serviceabilityResult && serviceabilityResult.tested && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2.5 transition animate-fadeIn ${
              serviceabilityResult.isServiceable
                ? 'bg-emerald-700/90 text-white border border-emerald-500'
                : 'bg-red-500/20 text-red-100 border border-red-400/40'
            }`}
          >
            {serviceabilityResult.isServiceable ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-red-300" />
            )}
            <span className="font-medium">{serviceabilityResult.message}</span>
          </div>
        )}

        {/* Currently Selected Area Badge */}
        {selectedLocalArea && (
          <div className="mt-3 pt-3 border-t border-emerald-700/60 flex items-center justify-between text-xs text-emerald-200">
            <span>
              Delivering to:{' '}
              <strong className="text-white font-bold">{selectedLocalArea.name}</strong> (
              {selectedLocalArea.district})
            </span>
            <span className="font-mono text-[11px] text-emerald-300">
              PINs: {selectedLocalArea.pinCodes.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Cart Summary Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Today's Fresh Daily Basket</h3>
          <p className="text-xs text-gray-500">Handpicked farm produce and grocery staples delivered to your doorstep.</p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              View Basket ({totalCartCount}) • ₹
              {cart.reduce((acc, i) => acc + i.price * i.quantity, 0)}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Categories & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 max-w-full scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Items
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === cat.name
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{cat.icon || '🏷️'}</span>
                <span>{cat.name}</span>
                {cat.hindiName && (
                  <span className={`text-[10px] opacity-80 ${selectedCategory === cat.name ? 'text-white' : 'text-gray-500'}`}>
                    {cat.hindiName}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search groceries..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-xs">
          <Package className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
          {sourceProducts.length === 0 ? (
            <>
              <h4 className="text-base font-bold text-gray-800">
                Catalog Under Preparation (सामान जल्द उपलब्ध होगा)
              </h4>
              <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto">
                No items have been listed yet. Market Partners and Admin will add products and store items directly to this catalog soon!
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                <span>🛒 Real-time updates active</span>
              </div>
            </>
          ) : (
            <>
              <h4 className="text-sm font-bold text-gray-700">No products found</h4>
              <p className="text-xs text-gray-400 mt-1">Try selecting a different category or clearing search.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const inCart = cart.find((i) => i.productId === p.id);
            const isOutOfStock = p.isAvailable === false || (p.stock !== undefined && p.stock <= 0);

            return (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-36 bg-gray-50 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center border border-gray-100">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to placeholder emoji container
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Package className="w-10 h-10 text-gray-300" />
                    )}
                    {p.mrp && p.mrp > p.price && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                        SAVE ₹{p.mrp - p.price}
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                    {p.category}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base mt-2 line-clamp-1">{p.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{p.unit}</p>
                  {p.partnerName && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">by {p.partnerName}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-gray-900">₹{p.price}</span>
                    {p.mrp && p.mrp > p.price && (
                      <span className="text-xs text-gray-400 line-through">₹{p.mrp}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        productId: p.id,
                        productName: p.name,
                        price: p.price,
                        quantity: 1,
                        unit: p.unit,
                      })
                    }
                    disabled={isOutOfStock}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isOutOfStock ? 'Sold Out' : inCart ? `Add More (${inCart.quantity})` : 'Add to Basket'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCheckoutOpen && (
        <GroceryShippingCheckout
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

      {/* Comprehensive Dynamic Customer Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200 space-y-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          {/* Col 1: Brand & Office Address */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              {businessSettings.isLogoEnabled && businessSettings.logoUrl ? (
                <img
                  src={businessSettings.logoUrl}
                  alt={businessSettings.businessName}
                  className="w-8 h-8 object-contain rounded-full border border-emerald-300 p-0.5 bg-white"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                  DB
                </div>
              )}
              <h4 className="font-extrabold text-sm text-gray-900">
                {businessSettings.businessName || 'DOOARS DAILY BASKET'}
              </h4>
            </div>

            <p className="text-gray-500 leading-relaxed max-w-md">
              {businessSettings.businessDescription}
            </p>

            {businessSettings.officeAddress && (
              <div className="flex items-start gap-2 pt-1 text-gray-600">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed whitespace-pre-line text-[11.5px]">
                  <strong>Registered Office:</strong>
                  <br />
                  {businessSettings.officeAddress}
                </div>
              </div>
            )}
          </div>

          {/* Col 2: Direct Support Channels */}
          <div className="space-y-2.5">
            <h5 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
              Customer Helpdesk
            </h5>

            {businessSettings.isWhatsAppEnabled && businessSettings.supportWhatsApp && (
              <a
                href={`https://wa.me/91${businessSettings.supportWhatsApp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-emerald-800 hover:text-emerald-950 font-medium"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp: {businessSettings.supportWhatsApp}</span>
              </a>
            )}

            {businessSettings.isEmailEnabled && businessSettings.supportEmail && (
              <a
                href={`mailto:${businessSettings.supportEmail}`}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <Mail className="w-4 h-4 text-gray-600" />
                <span>{businessSettings.supportEmail}</span>
              </a>
            )}

            {businessSettings.isWebsiteEnabled && businessSettings.website && (
              <a
                href={`https://${businessSettings.website.replace(/^https?:\/\//, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-blue-700 hover:underline"
              >
                <Globe className="w-4 h-4" />
                <span>{businessSettings.website}</span>
              </a>
            )}

            {businessSettings.isBusinessHoursEnabled && businessSettings.businessHours && (
              <div className="flex items-center gap-2 text-gray-600 pt-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{businessSettings.businessHours}</span>
              </div>
            )}
          </div>

          {/* Col 3: Policies & Trust Links */}
          <div className="space-y-2">
            <h5 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
              Policies & Information
            </h5>
            <ul className="space-y-1.5 text-gray-600">
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'about' })}
                  className="hover:text-emerald-700 transition cursor-pointer"
                >
                  About Us & Story
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'support' })}
                  className="hover:text-emerald-700 transition cursor-pointer"
                >
                  Regional Helpdesk
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'terms' })}
                  className="hover:text-emerald-700 transition cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'privacy' })}
                  className="hover:text-emerald-700 transition cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'refund' })}
                  className="hover:text-emerald-700 transition cursor-pointer"
                >
                  Refund & Cancellation Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
          <span>
            © {new Date().getFullYear()} {businessSettings.businessName || 'DOOARS DAILY BASKET'}. All rights reserved.
          </span>
          <div className="flex items-center gap-3">
            <span>Hyperlocal Fresh Grocery Distribution</span>
            <span>•</span>
            <button
              onClick={() => setPolicyModal({ isOpen: true, tab: 'terms' })}
              className="hover:underline"
            >
              Legal Compliance
            </button>
          </div>
        </div>
      </footer>

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
