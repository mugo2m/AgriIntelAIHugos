import Daraja from 'daraja';
import { v4 as uuidv4 } from 'uuid';

console.log('📦 Daraja import type:', typeof Daraja);
console.log('📦 Daraja properties:', Object.keys(Daraja));

// ✅ CORRECT: Daraja.Mpesa is the constructor
const Mpesa = Daraja.Mpesa;

export interface MPESAPaymentRequest {
  phone: string;
  amount: number;
  reference: string;
  description: string;
}

export interface MPESAPaymentResponse {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  error?: string;
  message?: string;
}

class MPESAService {
  private mpesa: any;

  constructor() {
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
      throw new Error('MPESA credentials not configured');
    }

    const config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY!,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
      environment: process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox'
    };

    console.log('🔧 MPESA Config:', {
      ...config,
      consumerKey: config.consumerKey.substring(0, 5) + '...'
    });

    // ✅ Initialize using Daraja.Mpesa
    this.mpesa = new Mpesa(config);
    console.log('✅ MPESA Service initialized successfully');
  }

  async initiateSTKPush(request: MPESAPaymentRequest): Promise<MPESAPaymentResponse> {
    try {
      console.log('🔐 Initiating MPESA payment');

      const phoneNumber = this.formatPhoneNumber(request.phone);

      const response = await this.mpesa.stkPush({
        phoneNumber,
        amount: request.amount,
        accountReference: request.reference,
        transactionDesc: request.description,
        shortCode: process.env.MPESA_SHORTCODE!,
        passKey: process.env.MPESA_PASSKEY!
      });

      return {
        success: true,
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID,
        message: 'STK Push sent to phone'
      };

    } catch (error: any) {
      console.error('❌ MPESA STK Push failed:', error);
      return {
        success: false,
        error: error.message || 'MPESA payment failed'
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    }
    return cleaned.substring(0, 12);
  }
}

export const mpesaService = new MPESAService();