export interface BusinessSettings {
  id?: string;
  businessName: string;
  logoUrl: string;
  isLogoEnabled: boolean;
  officeAddress: string;
  supportWhatsApp: string;
  isWhatsAppEnabled: boolean;
  supportEmail: string;
  isEmailEnabled: boolean;
  website: string;
  isWebsiteEnabled: boolean;
  customerSupportInfo: string;
  businessDescription: string;
  aboutUs: string;
  termsAndConditions: string;
  privacyPolicy: string;
  refundPolicy: string;
  businessHours: string;
  isBusinessHoursEnabled: boolean;
  serviceAreaInfo: string;
  isServiceAreaInfoEnabled: boolean;
  updatedAt?: any;
  updatedBy?: string;
}

export interface BusinessSettingsAuditLog {
  id?: string;
  action: 'update_business_settings' | 'disable_field' | 'enable_field' | 'clear_field' | 'replace_logo';
  changedFields: string[];
  previousValues: Record<string, any>;
  newValues: Record<string, any>;
  updatedBy: string;
  updatedAt: any;
  summary: string;
}

export const initialBusinessSettings: BusinessSettings = {
  businessName: 'DOOARS DAILY BASKET',
  logoUrl: '/logo.png',
  isLogoEnabled: true,
  supportWhatsApp: '9609882564',
  isWhatsAppEnabled: true,
  supportEmail: 'dooarsdailybasket@gmail.com',
  isEmailEnabled: true,
  website: 'dooardailybasket.in',
  isWebsiteEnabled: true,
  officeAddress: `Leesh river tg Garden,
Pattibari Division,
Post – Bagrakote,
District – Jalpaiguri,
West Bengal – 734501,
India`,
  customerSupportInfo: 'Customer Support: Mon - Sun, 7:00 AM - 9:00 PM. Instant resolution via WhatsApp, phone, and email.',
  businessDescription: 'Dooars Daily Basket connects North Bengal tea gardens and towns directly with farm-fresh produce, tea garden flushes, and daily household provisions directly to your doorstep.',
  aboutUs: 'DOOARS DAILY BASKET connects regional farmers, tea estates, and local vendors directly with households across North Bengal. We provide fair compensation to farmers, verified freshness, and hyper-reliable local doorstep delivery across the Dooars region.',
  termsAndConditions: `Terms & Conditions for DOOARS DAILY BASKET:
1. Acceptance: By accessing or placing orders on Dooars Daily Basket, you agree to these terms.
2. Orders & Delivery: All orders are subject to product availability and delivery serviceability within registered PIN codes.
3. Pricing & Payments: All prices are shown in Indian Rupees (INR) inclusive of applicable taxes. Payments may be made via Cash on Delivery or UPI QR scan.
4. Cancellations: Orders can be cancelled prior to dispatch without penalty.`,
  privacyPolicy: `Privacy Policy for DOOARS DAILY BASKET:
1. Information Collected: We collect your name, phone number, and delivery address exclusively for order processing, logistics routing, and customer support.
2. Location Access: Location data is used strictly to verify serviceability and calculate distance-based logistics.
3. Security: We do not sell, rent, or disclose personal data to third-party advertisers. All transactions are securely encrypted.`,
  refundPolicy: `Refund & Cancellation Policy for DOOARS DAILY BASKET:
1. Produce Quality Assurance: If any grocery or perishable item is damaged or substandard, notify support within 2 hours of delivery for a 100% refund or free replacement.
2. Refund Method: Refunds are credited back to your original UPI account or processed as instant wallet credits within 24 hours.`,
  businessHours: 'Everyday: 6:30 AM – 9:30 PM (IST)',
  isBusinessHoursEnabled: true,
  serviceAreaInfo: 'Serving Jalpaiguri, Maynaguri, Malbazar, Dhupguri, Birpara, and surrounding tea garden and town divisions across Dooars, West Bengal.',
  isServiceAreaInfoEnabled: true,
};
