export interface GroceryShippingOption {
  id: string;
  title: string;
  description: string;
  baseRate: number;
  perKmRate: number;
  estimatedDeliveryTime: string;
  minOrderAmount: number;
  isActive: boolean;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  landmark?: string;
  localAreaId?: string;
  localAreaName?: string;
  pinCode: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
}
