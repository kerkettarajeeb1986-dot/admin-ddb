import React, { useState } from 'react';
import {
  X,
  Layers,
  Plus,
  Check,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Search,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ProductCategory, GroceryProduct } from '../../types';
import { categoryService } from '../../services/categoryService';

interface AdminCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  products: GroceryProduct[];
}

export const AdminCategoryManagerModal: React.FC<AdminCategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  products,
}) => {
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatHindi, setNewCatHindi] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🛒');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setFeedback({ type: 'success', message: msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const showError = (msg: string) => {
    setFeedback({ type: 'error', message: msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggle = async (cat: ProductCategory) => {
    try {
      await categoryService.toggleCategory(cat.id, !cat.isEnabled);
      showSuccess(`"${cat.name}" is now ${!cat.isEnabled ? 'ENABLED' : 'DISABLED'}.`);
    } catch (err: any) {
      showError(err.message || 'Failed to update category state.');
    }
  };

  const handleResetTo14 = async () => {
    if (!window.confirm('Reset categories to the official 14 standard categories?')) return;
    setIsLoading(true);
    try {
      await categoryService.resetToDefault14();
      showSuccess('Successfully restored all 14 official categories.');
    } catch (err: any) {
      showError(err.message || 'Failed to restore default categories.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showError('Please provide a category name.');
      return;
    }

    const id = newCatName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const newCat: ProductCategory = {
      id,
      name: newCatName.trim(),
      hindiName: newCatHindi.trim() || newCatName.trim(),
      icon: newCatIcon.trim() || '🛒',
      description: newCatDesc.trim() || undefined,
      isEnabled: true,
      order: categories.length + 1,
      aliases: [newCatName.trim()],
    };

    setIsLoading(true);
    try {
      await categoryService.addCategory(newCat);
      showSuccess(`Category "${newCat.name}" added successfully.`);
      setNewCatName('');
      setNewCatHindi('');
      setNewCatDesc('');
      setIsAddingNew(false);
    } catch (err: any) {
      showError(err.message || 'Failed to add new category.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.hindiName || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  });

  // Calculate live products per category using backward-compatible mapping
  const getProductCountForCategory = (cat: ProductCategory) => {
    return products.filter((p) => categoryService.isProductInCategory(p.category, cat.name)).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                <span>Manage Store Categories (14 श्रेणियां)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {categories.length} Total
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                Official 14 Dooars Daily Basket categories synced across Admin, Market Partner, and Customer app.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
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

        {/* Action Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 my-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category by English or Hindi name..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetTo14}
              disabled={isLoading}
              title="Ensure all 14 official categories are present"
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset 14</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNew ? 'Cancel' : 'Add Custom'}</span>
            </button>
          </div>
        </div>

        {/* Add Custom Category Drawer */}
        {isAddingNew && (
          <form
            onSubmit={handleCreateCategory}
            className="p-3.5 mb-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 animate-in fade-in"
          >
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Add Custom Category (नई श्रेणी जोड़ें)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Name (English)</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Organic Herbal Tea"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-emerald-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Name (Hindi)</label>
                <input
                  type="text"
                  value={newCatHindi}
                  onChange={(e) => setNewCatHindi(e.target.value)}
                  placeholder="e.g. जैविक हर्बल चाय"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-emerald-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Icon / Emoji</label>
                <input
                  type="text"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="e.g. 🍵"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-emerald-600 text-center"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Description</label>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Brief description for customer catalog..."
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-emerald-600"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-800 shadow-xs"
              >
                Save Category
              </button>
            </div>
          </form>
        )}

        {/* Scrollable Category List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pr-1">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs font-medium">
              No categories match "{search}".
            </div>
          ) : (
            filteredCategories.map((cat, idx) => {
              const count = getProductCountForCategory(cat);
              return (
                <div
                  key={cat.id}
                  className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-gray-50 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right">{idx + 1}.</span>
                    <span className="text-xl shrink-0 p-1 bg-gray-100 rounded-lg">{cat.icon || '📦'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm truncate">{cat.name}</span>
                        {cat.hindiName && (
                          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md font-medium shrink-0">
                            {cat.hindiName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate max-w-sm mt-0.5">
                        {cat.description || `Products under ${cat.name}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Live Product Badge */}
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>

                    {/* Enable/Disable Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(cat)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        cat.isEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                      title={cat.isEnabled ? 'Click to disable' : 'Click to enable'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          cat.isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Changes persist immediately to Firebase.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
          >
            Done (संपन्न)
          </button>
        </div>
      </div>
    </div>
  );
};
