import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  MapPin,
  Package,
  Edit2,
  Trash2,
  Wallet,
  Headphones,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Clock,
  FileText,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { StoreInfoEditModal } from './StoreInfoEditModal';
import { MarketPartnerWalletView } from './MarketPartnerWalletView';
import { ProductEditModal } from './ProductEditModal';
import { SupportModal } from '../common/SupportModal';
import { BusinessPolicyModal, PolicyType } from '../common/BusinessPolicyModal';
import { presenceService } from '../../services/presenceService';
import { productService } from '../../services/productService';
import { GroceryProduct } from '../../types';

export const MarketPartnerApp: React.FC = () => {
  const { userProfile } = useAuth();
  const { activeLocalAreas, businessSettings } = useStore();
  const [isStoreEditOpen, setIsStoreEditOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GroceryProduct | null>(null);
  const [myProducts, setMyProducts] = useState<GroceryProduct[]>([]);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; tab: PolicyType }>({
    isOpen: false,
    tab: 'terms',
  });

  // Subscribe to Partner's products
  useEffect(() => {
    if (!userProfile?.uid) return;
    const unsub = productService.subscribeToProducts(userProfile.uid, (prods) => {
      setMyProducts(prods);
    });
    return () => unsub();
  }, [userProfile?.uid]);

  // Start 60-second presence heartbeat for Market Partner
  useEffect(() => {
    if (!userProfile?.uid) return;
    const isOnline = userProfile.isOnline !== false;
    const stopHeartbeat = presenceService.startHeartbeat(userProfile.uid, 'market_partner', isOnline);
    return () => stopHeartbeat();
  }, [userProfile?.uid, userProfile?.isOnline]);

  // Partner assigned area
  const assignedArea = activeLocalAreas.find((a) => a.id === userProfile?.localAreaId);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-lg">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{userProfile?.storeName || 'Merchant Store'}</h2>
              <button
                onClick={() => setIsStoreEditOpen(true)}
                className="p-1 text-gray-400 hover:text-emerald-700"
                title="Edit Store Information"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Operational Area:{' '}
                <strong className="text-gray-900 font-semibold">
                  {assignedArea ? assignedArea.name : userProfile?.localAreaName || 'Not Assigned (Set in Profile)'}
                </strong>
                {assignedArea && ` (${assignedArea.district})`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSupportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition"
          >
            <Headphones className="w-3.5 h-3.5 text-emerald-700" />
            <span>Support Helpdesk</span>
          </button>
          <button
            onClick={() => setIsWalletOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700"
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Earnings Wallet</span>
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Grocery Item</span>
          </button>
        </div>
      </div>

      {/* Catalog & Inventory View */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Catalog & Stock ({myProducts.length} Items)</h3>
            <p className="text-xs text-gray-500">Items available for customer order in your local zone.</p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        {actionMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
              actionMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <span>{actionMsg.text}</span>
            <button
              onClick={() => setActionMsg(null)}
              className="text-gray-400 hover:text-gray-600 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {myProducts.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-gray-800">Your store catalog is ready</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Add fresh seasonal greens, vegetables, dairy, or pantry staples to start receiving orders.
            </p>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="mt-4 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {myProducts.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-xl p-3 bg-white flex flex-col justify-between shadow-2xs">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400 m-auto mt-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">{p.category}</span>
                    <h4 className="font-bold text-gray-900 text-xs truncate">{p.name}</h4>
                    <div className="text-xs font-extrabold text-emerald-800 mt-0.5">₹{p.price} / {p.unit}</div>
                    <span className={`text-[10px] font-semibold block mt-0.5 ${p.isAvailable ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {p.isAvailable ? `In Stock (${p.stock})` : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 mt-2.5 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setEditingProduct(p);
                      setIsProductModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 text-blue-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await productService.deleteProduct(p.id);
                        setActionMsg({ type: 'success', text: `Product "${p.name}" removed successfully.` });
                      } catch (err: any) {
                        setActionMsg({ type: 'error', text: `Failed to delete product: ${err.message}` });
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Business Information & Support Box for Merchant */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">
                {businessSettings.businessName || 'DOOARS DAILY BASKET'} • Merchant Helpdesk
              </h4>
              <p className="text-xs text-gray-600">
                Official fulfillment network support, order settlements, and store assistance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSupportOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </button>
            <button
              onClick={() => setPolicyModal({ isOpen: true, tab: 'terms' })}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold transition"
            >
              Merchant Terms
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-gray-700 border-t border-emerald-200/60">
          {businessSettings.isWhatsAppEnabled && businessSettings.supportWhatsApp && (
            <a
              href={`https://wa.me/91${businessSettings.supportWhatsApp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 p-2 bg-white rounded-lg border border-emerald-100 font-medium text-emerald-900 hover:bg-emerald-100/50"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>WhatsApp: {businessSettings.supportWhatsApp}</span>
            </a>
          )}
          {businessSettings.isEmailEnabled && businessSettings.supportEmail && (
            <a
              href={`mailto:${businessSettings.supportEmail}`}
              className="flex items-center gap-2 p-2 bg-white rounded-lg border border-emerald-100 font-medium text-gray-800 hover:bg-gray-100"
            >
              <Mail className="w-4 h-4 text-gray-600" />
              <span className="truncate">{businessSettings.supportEmail}</span>
            </a>
          )}
          {businessSettings.officeAddress && (
            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-emerald-100 font-medium text-gray-800">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">Office: Jalpaiguri, WB 734501</span>
            </div>
          )}
        </div>
      </div>

      {isStoreEditOpen && (
        <StoreInfoEditModal isOpen={isStoreEditOpen} onClose={() => setIsStoreEditOpen(false)} />
      )}
      {isWalletOpen && (
        <MarketPartnerWalletView isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      )}
      {isProductModalOpen && (
        <ProductEditModal
          isOpen={isProductModalOpen}
          product={editingProduct}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            setEditingProduct(null);
          }}
        />
      )}
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
