// lib/payment/clientCheck.ts - REAL PAYMENTS
// "use client" REMOVED - this is just a utility function, not a React component

export async function checkPaymentStatus(interviewId: string, userId: string): Promise<boolean> {
  console.log('🟡 [REAL] Checking payment for:', {
    interviewId: interviewId?.substring(0, 8),
    userId: userId?.substring(0, 8)
  });

  // Validate inputs
  if (!interviewId || !userId) {
    console.error('🔴 Missing interviewId or userId');
    return false;
  }

  // Check localStorage cache first
  try {
    const cached = localStorage.getItem('hugos_real_payments');
    if (cached) {
      const payments = JSON.parse(cached);
      const validPayment = payments.find((p: any) =>
        p.interviewId === interviewId &&
        p.userId === userId &&
        p.status === 'paid' &&
        p.amount === 3
      );
      if (validPayment) {
        console.log('💾 Using cached payment');
        return true;
      }
    }
  } catch (error) {
    console.log('No cached payment');
  }

  // REAL API call - NO FALLBACK
  try {
    console.log('📡 Calling /api/payment/check');
    const response = await fetch('/api/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interviewId, userId })
    });

    if (!response.ok) {
      throw new Error(`Payment API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('💰 Payment API response:', data);

    // Cache if paid
    if (data.hasPaid) {
      try {
        const cached = localStorage.getItem('hugos_real_payments') || '[]';
        const payments = JSON.parse(cached);

        // Remove old payments for same interview
        const filtered = payments.filter((p: any) =>
          !(p.interviewId === interviewId && p.userId === userId)
        );

        filtered.push({
          interviewId,
          userId,
          status: 'paid',
          amount: 3,
          paidAt: new Date().toISOString(),
          transactionId: data.transactionId || 'manual-' + Date.now()
        });

        localStorage.setItem('hugos_real_payments', JSON.stringify(filtered));
      } catch (e) {
        console.warn('Failed to cache payment');
      }
    }

    return data.hasPaid || false;

  } catch (error: any) {
    console.error('❌ REAL Payment check failed:', error.message);
    return false; // NO ACCESS ON ERROR
  }
}