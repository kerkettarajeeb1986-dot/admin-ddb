import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, CheckCircle2, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { storageService } from '../../services/storageService';
import { categoryService } from '../../services/categoryService';
import { GroceryProduct, ProductCategory, CANONICAL_CATEGORIES, normalizeCategoryName } from '../../types';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: GroceryProduct | null;
  onSaved?: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  product,
  onSaved,
}) => {
  const { userProfile } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>(() => categoryService.getCachedCategories());
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Vegetable');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('1 kg');
  const [stock, setStock] = useState('25');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = categoryService.subscribeToCategories((cats) => {
      setCategories(cats);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategory(normalizeCategoryName(product.category) || 'Vegetable');
      setPrice(product.price ? String(product.price) : '');
      setUnit(product.unit || '1 kg');
      setStock(product.stock !== undefined ? String(product.stock) : '25');
      setImageUrl(product.imageUrl || '');
    } else {
      setName('');
      setCategory('Vegetable');
      setPrice('');
      setUnit('1 kg');
      setStock('25');
      setImageUrl('');
    }
    setErrorMsg(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const url = await storageService.uploadProductImage(file, userProfile?.uid || 'merchant');
      setImageUrl(url);
    } catch (err) {
      console.warn('Image upload fallback to data URL:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMsg('Valid price is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (product) {
        await productService.updateProduct(product.id, {
          name: name.trim(),
          category,
          price: Number(price),
          unit: unit.trim() || '1 kg',
          stock: Number(stock) || 10,
          imageUrl: imageUrl || '',
        });
      } else {
        await productService.addProduct({
          name: name.trim(),
          category,
          price: Number(price),
          unit: unit.trim() || '1 kg',
          stock: Number(stock) || 10,
          imageUrl: imageUrl || '',
          partnerId: userProfile?.uid || 'partner_self',
          partnerName: userProfile?.storeName || userProfile?.displayName || 'Market Partner',
          localAreaId: userProfile?.localAreaId || '',
          localAreaName: userProfile?.localAreaName || 'Local Service Area',
          isAvailable: true,
        });
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setErrorMsg(err.message || 'Failed to save product to Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-gray-900 text-lg mb-1">
          {product ? 'Edit Grocery Item' : 'Add Grocery Item to Catalog'}
        </h3>
        <p className="text-xs text-gray-500 mb-4">Item will appear in the customer daily basket for your local area.</p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Dooars Spinach / Palak Saag"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Category (14 श्रेणियां) <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon ? `${c.icon} ` : ''}{c.name} {c.hindiName ? `(${c.hindiName})` : ''}
                  </option>
                ))}
              </select>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate">
                <span>Selected: <strong>{category}</strong></span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Price (₹)</label>
              <input
                type="number"
                required
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="40"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="1 kg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Stock Units</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="25"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Compressed Image Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Item Photo (Direct photo or URL)
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Item" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL or upload..."
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-emerald-600" />
                    <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                  </button>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick 1-Click HD Presets */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Quick Preset Photos (1-क्लिक फोटो चुनें):
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  { name: 'Palak / Spinach', url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80' },
                  { name: 'Red Potatoes', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80' },
                  { name: 'Tomatoes', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80' },
                  { name: 'Fresh Onions', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80' },
                  { name: 'Cauliflower', url: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80' },
                  { name: 'Darjeeling Oranges', url: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=600&auto=format&fit=crop&q=80' },
                  { name: 'Green Bananas', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80' },
                  { name: 'Cow Milk', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80' },
                  { name: 'Mustard Oil', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80' },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setImageUrl(item.url)}
                    className="px-2 py-0.5 rounded text-[10px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 font-medium transition cursor-pointer border border-gray-200"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Firebase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save to Catalog</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
