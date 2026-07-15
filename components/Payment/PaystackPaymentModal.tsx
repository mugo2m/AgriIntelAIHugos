"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number; // Always in KES
  currency: string; // Always "KES" for actual charge
  displayAmount?: string; // Local currency equivalent (e.g., "0.65")
  displayCurrency?: string; // Local currency code (e.g., "BOB")
  email: string;
  phone: string;
  name: string;
  reference?: string;
}

export function PaystackPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  currency,
  displayAmount,
  displayCurrency,
  email,
  phone,
  name,
  reference,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.PaystackPop) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/paystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initialize",
          amount, // Always 10 KES
          currency: "KES", // Hardcoded to KES
          email,
          phone,
          name,
          reference: reference || `farm-${Date.now()}`,
        }),
      });
      const result = await response.json();

      if (result.status === "success") {
        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email,
          amount: amount * 100, // 10 KES = 1000 kobo
          currency: "KES",
          ref: result.data.reference,
          phone,
          channels: ['card', 'mobile_money'],
          callback: (response: any) => verifyPayment(response.reference),
          onClose: () => setLoading(false),
        });
        handler.openIframe();
      } else {
        setError(result.message || "Failed to initialize payment");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch("/api/paystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", reference }),
      });
      const result = await response.json();
      if (result.status === "success") {
        onSuccess();
      } else {
        setError(result.message || "Payment verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Verification error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const displaySymbol = displayCurrency ? getSymbol(displayCurrency) : currency;
  const displayValue = displayAmount || amount.toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">Payer avec Paystack</h2>
        <p className="text-gray-600 mb-4">
          Montant:{" "}
          <span className="font-bold text-lg">
            {displaySymbol} {displayValue}
          </span>
        </p>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Payer maintenant"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-300"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to get symbol from code
const getSymbol = (code: string): string => {
  const symbols: Record<string, string> = {
    KES: 'Ksh', USD: '$', EUR: '€', GBP: '£', UGX: 'USh', TZS: 'TSh',
    NGN: '₦', GHS: 'GH₵', ZAR: 'R', AUD: 'A$', CAD: 'C$', INR: '₹',
    PKR: 'Rs', PHP: '₱', SGD: 'S$', XOF: 'CFA', XAF: 'FCFA', RWF: 'FRw',
    MWK: 'MK', ZMW: 'ZK', BWP: 'P', MZN: 'MT', AOA: 'Kz', MGA: 'Ar',
    DJF: 'Fdj', CDF: 'FC', GNF: 'FG', MRU: 'UM', KMF: 'CF', HTG: 'G',
    COP: '$', ARS: '$', CLP: '$', PEN: 'S/', UYU: '$U', PYG: '₲',
    BOB: 'Bs.', VES: 'Bs.', CRC: '₡', GTQ: 'Q', HNL: 'L', NIO: 'C$',
    PAB: 'B/.', DOP: 'RD$', MXN: '$',
  };
  return symbols[code] || code;
};