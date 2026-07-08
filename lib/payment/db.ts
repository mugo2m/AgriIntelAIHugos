import { db } from '@/firebase/admin';
import { PaymentTransaction } from '@/lib/mpesa/types';
import { v4 as uuidv4 } from 'uuid';

export class PaymentDBService {
  // Create a new payment transaction
  async createPaymentTransaction(data: {
    userId: string;
    phone: string;
    amount: number;
    checkoutRequestId: string;
    merchantRequestId: string;
    interviewId?: string;
    description: string;
  }): Promise<string> {
    const paymentId = `pay_${uuidv4()}`;
    const now = new Date();

    const transaction: PaymentTransaction = {
      id: paymentId,
      userId: data.userId,
      phone: data.phone,
      amount: data.amount,
      status: 'pending',
      checkoutRequestId: data.checkoutRequestId,
      merchantRequestId: data.merchantRequestId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes
      description: data.description,
      interviewId: data.interviewId
    };

    await db.collection('payments').doc(paymentId).set(transaction);
    console.log('💾 Payment transaction saved:', paymentId);

    return paymentId;
  }

  // Update payment status
  async updatePaymentStatus(
    checkoutRequestId: string,
    status: PaymentTransaction['status'],
    mpesaReceipt?: string
  ): Promise<boolean> {
    try {
      // Find payment by checkoutRequestId
      const query = await db.collection('payments')
        .where('checkoutRequestId', '==', checkoutRequestId)
        .limit(1)
        .get();

      if (query.empty) {
        console.error('❌ Payment not found:', checkoutRequestId);
        return false;
      }

      const paymentDoc = query.docs[0];
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (mpesaReceipt) {
        updateData.mpesaReceipt = mpesaReceipt;
      }

      if (status === 'paid') {
        updateData.paidAt = new Date();
      }

      await paymentDoc.ref.update(updateData);
      console.log(`✅ Payment ${checkoutRequestId} updated to: ${status}`);

      return true;
    } catch (error) {
      console.error('❌ Error updating payment:', error);
      return false;
    }
  }

  // Check if user has paid for interview
  async hasPaidForInterview(userId: string, interviewId?: string): Promise<boolean> {
    try {
      const query = db.collection('payments')
        .where('userId', '==', userId)
        .where('status', '==', 'paid');

      if (interviewId) {
        query.where('interviewId', '==', interviewId);
      }

      const result = await query.limit(1).get();
      return !result.empty;
    } catch (error) {
      console.error('❌ Error checking payment:', error);
      return false;
    }
  }

  // Get payment by ID
  async getPayment(paymentId: string): Promise<PaymentTransaction | null> {
    try {
      const doc = await db.collection('payments').doc(paymentId).get();
      return doc.exists ? (doc.data() as PaymentTransaction) : null;
    } catch (error) {
      console.error('❌ Error getting payment:', error);
      return null;
    }
  }

  // Get user's payment history
  async getUserPayments(userId: string, limit = 10): Promise<PaymentTransaction[]> {
    try {
      const query = await db.collection('payments')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return query.docs.map(doc => doc.data() as PaymentTransaction);
    } catch (error) {
      console.error('❌ Error getting user payments:', error);
      return [];
    }
  }
}

export const paymentDB = new PaymentDBService();