import React, { useState } from 'react';
import { X, MapPin, Store, Save } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

export const StoreInfoEditModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { activeLocalAreas } = useStore();
  const { userProfile, setUserProfile } = useAuth();

  const [storeName, setStoreName] = useState(userProfile?.storeName || '');
  const [selectedAreaId, setSelectedAreaId] = useState(userProfile?.localAreaId || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaving(true);
    const chosenArea = activeLocalAreas.find((a) => a.id === selectedAreaId);

    const updates = {
      storeName,
      localAreaId: selectedAreaId,
      localAreaName: chosenArea ? chosenArea.name : userProfile.localAreaName,
      district: chosenArea ? chosenArea.district : userProfile.district,
      state: chosenArea ? chosenArea.state : userProfile.state,
      address,
    };

    try {
      await userService.updateUserProfile(userProfile.uid, updates);
      setUserProfile({ ...userProfile, ...updates });
      onClose();
    } catch (err) {
      alert('Failed to update store info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-bold text-gray-900 text-lg mb-4">Edit Store Profile</h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Store Name
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Operational Local Area (Active in Firebase)
            </label>
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">-- Select Active Local Area --</option>
              {activeLocalAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} ({area.district})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">
              Pulled directly from active areas in Firebase database.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Physical Street / Stall Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold"
            >
              {saving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
