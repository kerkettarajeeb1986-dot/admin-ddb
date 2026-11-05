import React, { useState, useRef, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Upload,
  ExternalLink,
  Tag,
  Boxes,
  IndianRupee,
  Layers,
  Store,
  MapPin,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  GroceryProduct,
  UserProfile,
  LocalArea,
  ProductCategory,
  CANONICAL_CATEGORIES,
  normalizeCategoryName,
  isProductInCategory,
} from '../../types';
import { productService } from '../../services/productService';
import { storageService } from '../../services/storageService';
import { categoryService } from '../../services/categoryService';
import { serviceAreaService } from '../../services/serviceAreaService';
import { userService } from '../../services/userService';
import { AdminCategoryManagerModal } from './AdminCategoryManagerModal';

// Active 4 GP Local Areas in Dooars region (authoritative local fallback)
export const DEFAULT_DOOARS_AREAS: LocalArea[] = [
  { id: 'BvH5n2iXSmvbJJbyJkjL', name: 'Bagrakote GP Area', district: 'Jalpaiguri', state: 'West Bengal', pinCodes: ['734501'], status: 'active', deliveryAvailable: true },
  { id: 'dePjD3bxYWu3w3DWGLM8', name: 'DamDim GP Area', district: 'Jalpaiguri', state: 'West Bengal', pinCodes: ['735209'], status: 'active', deliveryAvailable: true },
  { id: 'wmCxlVDR5rkrPF3Pk3UI', name: 'Oodlabari GP Area', district: 'Jalpaiguri', state: 'West Bengal', pinCodes: ['735222'], status: 'active', deliveryAvailable: true },
  { id: '6DqCr1fR8RRbspJTTtaX', name: 'Rangamati GP Area', district: 'Jalpaiguri', state: 'West Bengal', pinCodes: ['735229'], status: 'active', deliveryAvailable: true },
];

// Curated HD Grocery Presets for 1-Click Replace & Quick Add
const GROCERY_PHOTO_PRESETS = [
  { name: 'Palak / Spinach', url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80' },
  { name: 'Red Potatoes', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80' },
  { name: 'Tomatoes', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80' },
  { name: 'Fresh Onions', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80' },
  { name: 'Cauliflower', url: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80' },
  { name: 'Darjeeling Oranges', url: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=600&auto=format&fit=crop&q=80' },
  { name: 'Green Bananas', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80' },
  { name: 'Apples', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80' },
  { name: 'Cow Milk', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80' },
  { name: 'Mustard Oil', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80' },
  { name: 'Aromatic Rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
  { name: 'Ginger & Garlic', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80' },
];

/**
 * Backward-compatible full list of all 14 categories plus 'All' filter
 */
export const CATEGORIES = ['All', ...CANONICAL_CATEGORIES.map((c) => c.name)];

interface AdminProductCatalogManagerProps {
  products: GroceryProduct[];
  marketPartners?: UserProfile[];
  localAreas?: LocalArea[];
  initialPartnerId?: string;
  initialStoreName?: string;
}

export const AdminProductCatalogManager: React.FC<AdminProductCatalogManagerProps> = ({
  products,
  marketPartners = [],
  localAreas = [],
  initialPartnerId,
  initialStoreName,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('all');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Real-time authoritative 14 categories
  const [categories, setCategories] = useState<ProductCategory[]>(() => categoryService.getCachedCategories());
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    const unsub = categoryService.subscribeToCategories((cats) => {
      setCategories(cats);
    });
    return unsub;
  }, []);

  // Guaranteed Active Local Areas (fallback to 4 Dooars active areas if loading)
  const [liveAreas, setLiveAreas] = useState<LocalArea[]>(() => {
    return localAreas && localAreas.length > 0 ? localAreas : DEFAULT_DOOARS_AREAS;
  });

  useEffect(() => {
    if (localAreas && localAreas.length > 0) {
      setLiveAreas(localAreas);
      return;
    }
    const unsub = serviceAreaService.subscribeToLocalAreas((areas) => {
      if (areas && areas.length > 0) {
        setLiveAreas(areas);
      }
    });
    return unsub;
  }, [localAreas]);

  // Guaranteed Market Partners & Sellers
  const [livePartners, setLivePartners] = useState<UserProfile[]>(marketPartners);

  useEffect(() => {
    if (marketPartners && marketPartners.length > 0) {
      setLivePartners(marketPartners);
      return;
    }
    const unsub = userService.subscribeToAllUsers((users) => {
      const partners = users.filter(
        (u) =>
          (u.role || '').toLowerCase() === 'market_partner' ||
          (u.role || '').toLowerCase() === 'partner' ||
          (u.role || '').toLowerCase() === 'seller' ||
          Boolean(u.storeName) ||
          Boolean((u as any).marketPartnerName)
      );
      setLivePartners(partners);
    });
    return unsub;
  }, [marketPartners]);

  // Unique catalog store names across all products
  const catalogStoreNames = React.useMemo(() => {
    const names = new Set<string>();
    products.forEach((p) => {
      const s = (p.partnerName || '').trim();
      if (s && s.toLowerCase() !== 'dooars central farm hub' && s.toLowerCase() !== 'dooars central basket') {
        names.add(s);
      }
    });
    return Array.from(names);
  }, [products]);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GroceryProduct | null>(null);

  useEffect(() => {
    if (initialPartnerId) {
      setEditingProduct(null);
      setIsAddEditModalOpen(true);
    }
  }, [initialPartnerId]);

  const [isReplaceImageModalOpen, setIsReplaceImageModalOpen] = useState(false);
  const [productForReplaceImage, setProductForReplaceImage] = useState<GroceryProduct | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<GroceryProduct | null>(null);

  // Clear All Products state
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Status & Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const showSuccess = (msg: string) => {
    setFeedback({ type: 'success', message: msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const showError = (msg: string) => {
    setFeedback({ type: 'error', message: msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Filter products using backward-compatible category matching, store filter, and area filter
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'All' && !isProductInCategory(p.category, selectedCategory)) {
      return false;
    }
    if (selectedPartnerFilter !== 'all') {
      const matchPartner =
        p.partnerId === selectedPartnerFilter ||
        (p.partnerName || '').toLowerCase() === selectedPartnerFilter.toLowerCase();
      if (!matchPartner) return false;
    }
    if (selectedAreaFilter !== 'all') {
      if (selectedAreaFilter === 'all_zones') {
        if (p.localAreaId && p.localAreaId !== 'all') return false;
      } else {
        if (p.localAreaId !== selectedAreaFilter) return false;
      }
    }
    if (stockFilter === 'in_stock' && (!p.isAvailable || (p.stock || 0) <= 0)) return false;
    if (stockFilter === 'out_of_stock' && (p.isAvailable && (p.stock || 0) > 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        normalizeCategoryName(p.category).toLowerCase().includes(q) ||
        (p.partnerName || '').toLowerCase().includes(q) ||
        (p.localAreaName || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Handle Quick Toggle In-Stock
  const handleToggleStock = async (product: GroceryProduct) => {
    try {
      const newStatus = !product.isAvailable;
      await productService.toggleAvailability(product.id, newStatus);
      showSuccess(`"${product.name}" is now marked as ${newStatus ? 'IN STOCK' : 'OUT OF STOCK'}.`);
    } catch (err: any) {
      showError(`Failed to update stock: ${err.message}`);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (product: GroceryProduct) => {
    setEditingProduct(product);
    setIsAddEditModalOpen(true);
  };

  // Open Replace Image Modal
  const handleOpenReplaceImage = (product: GroceryProduct) => {
    setProductForReplaceImage(product);
    setIsReplaceImageModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (product: GroceryProduct) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsActionLoading(true);
    try {
      await productService.deleteProduct(productToDelete.id);
      showSuccess(`"${productToDelete.name}" was permanently removed from Firebase.`);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err: any) {
      showError(`Failed to delete product: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirm Clear All Products
  const handleConfirmClearAll = async () => {
    setIsClearingAll(true);
    try {
      const prodsToClear = [...products];
      for (const p of prodsToClear) {
        try {
          await productService.deleteProduct(p.id);
        } catch (err) {
          console.warn('Error deleting product:', p.id, err);
        }
      }
      showSuccess(`All ${prodsToClear.length} items have been permanently deleted from Firebase.`);
      setIsClearAllModalOpen(false);
    } catch (err: any) {
      showError(`Failed to clear items: ${err.message}`);
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Grocery Products & Catalog (किराना सामान एवं प्रोडक्ट्स)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {products.length} Items Live
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Add, edit prices, replace product photos, manage inventory stock, and delete items with instant Firebase sync.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-xs"
            >
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Manage Categories ({categories.length} श्रेणियां)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsAddEditModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product (नया आइटम जोड़ें)</span>
            </button>

            {products.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(true)}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                title="Permanently remove all products from Firebase"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Clear All Items ({products.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, category, store..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white font-medium"
            />
          </div>

          <div>
            <select
              value={selectedPartnerFilter}
              onChange={(e) => setSelectedPartnerFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="all">🏪 All Stores & Suppliers</option>
              <option value="central_hub">Dooars Central Farm Hub</option>
              {livePartners.map((mp) => {
                const label =
                  mp.storeName ||
                  (mp as any).marketPartnerName ||
                  mp.displayName ||
                  mp.name ||
                  'Partner Store';
                return (
                  <option key={mp.uid} value={mp.uid}>
                    🏬 {label}
                  </option>
                );
              })}
              {catalogStoreNames.map((sName) => (
                <option key={sName} value={sName}>
                  📦 {sName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="all">📍 All Service Areas (सब इलाके)</option>
              <option value="all_zones">🌐 All Dooars (संपूर्ण डुआर्स)</option>
              {liveAreas.map((la) => (
                <option key={la.id} value={la.id}>
                  📍 {la.name} ({la.district || 'Jalpaiguri'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="all">📦 All Stock Status</option>
              <option value="in_stock">✓ In Stock Only</option>
              <option value="out_of_stock">✕ Out of Stock Only</option>
            </select>
          </div>
        </div>

        {/* Category Pills with Mobile Horizontal Scrolling & Real-time counts */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 shrink-0">
              Categories ({categories.length}):
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                selectedCategory === 'All'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => isProductInCategory(p.category, cat.name)).length;
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.icon || '🏷️'}</span>
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Grocery Items Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || selectedCategory !== 'All'
              ? 'No products matched your search or category filter. Try clearing filters.'
              : 'Your store catalog is currently empty. Click "Add New Product" to list vegetables, grains, fruits, or dairy.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsAddEditModalOpen(true);
              }}
              className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Product (पहला आइटम जोड़ें)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const hasMrpDiscount = product.mrp && product.mrp > product.price;
            const discountPercent = hasMrpDiscount
              ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                {/* Product Image & Badges */}
                <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                      <ImageIcon className="w-10 h-10 mb-1 opacity-50" />
                      <span className="text-[11px] font-medium">No Image</span>
                    </div>
                  )}

                  {/* Stock Tag */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        product.isAvailable && (product.stock || 0) > 0
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white shadow-xs'
                      }`}
                    >
                      {product.isAvailable && (product.stock || 0) > 0
                        ? `In Stock (${product.stock} ${product.unit})`
                        : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Discount Badge */}
                  {discountPercent > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                        {discountPercent}% OFF
                      </span>
                    </div>
                  )}

                  {/* Quick Replace Image Overlay Button */}
                  <button
                    onClick={() => handleOpenReplaceImage(product)}
                    title="Replace Product Image (फोटो बदलें)"
                    className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-bold rounded-lg backdrop-blur-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                    <span>Replace Image</span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
                      {product.category}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2 gap-1.5">
                      <div className="flex items-center gap-1 min-w-0 truncate" title={`Store: ${product.partnerName || 'Dooars Central Farm Hub'}`}>
                        <Store className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate font-medium">{product.partnerName || 'Dooars Central Farm Hub'}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md font-semibold text-[9.5px]">
                        <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[110px]">
                          {product.localAreaName || (product.localAreaId === 'all' || !product.localAreaId ? 'All Dooars' : 'Local Zone')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Units */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-emerald-800">
                            ₹{product.price}
                          </span>
                          {hasMrpDiscount && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{product.mrp}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">
                          per {product.unit || '1 kg'}
                        </span>
                      </div>

                      {/* Stock Switch */}
                      <button
                        onClick={() => handleToggleStock(product)}
                        title="Click to toggle availability"
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
                          product.isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {product.isAvailable ? '✓ Active' : '✕ Disabled'}
                      </button>
                    </div>

                    {/* Action Buttons: Edit, Replace, Delete */}
                    <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-blue-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleOpenDelete(product)}
                        className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. ADD / EDIT PRODUCT MODAL */}
      {isAddEditModalOpen && (
        <AddEditProductModal
          isOpen={isAddEditModalOpen}
          product={editingProduct}
          categories={categories}
          marketPartners={livePartners}
          localAreas={liveAreas}
          existingProducts={products}
          preselectedPartnerId={initialPartnerId}
          preselectedStoreName={initialStoreName}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={(savedProduct, isNew) => {
            showSuccess(
              isNew
                ? `✓ Added "${savedProduct.name}" to store catalog.`
                : `✓ Updated "${savedProduct.name}" details successfully.`
            );
            setIsAddEditModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* 2. REPLACE IMAGE MODAL */}
      {isReplaceImageModalOpen && productForReplaceImage && (
        <ReplaceImageModal
          isOpen={isReplaceImageModalOpen}
          product={productForReplaceImage}
          onClose={() => {
            setIsReplaceImageModalOpen(false);
            setProductForReplaceImage(null);
          }}
          onReplaced={(newUrl) => {
            showSuccess(`✓ Replaced photo for "${productForReplaceImage.name}".`);
            setIsReplaceImageModalOpen(false);
            setProductForReplaceImage(null);
          }}
        />
      )}

      {/* 3. CONFIRM DELETE MODAL (No window.confirm!) */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">Delete Product Permanently?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove <strong className="text-gray-800 font-bold">"{productToDelete.name}"</strong>? This will permanently delete it from the customer storefront and cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                disabled={isActionLoading}
                className="w-1/2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isActionLoading}
                className="w-1/2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
              >
                {isActionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Delete (डिलीट करें)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3B. CONFIRM CLEAR ALL PRODUCTS MODAL */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">
                Permanently Delete All {products.length} Products?
              </h3>
              <p className="text-xs text-rose-700 font-medium mt-1">
                सभी लाइव सामान को हमेशा के लिए Firebase से हटाएं
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-left mt-3 space-y-1 text-xs">
                <p className="text-gray-800 font-bold">
                  Total Items to be Deleted: {products.length}
                </p>
                <p className="text-gray-600">
                  This will completely clear your grocery catalog across customer apps and market partner stores.
                </p>
                <p className="text-rose-600 font-semibold pt-1 border-t border-rose-200">
                  ⚠️ This action is permanent and directly updates Firebase Firestore.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                disabled={isClearingAll}
                className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel (रद्द करें)
              </button>

              <button
                type="button"
                onClick={handleConfirmClearAll}
                disabled={isClearingAll}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                {isClearingAll ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Clear All Products</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADMIN CATEGORY MANAGER MODAL */}
      {isCategoryModalOpen && (
        <AdminCategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          products={products}
        />
      )}
    </div>
  );
};

// -------------------------------------------------------------
// SUB-COMPONENT: ADD / EDIT PRODUCT MODAL
// -------------------------------------------------------------
interface AddEditProductModalProps {
  isOpen: boolean;
  product: GroceryProduct | null;
  categories: ProductCategory[];
  marketPartners: UserProfile[];
  localAreas: LocalArea[];
  existingProducts?: GroceryProduct[];
  preselectedPartnerId?: string;
  preselectedStoreName?: string;
  onClose: () => void;
  onSaved: (product: Partial<GroceryProduct>, isNew: boolean) => void;
}

const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  product,
  categories,
  marketPartners,
  localAreas,
  existingProducts = [],
  preselectedPartnerId,
  preselectedStoreName,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(() => normalizeCategoryName(product?.category) || 'Vegetable');
  const [price, setPrice] = useState<string>(product ? String(product.price) : '');
  const [mrp, setMrp] = useState<string>(product?.mrp ? String(product.mrp) : '');
  const [unit, setUnit] = useState(product?.unit || '1 kg');
  const [stock, setStock] = useState<string>(product ? String(product.stock) : '50');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [description, setDescription] = useState(product?.description || '');

  // Local Area selection state: 'all' | '<localAreaId>'
  const [localAreaId, setLocalAreaId] = useState<string>(product?.localAreaId || 'all');
  const [isAvailable, setIsAvailable] = useState<boolean>(product?.isAvailable !== false);

  // Custom Popover Dropdown Toggles
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safe non-empty local areas list (includes all 4 GP areas from Dooars)
  const safeAreas = React.useMemo(() => {
    if (localAreas && localAreas.length > 0) return localAreas;
    return DEFAULT_DOOARS_AREAS;
  }, [localAreas]);

  // Sync state whenever product or modal opens
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategory(normalizeCategoryName(product.category) || 'Vegetable');
      setPrice(String(product.price ?? ''));
      setMrp(product.mrp ? String(product.mrp) : '');
      setUnit(product.unit || '1 kg');
      setStock(String(product.stock ?? 50));
      setImageUrl(product.imageUrl || '');
      setDescription(product.description || '');
      setLocalAreaId(product.localAreaId || 'all');
      setIsAvailable(product.isAvailable !== false);
    } else {
      setName('');
      setCategory('Vegetable');
      setPrice('');
      setMrp('');
      setUnit('1 kg');
      setStock('50');
      setImageUrl('');
      setDescription('');
      setIsAvailable(true);
      setLocalAreaId('all');
    }
    setErrorMsg(null);
    setIsCategoryDropdownOpen(false);
    setIsAreaDropdownOpen(false);
  }, [product, isOpen]);

  // Resolved local area name for visual confirmation & submission
  const resolvedAreaName = React.useMemo(() => {
    if (localAreaId === 'all') return 'All Service Areas (संपूर्ण डुआर्स)';
    const found = safeAreas.find((a) => a.id === localAreaId);
    return found ? `${found.name} (${found.district || 'Jalpaiguri'})` : 'Local Service Area';
  }, [localAreaId, safeAreas]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const downloadUrl = await storageService.uploadProductImage(file, 'admin_upload');
      setImageUrl(downloadUrl);
    } catch (err: any) {
      console.warn('Storage upload error, using local data URL fallback:', err);
      // Fallback to FileReader base64
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectPreset = (presetUrl: string) => {
    setImageUrl(presetUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a product name (सामान का नाम दर्ज करें).');
      return;
    }
    if (!category || !category.trim()) {
      setErrorMsg('Please select a valid category from the 14 product categories.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMsg('Please enter a valid price (मान्य मूल्य दर्ज करें).');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    // Resolve Partner ID and Partner Name: preserve existing or default to Dooars Central Farm Hub / preselected partner
    const finalPartnerId = preselectedPartnerId || product?.partnerId || 'central_hub';
    const finalPartnerName = preselectedStoreName || product?.partnerName || 'Dooars Central Farm Hub';

    // Resolve Local Area Name
    let finalAreaName = 'All Service Areas (संपूर्ण डुआर्स)';
    if (localAreaId !== 'all') {
      const matched = safeAreas.find((a) => a.id === localAreaId);
      if (matched) finalAreaName = matched.name;
    }

    const payload: Omit<GroceryProduct, 'id'> = {
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      mrp: mrp ? Number(mrp) : undefined,
      unit: unit.trim() || '1 kg',
      stock: Number(stock) || 0,
      imageUrl: imageUrl.trim(),
      description: description.trim(),
      partnerId: finalPartnerId,
      partnerName: finalPartnerName,
      localAreaId,
      localAreaName: finalAreaName,
      isAvailable,
    };

    try {
      if (isEditing && product) {
        await productService.updateProduct(product.id, payload);
        onSaved({ ...product, ...payload }, false);
      } else {
        const newId = await productService.addProduct(payload);
        onSaved({ id: newId, ...payload }, true);
      }
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setErrorMsg(err.message || 'Failed to save product to Firebase. Please try again.');
      setIsSaving(false);
    }
  };

  const selectedCatObj =
    categories.find((c) => c.name.toLowerCase() === category.toLowerCase()) ||
    categories.find((c) => c.name.toLowerCase() === normalizeCategoryName(category).toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {isEditing ? 'Edit Grocery Item (प्रोडक्ट एडिट करें)' : 'Add Grocery Item (नया सामान जोड़ें)'}
            </h3>
            <p className="text-xs text-gray-500">
              Save updates to store inventory and customer daily basket across all 14 categories.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Item Name (सामान का नाम) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Dooars Palak Saag (पालक साग)"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            {/* Custom Category Dropdown */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Category (14 श्रेणियां) <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                  setIsAreaDropdownOpen(false);
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold bg-white hover:border-emerald-500 focus:ring-2 focus:ring-emerald-600 focus:outline-none flex items-center justify-between transition cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base">{selectedCatObj?.icon || '🏷️'}</span>
                  <span className="font-bold text-gray-900">{category}</span>
                  {selectedCatObj?.hindiName && (
                    <span className="text-gray-500 font-medium">({selectedCatObj.hindiName})</span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                    isCategoryDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {/* Category Popover Menu */}
              {isCategoryDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsCategoryDropdownOpen(false)}
                  />
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95">
                    {categories.map((c) => {
                      const isSelected = c.name.toLowerCase() === category.toLowerCase();
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCategory(c.name);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                              : 'hover:bg-gray-50 text-gray-800 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base">{c.icon || '🏷️'}</span>
                            <span className="font-bold">{c.name}</span>
                            {c.hindiName && (
                              <span className="text-gray-500 text-[11px]">({c.hindiName})</span>
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Selected Category Visual Confirmation */}
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 truncate">
                <span>{selectedCatObj?.icon || '🏷️'}</span>
                <span className="truncate">
                  Selected: <strong>{category}</strong> {selectedCatObj?.hindiName ? `• ${selectedCatObj.hindiName}` : ''}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Weight / Unit (इकाई)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 1 kg, 500 g, 1 Packet"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Price, MRP, Stock */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Price (₹ मूल्य) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="₹ 35"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                MRP (₹ मूल दाम)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="₹ 45"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-500 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Stock Quantity (स्टॉक)
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Local Service Area */}
          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200">
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Local Service Area (सेवा क्षेत्र)</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/60 px-1.5 py-0.2 rounded">
                  {safeAreas.length} Areas
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAreaDropdownOpen(!isAreaDropdownOpen);
                  setIsCategoryDropdownOpen(false);
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold bg-white hover:border-emerald-500 focus:ring-2 focus:ring-emerald-600 focus:outline-none flex items-center justify-between transition cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-bold text-gray-900 truncate">{resolvedAreaName}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                    isAreaDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {/* Area Popover Menu */}
              {isAreaDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsAreaDropdownOpen(false)}
                  />
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95">
                    {/* All Service Areas */}
                    <button
                      type="button"
                      onClick={() => {
                        setLocalAreaId('all');
                        setIsAreaDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs transition cursor-pointer text-left ${
                        localAreaId === 'all'
                          ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                          : 'hover:bg-gray-50 text-gray-800 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">🌐</span>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900">All Service Areas (संपूर्ण डुआर्स)</div>
                          <div className="text-[11px] text-gray-500">All 4 GP Zones (Bagrakote, DamDim, Oodlabari, Rangamati)</div>
                        </div>
                      </div>
                      {localAreaId === 'all' && (
                        <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      )}
                    </button>

                    {/* Specific Local Areas */}
                    {safeAreas.map((la) => {
                      const isSelected = localAreaId === la.id;
                      return (
                        <button
                          key={la.id}
                          type="button"
                          onClick={() => {
                            setLocalAreaId(la.id);
                            setIsAreaDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                              : 'hover:bg-gray-50 text-gray-800 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">📍</span>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900">{la.name}</div>
                              <div className="text-[11px] text-gray-500">
                                {la.district || 'Jalpaiguri'}
                                {la.pinCodes?.length ? ` • PIN: ${la.pinCodes.join(', ')}` : ''}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Selected Area Visual Confirmation Badge */}
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-900 font-semibold bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">
                  Selected Area: <strong>{resolvedAreaName}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Product Image & Preset Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Product Image (फोटो / इमेज)
            </label>
            <div className="flex items-center gap-3">
              {/* Image Preview Box */}
              <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste direct image URL or choose below..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-emerald-600" />
                    <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                  </button>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Quick Preset Photos (1-क्लिक फोटो चुनें):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {GROCERY_PHOTO_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p.url)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition cursor-pointer ${
                      imageUrl === p.url
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description / Quality Details (विवरण)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Freshly sourced directly from organic farmers in Dooars..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Item In-Stock Status</span>
              <span className="text-[10px] text-gray-500">
                When active, customers can add this item to their daily cart.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                isAvailable
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isAvailable ? '✓ In Stock & Available' : '✕ Out of Stock'}
            </button>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Firebase...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Product (सेव करें)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SUB-COMPONENT: REPLACE PRODUCT IMAGE MODAL
// -------------------------------------------------------------
interface ReplaceImageModalProps {
  isOpen: boolean;
  product: GroceryProduct;
  onClose: () => void;
  onReplaced: (newUrl: string) => void;
}

const ReplaceImageModal: React.FC<ReplaceImageModalProps> = ({
  isOpen,
  product,
  onClose,
  onReplaced,
}) => {
  const [newUrl, setNewUrl] = useState(product.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const url = await storageService.uploadProductImage(file, 'replace_photo');
      setNewUrl(url);
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setNewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveImage = async () => {
    if (!newUrl.trim()) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await productService.replaceProductImage(product.id, newUrl.trim());
      onReplaced(newUrl.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to replace image');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Replace Product Image (फोटो बदलें)</h3>
            <p className="text-xs text-gray-500">For "{product.name}"</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Current & New Image Preview */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="text-center">
            <div className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center mb-1">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="Current" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <span className="text-[10px] text-gray-400 uppercase font-bold">Current Photo</span>
          </div>

          <div className="text-gray-400 font-bold">→</div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-xl border-2 border-emerald-500 overflow-hidden bg-emerald-50 flex items-center justify-center mb-1 shadow-xs">
              {newUrl ? (
                <img src={newUrl} alt="New Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-emerald-300" />
              )}
            </div>
            <span className="text-[10px] text-emerald-700 uppercase font-bold">New Photo</span>
          </div>
        </div>

        {/* URL Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            New Photo URL
          </label>
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Paste image link here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        {/* Upload Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isUploading ? 'Uploading file...' : 'Upload Image from Computer/Phone'}</span>
          </button>
        </div>

        {/* 1-Click Presets */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
            Or Pick from Dooars Fresh Presets:
          </span>
          <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {GROCERY_PHOTO_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setNewUrl(p.url)}
                className={`p-1.5 rounded-lg border text-left text-[10px] transition cursor-pointer flex items-center gap-1.5 ${
                  newUrl === p.url
                    ? 'bg-emerald-100 border-emerald-500 font-bold text-emerald-900'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <img src={p.url} alt={p.name} className="w-5 h-5 rounded object-cover shrink-0" />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveImage}
            disabled={isSaving || !newUrl.trim() || newUrl === product.imageUrl}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Replace & Save Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
