import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Check,
  ChevronDown,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { serviceAreaService } from '../../services/serviceAreaService';
import { LocalArea, LocalAreaFormData, LocalAreaStatus } from '../../types/serviceArea';

export const AdminServiceAreaManager: React.FC = () => {
  const { localAreas, isLoadingAreas } = useStore();
  const { isSuperAdmin, userProfile } = useAuth();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<LocalArea | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const initialFormState: LocalAreaFormData = {
    name: '',
    pinCodes: '',
    district: '',
    state: 'West Bengal',
    deliveryAvailable: true,
    status: 'active',
    notes: '',
  };
  const [formData, setFormData] = useState<LocalAreaFormData>(initialFormState);

  // Available unique districts from existing data
  const availableDistricts = useMemo(() => {
    const districts = new Set(localAreas.map((a) => a.district).filter(Boolean));
    return Array.from(districts).sort();
  }, [localAreas]);

  // Filtered areas
  const filteredAreas = useMemo(() => {
    return localAreas.filter((area) => {
      // Status filter
      if (statusFilter !== 'all' && area.status !== statusFilter) {
        return false;
      }
      // District filter
      if (districtFilter !== 'all' && area.district !== districtFilter) {
        return false;
      }
      // Search query (matches name, district, state, or any pinCode)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = area.name.toLowerCase().includes(query);
        const matchesDistrict = area.district.toLowerCase().includes(query);
        const matchesState = area.state.toLowerCase().includes(query);
        const matchesPin = area.pinCodes.some((p) => p.includes(query));
        return matchesName || matchesDistrict || matchesState || matchesPin;
      }
      return true;
    });
  }, [localAreas, statusFilter, districtFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = localAreas.length;
    const active = localAreas.filter((a) => a.status === 'active').length;
    const inactive = localAreas.filter((a) => a.status === 'inactive').length;
    const archived = localAreas.filter((a) => a.status === 'archived').length;
    const totalPins = new Set(localAreas.flatMap((a) => a.pinCodes)).size;
    return { total, active, inactive, archived, totalPins };
  }, [localAreas]);

  const handleOpenAddModal = () => {
    setEditingArea(null);
    setFormData(initialFormState);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (area: LocalArea) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      pinCodes: area.pinCodes.join(', '),
      district: area.district,
      state: area.state || 'West Bengal',
      deliveryAvailable: area.deliveryAvailable,
      status: area.status,
      notes: area.notes || '',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMessage('Access denied: Only Super Admin can modify Local Areas.');
      return;
    }

    if (!formData.name.trim()) {
      setErrorMessage('Area Name is required.');
      return;
    }
    if (!formData.district.trim()) {
      setErrorMessage('District is required.');
      return;
    }

    const pinArray = formData.pinCodes
      .split(/[,;\s]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const invalidPins = pinArray.filter((p) => !/^\d{6}$/.test(p));
    if (invalidPins.length > 0) {
      setErrorMessage(`Invalid PIN code(s): ${invalidPins.join(', ')}. Must be 6 digits.`);
      return;
    }

    if (pinArray.length === 0) {
      setErrorMessage('Please enter at least one valid 6-digit PIN code.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingArea) {
        await serviceAreaService.updateLocalArea(editingArea.id, formData);
        showSuccess(`Local Area "${formData.name}" updated successfully.`);
      } else {
        await serviceAreaService.addLocalArea(formData, userProfile?.uid);
        showSuccess(`New Local Area "${formData.name}" added to Firebase.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save Local Area. Please check Firebase permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectStatusChange = async (area: LocalArea, newStatus: LocalAreaStatus) => {
    if (!isSuperAdmin) return;
    try {
      await serviceAreaService.setStatus(area.id, newStatus);
      const statusLabel =
        newStatus === 'active'
          ? 'Active (Visible & Operable)'
          : newStatus === 'inactive'
          ? 'Inactive (Temporarily Disabled)'
          : 'Archived (Retired)';
      showSuccess(`Local Area "${area.name}" set to ${statusLabel}.`);
    } catch (err: any) {
      setErrorMessage(`Failed to update status: ${err.message}`);
    }
  };

  const handleToggleStatus = async (area: LocalArea) => {
    const newStatus: LocalAreaStatus = area.status === 'active' ? 'inactive' : 'active';
    try {
      await serviceAreaService.setStatus(area.id, newStatus);
      showSuccess(`Status of "${area.name}" changed to ${newStatus}.`);
    } catch (err: any) {
      setErrorMessage(`Failed to update status: ${err.message}`);
    }
  };

  const handleArchive = async (area: LocalArea) => {
    const isAlreadyArchived = area.status === 'archived';
    try {
      if (isAlreadyArchived) {
        await serviceAreaService.toggleStatus(area.id, 'active');
        showSuccess(`Restored "${area.name}" to Active status.`);
      } else {
        await serviceAreaService.archiveLocalArea(area.id);
        showSuccess(`Archived "${area.name}".`);
      }
    } catch (err: any) {
      setErrorMessage(`Archive action failed: ${err.message}`);
    }
  };

  const handleDelete = async (area: LocalArea) => {
    try {
      await serviceAreaService.deleteLocalArea(area.id);
      showSuccess(`Deleted "${area.name}" from Firebase.`);
    } catch (err: any) {
      setErrorMessage(`Delete action failed: ${err.message}`);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                  Local Area Management
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Only
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Configure operational zones and covered PIN codes for Dooars Daily Basket.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              Add Local Area
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-gray-100">
          <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100">
            <p className="text-xs font-medium text-gray-500">Total Areas</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/60">
            <p className="text-xs font-medium text-emerald-700">Active Areas</p>
            <p className="text-xl font-bold text-emerald-800 mt-0.5">{stats.active}</p>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100/60">
            <p className="text-xs font-medium text-amber-700">Inactive</p>
            <p className="text-xl font-bold text-amber-800 mt-0.5">{stats.inactive}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500">Archived</p>
            <p className="text-xl font-bold text-gray-700 mt-0.5">{stats.archived}</p>
          </div>
          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/60 col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-blue-700">PINs Covered</p>
            <p className="text-xl font-bold text-blue-900 mt-0.5">{stats.totalPins}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by area name, district, PIN code (e.g. 735218)..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* District filter */}
          {availableDistricts.length > 0 && (
            <div className="w-full md:w-48">
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="all">All Districts ({availableDistricts.length})</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status filter dropdown */}
          <div className="w-full md:w-56">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-medium text-gray-700"
            >
              <option value="all">All Statuses ({localAreas.length})</option>
              <option value="active">Active (Visible & Operable) ({stats.active})</option>
              <option value="inactive">Inactive (Disabled) ({stats.inactive})</option>
              <option value="archived">Archived (Retired) ({stats.archived})</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 text-sm border-t border-gray-100">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition ${
              statusFilter === 'all'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({localAreas.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition ${
              statusFilter === 'inactive'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Inactive ({stats.inactive})
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition ${
              statusFilter === 'archived'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Archived ({stats.archived})
          </button>
        </div>
      </div>

      {/* Areas Table / Card View */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {isLoadingAreas ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Loading Local Areas from Firebase...</p>
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {searchQuery || statusFilter !== 'all' || districtFilter !== 'all'
                ? 'No matching local areas found'
                : 'No Local Areas configured yet'}
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-5">
              {searchQuery || statusFilter !== 'all' || districtFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Add your operational zones and covered PIN codes to enable Market Partner registration and Customer order serviceability.'}
            </p>
            {!(searchQuery || statusFilter !== 'all' || districtFilter !== 'all') && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Local Area
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase tracking-wider text-xs font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Area & Location</th>
                    <th className="px-5 py-3.5">PIN Codes</th>
                    <th className="px-5 py-3.5">Delivery Status</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAreas.map((area) => (
                    <tr
                      key={area.id}
                      className={`hover:bg-gray-50/80 transition ${
                        area.status === 'archived' ? 'opacity-60 bg-gray-50/40' : ''
                      }`}
                    >
                      {/* Name & Location */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 text-base">{area.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {area.district}, {area.state}
                        </div>
                        {area.notes && (
                          <div className="text-xs text-gray-400 mt-1 italic line-clamp-1">
                            Note: {area.notes}
                          </div>
                        )}
                      </td>

                      {/* PIN Codes */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {area.pinCodes.map((pin) => (
                            <span
                              key={pin}
                              className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-800 border border-gray-200"
                            >
                              {pin}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {area.pinCodes.length} {area.pinCodes.length === 1 ? 'code' : 'codes'}
                        </div>
                      </td>

                      {/* Delivery Available */}
                      <td className="px-5 py-4">
                        {area.deliveryAvailable ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Serviceable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            <XCircle className="w-3.5 h-3.5" /> Paused
                          </span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-5 py-4">
                        <select
                          value={area.status}
                          onChange={(e) =>
                            handleDirectStatusChange(area, e.target.value as LocalAreaStatus)
                          }
                          title="Change Operational Status"
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none transition ${
                            area.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : area.status === 'inactive'
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          <option value="active">🟢 Active (Visible & Operable)</option>
                          <option value="inactive">🟡 Inactive (Disabled)</option>
                          <option value="archived">⚪ Archived (Retired)</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active/Inactive */}
                          {area.status !== 'archived' && (
                            <button
                              onClick={() => handleToggleStatus(area)}
                              title={area.status === 'active' ? 'Disable Area' : 'Enable Area'}
                              className={`p-1.5 rounded-lg border text-xs font-medium transition ${
                                area.status === 'active'
                                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {area.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(area)}
                            title="Edit Area"
                            className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Archive/Restore */}
                          <button
                            onClick={() => handleArchive(area)}
                            title={area.status === 'archived' ? 'Restore Area' : 'Archive Area'}
                            className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Archive className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(area)}
                            title="Delete Area permanently"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredAreas.map((area) => (
                <div
                  key={area.id}
                  className={`p-4 space-y-3 ${
                    area.status === 'archived' ? 'bg-gray-50/60 opacity-75' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{area.name}</h4>
                      <p className="text-xs text-gray-500">
                        {area.district}, {area.state}
                      </p>
                    </div>
                    <select
                      value={area.status}
                      onChange={(e) =>
                        handleDirectStatusChange(area, e.target.value as LocalAreaStatus)
                      }
                      className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none transition ${
                        area.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : area.status === 'inactive'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      <option value="active">Active (Visible & Operable)</option>
                      <option value="inactive">Inactive (Disabled)</option>
                      <option value="archived">Archived (Retired)</option>
                    </select>
                  </div>

                  {/* PIN Codes */}
                  <div>
                    <span className="text-xs text-gray-400 font-medium">PIN Codes:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {area.pinCodes.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-800 border border-gray-200"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Status Metric */}
                  <div className="flex items-center justify-between text-xs bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    <span className="text-gray-500">Delivery Status:</span>
                    <span
                      className={`font-semibold ${
                        area.deliveryAvailable ? 'text-emerald-700' : 'text-gray-500'
                      }`}
                    >
                      {area.deliveryAvailable ? 'Available' : 'Paused'}
                    </span>
                  </div>

                  {/* Actions bar */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    {area.status !== 'archived' && (
                      <button
                        onClick={() => handleToggleStatus(area)}
                        className={`px-3 py-1.5 rounded-lg font-medium border ${
                          area.status === 'active'
                            ? 'border-amber-200 text-amber-700 bg-amber-50'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        }`}
                      >
                        {area.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => handleOpenEditModal(area)}
                        className="p-1.5 text-gray-600 hover:text-emerald-700 bg-gray-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(area)}
                        className="p-1.5 text-gray-600 hover:text-amber-700 bg-gray-100 rounded-lg"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(area)}
                        className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Area Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {editingArea ? 'Edit Local Area' : 'Add New Local Area'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Saves directly into your Firebase database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Area Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Area Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Malbazar, Birpara, Alipurduar, Jaigaon"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* PIN Codes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  PIN Code(s) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.pinCodes}
                  onChange={(e) => setFormData({ ...formData, pinCodes: e.target.value })}
                  placeholder="e.g. 735218, 735205, 735221 (comma separated)"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Separate multiple 6-digit postal codes with commas. Customers and Partners with these PINs will match this area.
                </p>
              </div>

              {/* District & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. Jalpaiguri, Alipurduar, Kalimpong"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="West Bengal"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status & Delivery Available Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as LocalAreaStatus;
                      setFormData({
                        ...formData,
                        status: nextStatus,
                        deliveryAvailable:
                          nextStatus === 'active'
                            ? true
                            : nextStatus === 'archived'
                            ? false
                            : formData.deliveryAvailable,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white font-medium"
                  >
                    <option value="active">Active (Visible & Operable)</option>
                    <option value="inactive">Inactive (Temporarily Disabled)</option>
                    <option value="archived">Archived (Retired)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                    <input
                      type="checkbox"
                      checked={formData.deliveryAvailable}
                      onChange={(e) =>
                        setFormData({ ...formData, deliveryAvailable: e.target.checked })
                      }
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">
                        Delivery Available
                      </span>
                      <span className="text-[11px] text-gray-500 block">
                        Accept customer grocery orders
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Internal Notes / Hub Landmarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Near New Bus Stand, primary collection hub for tea estate groceries"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving to Firebase...
                    </>
                  ) : editingArea ? (
                    'Update Local Area'
                  ) : (
                    'Save Local Area'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
