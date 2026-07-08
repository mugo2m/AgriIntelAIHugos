export interface PaymentTransaction {
  id: string;
  userId: string;
  interviewId?: string;
  phone: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  checkoutRequestId: string;
  merchantRequestId: string;
  mpesaReceipt?: string;
  createdAt: Date;
  paidAt?: Date;
  expiresAt: Date;
  description: string;
}

export interface InterviewPaymentRequest {
  phone: string;
  amount: number;
  interviewId?: string; // If starting specific interview
  interviewType: 'basic' | 'standard' | 'premium';
}

export interface PaymentWebhookData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export const PRICING = {
  basic: {
    price: 100,
    description: 'Basic Interview',
    features: ['15-minute interview', 'Voice practice']
  },
  standard: {
    price: 200,
    description: 'Standard Interview',
    features: ['20-minute interview', 'AI Feedback', '5 questions']
  },
  premium: {
    price: 300,
    description: 'Premium Interview',
    features: ['30-minute interview', 'Detailed AI Report', 'Unlimited questions', 'PDF export']
  }
} as const;