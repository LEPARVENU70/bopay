export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
export type MerchantStatus = 'pending' | 'active' | 'suspended';
export type UserRole = 'owner' | 'cashier';

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  merchantId: string;
  customerId?: string;
  createdAt: string;
}

export interface Merchant {
  id: string;
  businessName: string;
  email: string;
  status: MerchantStatus;
  stripeOnboardingComplete: boolean;
}
