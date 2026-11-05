export type UpiQrMode = 'static_customer_fills' | 'dynamic_order_amount';

export interface MasterSettings {
  id?: string;
  appName: string;
  supportPhone: string;
  supportEmail: string;
  deliveryBaseFee: number;
  deliveryPerKmFee: number;
  packagingFee?: number;
  freeDeliveryThreshold?: number;
  platformFeePercent: number;
  marketPartnerCommissionPercent: number;
  deliveryPartnerSharePercent: number;
  autoApproveOrders: boolean;
  upiId: string;
  upiPayeeName: string;
  upiQrMode?: UpiQrMode;
  currencySymbol: string;
  updatedAt?: any;
}

export interface CommissionSettings {
  groceryCommissionPercent: number;
  deliveryPartnerBasePayout: number;
  deliveryPartnerPerKmPayout: number;
  minimumOrderValue: number;
  freeDeliveryThreshold: number;
}
