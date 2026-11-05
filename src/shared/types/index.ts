import { LocalArea } from './serviceArea';
import { MasterSettings } from './settings';
import { ShippingAddress } from './shipping';

export * from './serviceArea';
export * from './settings';
export * from './shipping';
export * from './financials';
export * from './category';

export type UserRole = 'super_admin' | 'market_partner' | 'delivery_partner' | 'customer';

export type UserStatus = 'active' | 'pending' | 'rejected' | 'suspended' | 'inactive';

export interface BankDetails {
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  upiId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  name?: string;
  phone?: string;
  role: UserRole;
  storeName?: string;
  localAreaId?: string;
  localAreaName?: string;
  pinCode?: string;
  district?: string;
  state?: string;
  address?: string;
  status?: UserStatus;
  rejectionReason?: string;
  
  // Market partner specific fields
  category?: string;
  fssaiNumber?: string;
  fssaiDocUrl?: string;
  shopPhotoUrl?: string;
  documents?: string[];
  bankDetails?: BankDetails;
  isOnline?: boolean;
  totalProducts?: number;
  totalPartnerEarnings?: number;
  
  // Delivery partner specific fields
  vehicleType?: string; // 'Motorcycle' | 'Scooter' | 'Bicycle' | 'Electric'
  drivingLicenseNumber?: string;
  vehicleNumber?: string;
  isAvailable?: boolean;
  currentOrderId?: string;
  completedDeliveries?: number;
  totalDeliveryEarnings?: number;
  payoutRequests?: {
    id: string;
    amount: number;
    requestedAt: any;
    status: 'pending' | 'approved' | 'rejected';
  }[];
  
  // Customer specific stats
  totalOrders?: number;
  totalSpent?: number;

  createdAt?: any;
  updatedAt?: any;
}

export interface GroceryProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  mrp?: number;
  unit: string; // e.g. 1 kg, 500 g, 1 packet
  stock: number;
  imageUrl?: string;
  description?: string;
  partnerId: string;
  partnerName?: string;
  localAreaId?: string;
  localAreaName?: string;
  isAvailable: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type DeliveryStatus = 'unassigned' | 'assigned' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'failed';

export interface OrderTimelineEvent {
  status: string;
  title: string;
  timestamp: any;
  note?: string;
}

export interface GroceryOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal?: number;
  deliveryFee: number;
  packagingFee?: number;
  totalAmount: number;
  paymentMethod?: 'cod' | 'online' | 'upi';
  paymentStatus?: PaymentStatus;
  isCOD?: boolean;
  status: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  shippingAddress: ShippingAddress;
  localAreaId: string;
  localAreaName: string;
  marketPartnerId?: string;
  marketPartnerName?: string;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  timeline?: OrderTimelineEvent[];
  cancellationReason?: string;
  refundStatus?: 'none' | 'requested' | 'approved' | 'processed';
  disputeId?: string;
  createdAt: any;
  updatedAt?: any;
}

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected';

export interface Dispute {
  id: string;
  disputeNumber?: string;
  raisedByType?: 'customer' | 'market_partner' | 'delivery_partner';
  raisedByRole?: 'customer' | 'market_partner' | 'delivery_partner' | string;
  raisedById: string;
  raisedByName: string;
  raisedByEmail?: string;
  raisedByPhone?: string;
  orderId?: string;
  orderNumber?: string;
  localAreaId?: string;
  localAreaName?: string;
  category?: 'order_issue' | 'delivery_delay' | 'damaged_item' | 'payment_dispute' | 'refund_request' | 'partner_dispute' | 'rider_dispute' | 'other';
  subject: string;
  description: string;
  evidenceUrls?: string[];
  status: DisputeStatus;
  resolutionNotes?: string;
  compensationAmount?: number;
  resolvedAt?: any;
  createdAt: any;
  updatedAt?: any;
}

export type NotificationType =
  | 'new_customer'
  | 'new_partner_application'
  | 'new_rider_application'
  | 'new_order'
  | 'delivery_assigned'
  | 'order_delivered'
  | 'payment_received'
  | 'order_cancelled'
  | 'refund_requested'
  | 'new_dispute'
  | 'dispute_raised'
  | 'payout_requested'
  | 'bank_updated'
  | 'system_alert';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  linkTab?: string;
  targetTab?: string;
  entityId?: string;
  targetId?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt: any;
}
