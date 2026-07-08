// components/FinancialAnalysisClient.tsx - KG ONLY VERSION with simplified costs
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  DollarSign,
  Package,
  Sprout,
  Loader2,
  Download,
  Share2,
  BarChart3,
  Leaf,
  Tractor,
  Truck,
  Rocket,
  Zap,
  PlusCircle
} from "lucide-react";
import { useCurrency } from '@/lib/context/CurrencyContext';
import { formatCurrencyForDisplay } from '@/lib/utils/currency';

interface FinancialAnalysisClientProps {
  sessionData: any;
  sessionId: string;
}

export default function FinancialAnalysisClient({
  sessionData,
  sessionId
}: FinancialAnalysisClientProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);
  const [crop, setCrop] = useState<string>("");

  // KG-based financial data
  const [yieldKg, setYieldKg] = useState<number>(0);
  const [pricePerKg, setPricePerKg] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [totalCosts, setTotalCosts] = useState<number>(0);
  const [grossMargin, setGrossMargin] = useState<number>(0);

  // Cost breakdowns
  const [seedCost, setSeedCost] = useState<number>(0);
  const [fertilizerCosts, setFertilizerCosts] = useState<number>(0);
  const [labourCosts, setLabourCosts] = useState<number>(0);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [packagingCost, setPackagingCost] = useState<number>(0);
  const [miscellaneousCost, setMiscellaneousCost] = useState<number>(0);

  const [fertilizerDetails, setFertilizerDetails] = useState<any[]>([]);
  const [labourDetails, setLabourDetails] = useState<any[]>([]);
  const [seedDetails, setSeedDetails] = useState<any>({});

  useEffect(() => {
    if (sessionData) {
      console.log("📊 FinancialAnalysisClient (KG version) received:", sessionData);

      const yieldData = sessionData.yieldData || {};
      const gm = sessionData.grossMarginAnalysis || {};

      setYieldKg(yieldData.actualKg || gm.yieldKg || 0);
      setPricePerKg(yieldData.pricePerKg || gm.pricePerKg || 0);
      setRevenue(yieldData.revenue || gm.revenue || 0);
      setTotalCosts(gm.totalCosts || 0);
      setGrossMargin(gm.grossMargin || 0);

      setSeedCost(sessionData.seedCost || gm.seedCost || 0);

      // ✅ UPDATED: Use new simplified cost fields
      setTransportCost(sessionData.transportCostTotal || gm.transportCost || 0);
      setPackagingCost(sessionData.packagingCostTotal || gm.packagingCost || 0);
      setMiscellaneousCost(sessionData.miscellaneousCostTotal || gm.miscellaneousCost || 0);

      const labour = sessionData.labourCosts || {};
      const totalLabour = (labour.ploughing || 0) + (labour.planting || 0) +
                          (labour.weeding || 0) + (labour.harvesting || 0);
      setLabourCosts(totalLabour);

      const labourItems = [];
      const labourTypes = [
        { key: 'ploughing', nameKey: 'labour_ploughing', cost: labour.ploughing || 0 },
        { key: 'planting', nameKey: 'labour_planting', cost: labour.planting || 0 },
        { key: 'weeding', nameKey: 'labour_weeding', cost: labour.weeding || 0 },
        { key: 'harvesting', nameKey: 'labour_harvesting', cost: labour.harvesting || 0 }
      ];

      labourTypes.forEach(type => {
        if (type.cost > 0) {
          labourItems.push({
            name: t(type.nameKey),
            unitPrice: type.cost,
            quantity: 1,
            total: type.cost
          });
        }
      });
      setLabourDetails(labourItems);

      if (sessionData.seedRate && sessionData.seedCost) {
        setSeedDetails({
          name: t('seed_name'),
          unitPrice: sessionData.seedCost,
          quantity: sessionData.seedRate,
          total: sessionData.seedRate * sessionData.seedCost
        });
      }

      setCrop(sessionData.crops?.[0] || t('crops'));
      setIsLoading(false);
    }
  }, [sessionData, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const farmerName = sessionData?.farmerName || t('farmer');
  const marginPercentage = revenue > 0 ? (grossMargin / revenue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-indigo-950 text-white p-6 shadow-xl">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/interview/${sessionId}`}
                className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Financial Analysis - {crop} Enterprise
                </h1>
                <p className="text-white/80 flex items-center gap-2">
                  <Sprout className="w-4 h-4" />
                  {crop} • {sessionData?.county || 'Unknown'} • {farmerName}'s Farm
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl flex items-center gap-2 transition-all">
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl flex items-center gap-2 transition-all">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">

        {/* Revenue Card - KG BASED */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Revenue Summary - {farmerName}'s {crop} Enterprise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-90">Selling Price per kg</p>
              <p className="text-3xl font-bold">{formatCurrencyForDisplay(pricePerKg, currency)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Total Yield</p>
              <p className="text-3xl font-bold">{yieldKg.toLocaleString()} kg</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Total Revenue</p>
              <p className="text-3xl font-bold">{formatCurrencyForDisplay(revenue, currency)}</p>
            </div>
          </div>
          <p className="mt-3 text-white/80 text-sm">
            💼 This is your revenue, {farmerName}. Every kilogram sold puts money in YOUR pocket!
          </p>
        </div>

        {/* Detailed Cost Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-6 text-blue-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Detailed Cost Breakdown - Track Every Shilling!
          </h2>

          {/* Labour Costs Table */}
          {labourDetails.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-green-900 mb-3 text-lg flex items-center gap-2">
                <Tractor className="w-5 h-5" />
                👨‍🌾 Labour Costs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="p-2 text-left text-green-800">Item</th>
                      <th className="p-2 text-right text-green-800">Rate per Acre</th>
                      <th className="p-2 text-right text-green-800">Quantity (acres)</th>
                      <th className="p-2 text-right text-green-800">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labourDetails.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium text-green-800">{item.name}</td>
                        <td className="p-2 text-right text-green-800">{formatCurrencyForDisplay(item.unitPrice, currency)}</td>
                        <td className="p-2 text-right text-green-800">1</td>
                        <td className="p-2 text-right font-bold text-green-800">{formatCurrencyForDisplay(item.total, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Seed Costs */}
          {seedDetails.total > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-purple-900 mb-3 text-lg flex items-center gap-2">
                <Sprout className="w-5 h-5" />
                🌽 Seed Costs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-100">
                    <tr>
                      <th className="p-2 text-left text-purple-800">Item</th>
                      <th className="p-2 text-right text-purple-800">Price per kg</th>
                      <th className="p-2 text-right text-purple-800">Quantity (kg)</th>
                      <th className="p-2 text-right text-purple-800">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium text-purple-800">{seedDetails.name}</td>
                      <td className="p-2 text-right text-purple-800">{formatCurrencyForDisplay(seedDetails.unitPrice, currency)}</td>
                      <td className="p-2 text-right text-purple-800">{seedDetails.quantity}</td>
                      <td className="p-2 text-right font-bold text-purple-800">{formatCurrencyForDisplay(seedDetails.total, currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grand Total Table */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-3 text-left rounded-tl-xl">Cost Item</th>
                  <th className="p-3 text-right">Details</th>
                  <th className="p-3 text-right rounded-tr-xl">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-blue-100">
                  <td className="p-3 font-medium text-blue-800">Revenue</td>
                  <td className="p-3 text-right text-blue-800">{yieldKg.toLocaleString()} kg × {formatCurrencyForDisplay(pricePerKg, currency)}</td>
                  <td className="p-3 text-right font-bold text-green-600">{formatCurrencyForDisplay(revenue, currency)}</td>
                </tr>
                <tr className="border-b border-blue-100 bg-blue-50">
                  <td className="p-3 font-medium text-blue-800">Seed Cost</td>
                  <td className="p-3 text-right text-blue-800">{seedDetails.quantity || 0} kg × {formatCurrencyForDisplay(seedDetails.unitPrice || 0, currency)}</td>
                  <td className="p-3 text-right font-bold text-blue-800">{formatCurrencyForDisplay(seedCost, currency)}</td>
                </tr>
                {labourDetails.map((item, index) => (
                  <tr key={`labour-${index}`} className="border-b border-blue-100">
                    <td className="p-3 font-medium text-blue-800">{item.name}</td>
                    <td className="p-3 text-right text-blue-800">1 acre × {formatCurrencyForDisplay(item.unitPrice, currency)}</td>
                    <td className="p-3 text-right font-bold text-blue-800">{formatCurrencyForDisplay(item.total, currency)}</td>
                  </tr>
                ))}
                <tr className="border-b border-blue-100 bg-blue-50">
                  <td className="p-3 font-medium text-blue-800">Transport</td>
                  <td className="p-3 text-right text-blue-800">Total transport cost</td>
                  <td className="p-3 text-right font-bold text-blue-800">{formatCurrencyForDisplay(transportCost, currency)}</td>
                </tr>
                <tr className="border-b border-blue-100">
                  <td className="p-3 font-medium text-blue-800">Packaging</td>
                  <td className="p-3 text-right text-blue-800">Total packaging cost (bags, crates, boxes)</td>
                  <td className="p-3 text-right font-bold text-blue-800">{formatCurrencyForDisplay(packagingCost, currency)}</td>
                </tr>
                <tr className="border-b border-blue-100 bg-blue-50">
                  <td className="p-3 font-medium text-blue-800">Miscellaneous</td>
                  <td className="p-3 text-right text-blue-800">Other costs (storage, marketing, certification)</td>
                  <td className="p-3 text-right font-bold text-blue-800">{formatCurrencyForDisplay(miscellaneousCost, currency)}</td>
                </tr>
                <tr className="bg-blue-900 text-white font-bold">
                  <td className="p-3 rounded-bl-xl">TOTAL COSTS</td>
                  <td className="p-3 text-right"></td>
                  <td className="p-3 text-right rounded-br-xl">{formatCurrencyForDisplay(totalCosts, currency)}</td>
                </tr>
                <tr className={`font-bold ${grossMargin >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                  <td className="p-3 rounded-bl-xl">GROSS MARGIN (PROFIT)</td>
                  <td className="p-3 text-right"></td>
                  <td className="p-3 text-right rounded-br-xl">{formatCurrencyForDisplay(grossMargin, currency)}</td>
                </tr>
              </tbody>
            </table>

            {/* Business Summary */}
            <div className={`mt-4 p-4 rounded-lg border-2 ${grossMargin >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <p className={`font-medium flex items-center gap-2 ${grossMargin >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                <Rocket className="w-5 h-5" />
                💼 BUSINESS SUMMARY, {farmerName.toUpperCase()}: Your total investment is {formatCurrencyForDisplay(totalCosts, currency)}.
                Your profit is {formatCurrencyForDisplay(grossMargin, currency)}.
                That's {marginPercentage.toFixed(1)}% return on your investment!
              </p>
            </div>
          </div>
        </div>

        {/* Farm Details */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold mb-4 text-blue-900 flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            Farm Details - {farmerName}'s Enterprise
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">Crop Enterprise</p>
              <p className="font-bold text-blue-900 capitalize">{crop}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">County</p>
              <p className="font-bold text-blue-900">{sessionData?.county || 'Unknown'}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">Farm Size</p>
              <p className="font-bold text-blue-900">{sessionData?.cropAcres || 1} acres</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">Soil Test</p>
              <p className="font-bold text-blue-900">{sessionData?.soilTest ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Business Reminder */}
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
            <p className="text-yellow-800 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              🔥 REMEMBER {farmerName.toUpperCase()}: Produce more with less. Every shilling you save is profit in YOUR pocket!
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8">
          <Link
            href={`/interview/${sessionId}`}
            className="inline-flex px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all items-center gap-2 border border-white/30"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Recommendations
          </Link>
        </div>
      </div>
    </div>
  );
}