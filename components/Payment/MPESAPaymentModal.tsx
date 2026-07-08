// components/Payment/MPESAPaymentModal.tsx - FIXED WITH POLLING CONTROL
"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { X, Loader2, Smartphone, Check, AlertCircle, CreditCard } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface MPESAPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cost: number;
  interviewId: string;
  userId: string;
}

export function MPESAPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  cost = 3,
  interviewId,
  userId
}: MPESAPaymentModalProps) {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState("+254");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentInitiated, setIsPaymentInitiated] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [formattedPhone, setFormattedPhone] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTimeRef = useRef(0);

  // ============ POLLING CONTROL FUNCTIONS ============
  const stopAllPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
      console.log('🛑 Stopped all payment polling');
    }
  };

  // ============ VALIDATION & FORMATTING ============
  const validateAndFormatPhone = (input: string): { isValid: boolean; formatted: string } => {
    let value = input;

    // Ensure starts with +254
    if (!value.startsWith("+254")) {
      value = "+254" + value.replace(/[^\d]/g, "");
    }

    // Keep only digits after +254
    const prefix = "+254";
    const rest = value.slice(prefix.length).replace(/\D/g, "");

    // Format for MPESA API (254XXXXXXXXX)
    const mpesaFormat = "254" + rest.substring(0, 9);

    // Check validity: exactly 9 digits starting with 7
    const isValid = rest.length === 9 && /^7\d{8}$/.test(rest);

    return {
      isValid,
      formatted: mpesaFormat
    };
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Ensure starts with +254
    if (!value.startsWith("+254")) {
      value = "+254" + value.replace(/[^\d]/g, "");
    }

    // Keep only digits after +254
    const prefix = "+254";
    const rest = value.slice(prefix.length).replace(/\D/g, "").slice(0, 9);

    setPhoneNumber(prefix + rest);
  };

  const { isValid, formatted } = validateAndFormatPhone(phoneNumber);

  // ============ PAYMENT CHECK FUNCTIONS ============
  const checkPaymentWithThrottle = async () => {
    // Prevent multiple simultaneous checks
    if (isLoading) {
      console.log('⏸️ Skipping check - already loading');
      return null;
    }

    // Add rate limiting (2 seconds minimum between checks)
    const now = Date.now();
    if (lastCheckTimeRef.current > 0 && now - lastCheckTimeRef.current < 2000) {
      console.log('⏸️ Rate limited - skipping check');
      return null;
    }

    lastCheckTimeRef.current = now;

    try {
      console.log('🔵 [Payment Check] Checking payment status...');

      const response = await fetch('/api/payment/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, userId })
      });

      if (!response.ok) {
        console.warn('Payment check failed:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('💰 [Payment Check] Result:', {
        hasPaid: data.hasPaid,
        paymentExistsButUsed: data.paymentExistsButUsed
      });

      // If payment found or already used, stop all polling
      if (data.hasPaid || data.paymentExistsButUsed) {
        stopAllPolling();
      }

      return data;
    } catch (error: any) {
      console.error("Payment check error:", error);
      return null;
    }
  };

  // ============ PAYMENT POLLING ============
  const startPaymentPolling = (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 2 minutes (20 * 6 seconds)

    const pollPayment = async () => {
      attempts++;
      setCheckAttempts(attempts);

      try {
        console.log(`🟡 Payment check attempt ${attempts}/${maxAttempts}`);

        // Check payment status with throttle
        const data = await checkPaymentWithThrottle();

        if (!data) {
          // If throttled or failed, continue polling if under max attempts
          if (attempts < maxAttempts) {
            pollingRef.current = setTimeout(pollPayment, 6000);
          } else {
            setPaymentStatus("failed");
            toast.error(t('payment_timeout'));
            setIsLoading(false);
            stopAllPolling();
          }
          return;
        }

        // Check if payment is now paid
        if (data.hasPaid) {
          // ⭐ STOP POLLING IMMEDIATELY
          stopAllPolling();

          // Payment successful
          setPaymentStatus("success");
          setPaymentDetails(data);

          toast.success(t('payment_confirmed_toast'));

          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
          return;
        }

        if (attempts >= maxAttempts) {
          // Timeout
          setPaymentStatus("failed");
          toast.error(t('payment_timeout_check_phone'));
          setIsLoading(false);
          stopAllPolling();
          return;
        }

        // Continue polling (every 6 seconds)
        pollingRef.current = setTimeout(pollPayment, 6000);
      } catch (error: any) {
        console.error("Polling error:", error);
        if (attempts < maxAttempts) {
          pollingRef.current = setTimeout(pollPayment, 6000);
        } else {
          setPaymentStatus("failed");
          toast.error(t('payment_verification_failed'));
          setIsLoading(false);
          stopAllPolling();
        }
      }
    };

    // Start first poll after 6 seconds
    pollingRef.current = setTimeout(pollPayment, 6000);
  };

  // ============ PAYMENT INITIATION ============
  const handlePayNow = async () => {
    if (!isValid) {
      toast.error(t('valid_kenyan_phone'));
      return;
    }

    // Check for existing unused payment first (with throttle)
    const existingPayment = await checkPaymentWithThrottle();

    if (existingPayment?.hasPaid) {
      // User already has an unused payment
      toast.success(t('unused_payment_found'));
      setPaymentDetails(existingPayment);
      setIsPaymentInitiated(true);
      setPaymentStatus("success");

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      return;
    }

    if (existingPayment?.paymentExistsButUsed) {
      // Payment exists but has been used
      toast.info(t('previous_payment_used'));
    }

    setIsLoading(true);
    setPaymentStatus("processing");

    try {
      console.log("🟡 Initiating payment for:", {
        interviewId,
        userId,
        phone: formatted
      });

      // Call payment initiation API
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: formatted,
          interviewId,
          userId
        }),
      });

      // Handle response
      const responseText = await response.text();
      console.log("🟡 Initiate response text:", responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse JSON:", responseText);
        throw new Error(t('invalid_server_response'));
      }

      if (!response.ok) {
        throw new Error(data.message || t('payment_failed', { status: response.status }));
      }

      if (data.success) {
        setIsPaymentInitiated(true);
        setPaymentDetails(data);

        toast.success(
          <div className="flex flex-col">
            <span className="font-bold">{t('mpesa_request_sent')}</span>
            <span className="text-sm">{t('check_phone_and_enter_pin')}</span>
          </div>
        );

        // Start polling for payment confirmation
        startPaymentPolling(data.paymentId || interviewId);
      } else {
        throw new Error(data.message || t('payment_initiation_failed'));
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentStatus("failed");
      toast.error(t('payment_failed_message', { message: error.message }));
      setIsLoading(false);
      stopAllPolling();
    }
  };

  // ============ EFFECTS & CLEANUP ============
  // Update formatted phone when phone number changes
  useEffect(() => {
    const { formatted } = validateAndFormatPhone(phoneNumber);
    setFormattedPhone(formatted);
  }, [phoneNumber]);

  // Reset state and cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPhoneNumber("+254");
      setIsLoading(false);
      setIsPaymentInitiated(false);
      setPaymentStatus("idle");
      setCheckAttempts(0);
      setFormattedPhone("");
      setPaymentDetails(null);
      lastCheckTimeRef.current = 0;

      // Clear any polling interval
      stopAllPolling();
    } else {
      // Focus input when modal opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(phoneNumber.length, phoneNumber.length);
        }
      }, 100);
    }
  }, [isOpen, phoneNumber.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllPolling();
    };
  }, []);

  // ============ UI HELPER FUNCTIONS ============
  const formatPhoneDisplay = (phone: string) => {
    const prefix = "+254";
    const rest = phone.slice(prefix.length);

    if (rest.length === 0) return phone;

    return (
      <div className="flex items-center">
        <span className="text-gray-500 mr-1">+254</span>
        <span className="font-bold text-gray-900 tracking-wide">
          {rest.length > 0 && rest.substring(0, 3)}
          {rest.length > 3 && ' ' + rest.substring(3, 6)}
          {rest.length > 6 && ' ' + rest.substring(6, 9)}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{t('pay_for_interview')}</h2>
              <p className="text-sm opacity-90 mt-1">{t('cost_per_attempt', { cost })}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
              disabled={isLoading || paymentStatus === "processing"}
            >
              ×
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
              {t('cost_display', { cost })} - {t('real_mpesa')}
            </div>
            <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {t('pay_per_attempt')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-600">🎤</span>
              {t('ai_interview_practice')}
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{t('voice_feedback')}</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{t('detailed_analysis')}</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{t('personalized_questions')}</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{t('progress_tracking')}</span>
              </li>
            </ul>
          </div>

          {/* Price Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('total_amount')}</div>
                <div className="text-3xl font-bold text-blue-700">{t('currency_symbol')} {cost}</div>
                <div className="text-sm text-gray-600 mt-1">{t('per_interview_attempt')}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-600 font-semibold">✓ {t('instant_access')}</div>
                <div className="text-xs text-gray-600">{t('after_payment')}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <CreditCard className="w-4 h-4" />
                <span>{t('retake_payment', { cost })}</span>
              </div>
            </div>
          </div>

          {/* Phone Input Section */}
          {!isPaymentInitiated ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Smartphone className="inline w-4 h-4 mr-1" />
                {t('mpesa_phone_number')}
              </label>

              {/* Phone Preview */}
              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{t('youre_entering')}</div>
                <div className="text-lg font-mono">
                  {formatPhoneDisplay(phoneNumber)}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <span className="text-gray-500">+254</span>
                  <span className="ml-1 text-gray-700">{t('country_code')}</span>
                  <span className="mx-2">•</span>
                  <span className="text-gray-900 font-medium">{phoneNumber.slice(4) || '______'}</span>
                  <span className="ml-1 text-gray-700">{t('your_number')}</span>
                </div>
              </div>

              {/* Input Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">+254</span>
                </div>
                <input
                  ref={inputRef}
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder={t('phone_placeholder')}
                  className="w-full pl-16 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all text-lg font-bold text-gray-900 bg-white"
                  disabled={isLoading}
                  style={{
                    color: '#111827',
                    backgroundColor: '#ffffff',
                    fontWeight: '700',
                    fontSize: '18px',
                    letterSpacing: '0.5px'
                  }}
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  {isValid ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : phoneNumber.length > 4 ? (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  ) : null}
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t('format_label')}</span>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    +254 7XX XXX XXX
                  </span>
                </div>

                {/* Validation indicator */}
                <div className="mt-3">
                  {isValid ? (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">{t('valid_mpesa_number')}</p>
                        <p className="text-xs text-green-700">
                          {t('ready_for_payment')}: <span className="font-mono font-bold">{formatted}</span>
                        </p>
                      </div>
                    </div>
                  ) : phoneNumber.length > 4 ? (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-800">{t('complete_phone_number')}</p>
                        <p className="text-xs text-amber-700">
                          {t('enter_more_digits', { count: 9 - (phoneNumber.length - 4) })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">{t('enter_mpesa_phone')}</p>
                    </div>
                  )}
                </div>

                {/* Character counter */}
                <div className="text-right">
                  <span className={`text-xs font-medium ${
                    phoneNumber.length === 13 ? 'text-green-600' :
                    phoneNumber.length > 4 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {Math.max(0, phoneNumber.length - 4)}/9 {t('digits')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Payment Status Section */
            <div className="mb-6">
              <div className={`p-4 rounded-xl border ${
                paymentStatus === "processing" ? "bg-yellow-50 border-yellow-200" :
                paymentStatus === "success" ? "bg-green-50 border-green-200" :
                "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center gap-3">
                  {paymentStatus === "processing" ? (
                    <div className="relative">
                      <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold">{checkAttempts}</span>
                      </div>
                    </div>
                  ) : paymentStatus === "success" ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      paymentStatus === "processing" ? "text-yellow-800" :
                      paymentStatus === "success" ? "text-green-800" :
                      "text-gray-800"
                    }`}>
                      {paymentStatus === "processing"
                        ? t('waiting_for_payment', { attempts: checkAttempts, max: 20 })
                        : paymentStatus === "success"
                        ? t('payment_confirmed')
                        : t('processing_payment')}
                    </p>
                    <p className={`text-sm ${
                      paymentStatus === "processing" ? "text-yellow-700" :
                      paymentStatus === "success" ? "text-green-700" :
                      "text-gray-700"
                    }`}>
                      {paymentStatus === "processing"
                        ? t('check_phone_and_enter_pin')
                        : paymentStatus === "success"
                        ? t('redirecting_to_interview')
                        : t('payment_being_processed')}
                    </p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">
                        {t('payment_to')}: <span className="font-mono font-bold">{formatted}</span>
                      </p>
                    </div>

                    {/* Payment Details */}
                    {paymentDetails && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">{t('amount')}:</span>
                            <span className="ml-1 font-bold">{t('currency_symbol')} {cost}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{t('type')}:</span>
                            <span className="ml-1 font-medium">{t('per_attempt')}</span>
                          </div>
                          {paymentDetails.transactionId && (
                            <div className="col-span-2">
                              <span className="text-gray-500">{t('reference')}:</span>
                              <span className="ml-1 font-mono">{paymentDetails.transactionId.substring(0, 12)}...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress indicator */}
                {paymentStatus === "processing" && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{t('checking_payment')}</span>
                      <span>{checkAttempts}/20 {t('attempts')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(checkAttempts / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
              disabled={isLoading || paymentStatus === "processing"}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handlePayNow}
              disabled={!isValid || isLoading || isPaymentInitiated}
              className={`flex-1 py-3 rounded-lg font-bold text-lg transition-all ${
                isValid && !isLoading && !isPaymentInitiated
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } ${isLoading ? "animate-pulse" : ""}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('processing')}
                </span>
              ) : isPaymentInitiated ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('payment_initiated')}
                </span>
              ) : (
                t('pay_amount', { cost })
              )}
            </button>
          </div>

          {/* Payment Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-800 mb-2">{t('payment_details_title')}</p>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span>{t('payment_detail_per_attempt', { cost })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span>{t('payment_detail_no_subscription')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span>{t('payment_detail_retake', { cost })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-bold">⚠️</span>
              </div>
              <div>
                <p className="font-bold text-red-700 mb-2">{t('important')}</p>
                <p className="text-sm text-gray-800 mb-2">
                  {t('real_payment_warning')}
                </p>
                <ul className="text-sm text-gray-700 space-y-1 pl-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>{t('payment_step_1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>{t('payment_step_2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>{t('payment_step_3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>{t('payment_step_4')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}