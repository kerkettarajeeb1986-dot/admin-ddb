export interface PayoutRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerType: 'market' | 'delivery';
  amount: number;
  periodStart: string;
  periodEnd: string;
  status: 'pending' | 'processed' | 'failed';
  paymentMode?: string;
  utrOrReference?: string;
  createdAt: any;
  processedAt?: any;
}

export interface RevenueMetric {
  totalOrders: number;
  grossMerchandiseValue: number;
  platformCommissions: number;
  deliveryPartnerEarnings: number;
  marketPartnerEarnings: number;
}
