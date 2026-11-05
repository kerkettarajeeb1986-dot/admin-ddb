import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { serviceAreaService } from '../services/serviceAreaService';
import { settingsService, defaultSettings } from '../services/settingsService';
import { businessSettingsService } from '../services/businessSettingsService';
import { LocalArea, ServiceabilityCheckResult } from '../types/serviceArea';
import { MasterSettings } from '../types/settings';
import { BusinessSettings, initialBusinessSettings } from '../types/businessSettings';
import { OrderItem, ProductCategory, CANONICAL_CATEGORIES } from '../types';
import { categoryService } from '../services/categoryService';

interface StoreContextType {
  localAreas: LocalArea[];
  activeLocalAreas: LocalArea[];
  isLoadingAreas: boolean;
  masterSettings: MasterSettings;
  businessSettings: BusinessSettings;
  updateBusinessSettings: (updates: Partial<BusinessSettings>, adminIdentifier?: string, summary?: string) => Promise<void>;
  categories: ProductCategory[];
  activeCategories: ProductCategory[];
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  selectedLocalArea: LocalArea | null;
  setSelectedLocalArea: (area: LocalArea | null) => void;
  checkServiceability: (pinCode: string) => Promise<ServiceabilityCheckResult>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localAreas, setLocalAreas] = useState<LocalArea[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(true);
  const [masterSettings, setMasterSettings] = useState<MasterSettings>(defaultSettings);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(initialBusinessSettings);
  const [categories, setCategories] = useState<ProductCategory[]>(CANONICAL_CATEGORIES);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedLocalArea, setSelectedLocalArea] = useState<LocalArea | null>(null);

  // Subscribe to real-time Local Areas, Master Settings, Business Settings & Categories from Firebase
  useEffect(() => {
    setIsLoadingAreas(true);
    const unsubAreas = serviceAreaService.subscribeToLocalAreas((areas) => {
      setLocalAreas(areas);
      setIsLoadingAreas(false);
    }, true);

    const unsubSettings = settingsService.subscribeToSettings((settings) => {
      setMasterSettings(settings);
    });

    const unsubBusinessSettings = businessSettingsService.subscribeToBusinessSettings((settings) => {
      setBusinessSettings(settings);
    });

    const unsubCategories = categoryService.subscribeToCategories((cats) => {
      setCategories(cats);
    });

    return () => {
      unsubAreas();
      unsubSettings();
      unsubBusinessSettings();
      unsubCategories();
    };
  }, []);

  const updateBusinessSettings = async (
    updates: Partial<BusinessSettings>,
    adminIdentifier?: string,
    summary?: string
  ) => {
    setBusinessSettings((prev) => ({ ...prev, ...updates }));
    await businessSettingsService.updateBusinessSettings(updates, adminIdentifier, summary);
  };

  const activeLocalAreas = useMemo(() => {
    return localAreas.filter((a) => a.status === 'active');
  }, [localAreas]);

  // Auto-select active local area if none is selected yet
  useEffect(() => {
    if (!selectedLocalArea && activeLocalAreas.length > 0) {
      setSelectedLocalArea(activeLocalAreas[0]);
    }
  }, [activeLocalAreas, selectedLocalArea]);

  const addToCart = (item: OrderItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === item.productId);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const checkServiceability = async (pinCode: string): Promise<ServiceabilityCheckResult> => {
    return await serviceAreaService.checkCustomerServiceability(pinCode);
  };

  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.isEnabled);
  }, [categories]);

  return (
    <StoreContext.Provider
      value={{
        localAreas,
        activeLocalAreas,
        isLoadingAreas,
        masterSettings,
        businessSettings,
        updateBusinessSettings,
        categories,
        activeCategories,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        selectedLocalArea,
        setSelectedLocalArea,
        checkServiceability,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
};
