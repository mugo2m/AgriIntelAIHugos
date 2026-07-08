// components/CropComparisonClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Sprout,
  MapPin,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Package,
  Tractor,
  Droplets,
  Leaf,
  Wheat,
  Loader2,
  ArrowRight,
  Heart,
  Volume2,
  BarChart3,
  PieChart,
  Calculator,
  Wallet,
  Award,
  Gem,
  Rocket,
  Zap,
  ChevronUp,
  ChevronDown,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Scale,
  Gauge,
  Target,
  Star,
  Crown,
  Coffee,
  Apple,
  Banana,
  Carrot,
  Flower2,
  Trophy,
  Flag,
  Citrus,
  AlertCircle,
  CheckCircle2,
  // NEW: Icons for nutrient-enhanced crops
  Beaker,
  FlaskConical,
  Droplet,
  Wind
} from "lucide-react";
import { useCurrency } from '@/lib/context/CurrencyContext';
import { formatCurrencyForDisplay, formatCurrencyForSpeech } from '@/lib/utils/currency';

interface CropComparisonClientProps {
  sessionData: any;
  sessionId: string;
}

interface RankedCrop {
  crop: string;
  profit: number;
  revenue: number;
  costs: number;
  rank: number;
  color: string;
  icon: string;
  barColor: string;
  roi?: number;
  // NEW: Optional fields for enhanced crop data
  plantsDamaged?: number;
  fertilizerPlan?: any;
  soilTest?: any;
}

export default function CropComparisonClient({
  sessionData,
  sessionId
}: CropComparisonClientProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const [rankedCrops, setRankedCrops] = useState<RankedCrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  // NEW: State for showing nutrient info
  const [selectedCrop, setSelectedCrop] = useState<RankedCrop | null>(null);
  const [showNutrientInfo, setShowNutrientInfo] = useState(false);

  // ============ KARAOKE STREAMING STATE ============
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const wordsRef = useRef<string[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Get farmer name from session data
  const farmerName = sessionData?.farmerName || "Farmer";

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // ========== GET RANKED CROPS FROM FIREBASE DATA ==========
  useEffect(() => {
    const fetchAllCrops = async () => {
      setIsLoading(true);

      try {
        const crops: RankedCrop[] = [];

        // Add current session crop if it has gross margin data
        if (sessionData?.grossMarginAnalysis) {
          const gm = sessionData.grossMarginAnalysis;
          crops.push({
            crop: sessionData.crops?.[0] || t('unknown'),
            profit: gm.grossMargin || 0,
            revenue: gm.revenue || 0,
            costs: gm.totalCosts || 0,
            rank: 0,
            color: "",
            icon: "",
            barColor: "",
            // NEW: Include additional data if available
            plantsDamaged: sessionData.plantsDamaged,
            fertilizerPlan: sessionData.soilTest?.fertilizerPlan,
            soilTest: sessionData.soilTest
          });
        }

        // 🔥 FETCH ALL USER SESSIONS FROM FIREBASE
        try {
          const response = await fetch(`/api/user/sessions?userId=${sessionData?.userId}`);
          if (response.ok) {
            const data = await response.json();
            const allSessions = data.sessions || [];

            // Add crops from other sessions
            allSessions.forEach((session: any) => {
              // Skip current session (already added)
              if (session.id === sessionData?.id) return;

              if (session?.grossMarginAnalysis && session?.crops?.[0]) {
                crops.push({
                  crop: session.crops[0],
                  profit: session.grossMarginAnalysis.grossMargin || 0,
                  revenue: session.grossMarginAnalysis.revenue || 0,
                  costs: session.grossMarginAnalysis.totalCosts || 0,
                  rank: 0,
                  color: "",
                  icon: "",
                  barColor: "",
                  // NEW: Include additional data
                  plantsDamaged: session.plantsDamaged,
                  fertilizerPlan: session.soilTest?.fertilizerPlan,
                  soilTest: session.soilTest
                });
              }
            });
          }
        } catch (error) {
          console.error("Error fetching user sessions:", error);
        }

        // Sort by profit descending
        const sorted = crops.sort((a, b) => b.profit - a.profit);

        // Colors for bars
        const barColors = [
          "from-yellow-500 to-amber-400",
          "from-blue-500 to-indigo-400",
          "from-green-500 to-emerald-400",
          "from-purple-500 to-pink-400",
          "from-red-500 to-rose-400",
          "from-teal-500 to-cyan-400"
        ];

        const ranked = sorted.map((item, index) => ({
          ...item,
          rank: index + 1,
          color: barColors[index % barColors.length],
          barColor: barColors[index % barColors.length],
          icon: ["Crown", "Trophy", "Award", "Star", "Target", "Flag"][index % 6],
          roi: item.costs > 0 ? (item.profit / item.costs) * 100 : 0
        }));

        setRankedCrops(ranked);
      } catch (error) {
        console.error("Error fetching crops:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionData?.userId) {
      fetchAllCrops();
    } else {
      setIsLoading(false);
    }
  }, [sessionData, t]);

  // Get icon component based on string
  const getIconComponent = (iconName: string) => {
    switch(iconName) {
      case "Crown": return <Crown className="w-5 h-5" />;
      case "Trophy": return <Trophy className="w-5 h-5" />;
      case "Award": return <Award className="w-5 h-5" />;
      case "Star": return <Star className="w-5 h-5" />;
      case "Target": return <Target className="w-5 h-5" />;
      case "Flag": return <Flag className="w-5 h-5" />;
      default: return <Sprout className="w-5 h-5" />;
    }
  };

  // Get crop icon - UPDATED with more icons
  const getCropIcon = (crop: string) => {
    const iconMap: Record<string, any> = {
      maize: <Wheat className="w-5 h-5" />,
      beans: <Leaf className="w-5 h-5" />,
      coffee: <Coffee className="w-5 h-5" />,
      sorghum: <Wheat className="w-5 h-5" />,
      "finger millet": <Wheat className="w-5 h-5" />,
      bananas: <Banana className="w-5 h-5" />,
      tomatoes: <Apple className="w-5 h-5" />,
      onions: <Sprout className="w-5 h-5" />,
      cabbage: <Sprout className="w-5 h-5" />,
      kales: <Leaf className="w-5 h-5" />,
      groundnuts: <Sprout className="w-5 h-5" />,
      cassava: <Sprout className="w-5 h-5" />,
      "sweet potatoes": <Sprout className="w-5 h-5" />,
      potatoes: <Sprout className="w-5 h-5" />,
      oranges: <Citrus className="w-5 h-5" />,
      avocado: <Apple className="w-5 h-5" />,
      // NEW: Icons for new crops
      pineapples: <Sprout className="w-5 h-5" />,
      watermelons: <Apple className="w-5 h-5" />,
      carrots: <Carrot className="w-5 h-5" />,
      chillies: <Flower2 className="w-5 h-5" />,
      spinach: <Leaf className="w-5 h-5" />,
      pigeonpeas: <Sprout className="w-5 h-5" />,
      yams: <Sprout className="w-5 h-5" />,
      taro: <Sprout className="w-5 h-5" />,
      okra: <Sprout className="w-5 h-5" />,
      tea: <Leaf className="w-5 h-5" />,
      macadamia: <Sprout className="w-5 h-5" />,
      cocoa: <Coffee className="w-5 h-5" />
    };
    return iconMap[crop.toLowerCase()] || <Sprout className="w-5 h-5" />;
  };

  // Find max profit for chart scaling
  const maxProfit = rankedCrops.length > 0
    ? Math.max(...rankedCrops.map(c => c.profit))
    : 0;

  // ============ KARAOKE STREAMING FUNCTIONS ============
  const streamTextWithVoice = async (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    setIsStreaming(true);
    setStreamingContent("");
    setCurrentWordIndex(0);

    const words = text.split(' ');
    wordsRef.current = words;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; // UPDATED: Faster speech (was 0.8)
    utterance.pitch = 1.1;
    utterance.volume = 1.0;

    // Female voice names (common across browsers)
    const femaleVoiceNames = [
      'Jenny', 'Aria', 'Sonia', 'Samantha', 'Zira', 'Libby', 'Hazel',
      'Susan', 'Kate', 'Google UK English Female', 'Google US English Female',
      'Microsoft Jenny', 'Microsoft Aria', 'Microsoft Sonia', 'Microsoft Zira',
      'Microsoft Libby', 'Rafiki' // Swahili female voice
    ];

    const voices = window.speechSynthesis.getVoices();

    // Try to find a female voice first
    let preferredVoice = voices.find(v =>
      femaleVoiceNames.some(name => v.name.includes(name))
    );

    // If no female voice found, fallback to any English voice
    if (!preferredVoice) {
      preferredVoice = voices.find(v =>
        v.name.includes('Google UK') ||
        v.name.includes('Google US') ||
        v.name.includes('Samantha') ||
        v.lang.startsWith('en-')
      );
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`Using voice: ${preferredVoice.name} (${preferredVoice.lang})`);
    }

    utteranceRef.current = utterance;
    setIsSpeaking(true);

    let wordIndex = 0;
    let currentText = '';

    utterance.onboundary = (event) => {
      if (event.name === 'word' && wordIndex < words.length) {
        currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
        setStreamingContent(currentText);
        setCurrentWordIndex(wordIndex + 1);
        wordIndex++;
      }
    };

    utterance.onend = () => {
      setIsStreaming(false);
      setIsSpeaking(false);
      setStreamingContent("");
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      setIsStreaming(false);
      setIsSpeaking(false);
      setStreamingContent("");
      utteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsStreaming(false);
      setStreamingContent("");
      utteranceRef.current = null;
    }
  };

  // Helper to get currency name for speech
  const getCurrencyName = () => {
    switch(currency.code) {
      case 'KES': return 'Kenyan Shillings';
      case 'UGX': return 'Ugandan Shillings';
      case 'TZS': return 'Tanzanian Shillings';
      case 'RWF': return 'Rwandan Francs';
      case 'BIF': return 'Burundian Francs';
      case 'SSP': return 'South Sudanese Pounds';
      case 'ETB': return 'Ethiopian Birr';
      case 'SOS': return 'Somali Shillings';
      case 'DJF': return 'Djiboutian Francs';
      case 'ERN': return 'Eritrean Nakfa';
      case 'NGN': return 'Nigerian Nairas';
      case 'GHS': return 'Ghanaian Cedis';
      case 'XOF': return 'West African CFA Francs';
      case 'XAF': return 'Central African CFA Francs';
      case 'GNF': return 'Guinean Francs';
      case 'LRD': return 'Liberian Dollars';
      case 'SLL': return 'Sierra Leonean Leones';
      case 'GMD': return 'Gambian Dalasis';
      case 'CVE': return 'Cape Verdean Escudos';
      case 'CDF': return 'Congolese Francs';
      case 'AOA': return 'Angolan Kwanzas';
      case 'STN': return 'São Tomé and Príncipe Dobras';
      case 'ZAR': return 'South African Rand';
      case 'NAD': return 'Namibian Dollars';
      case 'BWP': return 'Botswana Pula';
      case 'ZWL': return 'Zimbabwean Dollars';
      case 'ZMW': return 'Zambian Kwacha';
      case 'MWK': return 'Malawian Kwacha';
      case 'MZN': return 'Mozambican Meticais';
      case 'MGA': return 'Malagasy Ariary';
      case 'KMF': return 'Comorian Francs';
      case 'MUR': return 'Mauritian Rupees';
      case 'SCR': return 'Seychellois Rupees';
      case 'SZL': return 'Swazi Lilangeni';
      case 'LSL': return 'Lesotho Loti';
      case 'EGP': return 'Egyptian Pounds';
      case 'SDG': return 'Sudanese Pounds';
      case 'LYD': return 'Libyan Dinars';
      case 'TND': return 'Tunisian Dinars';
      case 'DZD': return 'Algerian Dinars';
      case 'MAD': return 'Moroccan Dirhams';
      case 'MRU': return 'Mauritanian Ouguiya';
      case 'USD': return 'US Dollars';
      case 'GBP': return 'British Pounds';
      case 'EUR': return 'Euros';
      default: return currency.name;
    }
  };

  // Stream comparison summary - with farmer name
  const streamComparison = () => {
    if (rankedCrops.length === 0) return;

    const bestCrop = rankedCrops[0];
    const avgProfit = rankedCrops.reduce((sum, c) => sum + c.profit, 0) / rankedCrops.length;
    const currencyName = getCurrencyName();

    let text = t('comparison_summary_intro', { farmerName, crop: bestCrop.crop, currencyName, profit: bestCrop.profit.toLocaleString() }) + ' ';

    if (rankedCrops.length >= 2) {
      text += t('comparison_summary_rank2', { crop: rankedCrops[1].crop, currencyName, profit: rankedCrops[1].profit.toLocaleString() }) + ' ';
    }
    if (rankedCrops.length >= 3) {
      text += t('comparison_summary_rank3', { crop: rankedCrops[2].crop, currencyName, profit: rankedCrops[2].profit.toLocaleString() }) + ' ';
    }

    text += t('comparison_summary_avg', { currencyName, avgProfit: avgProfit.toLocaleString() }) + ' ';
    text += t('comparison_summary_conclusion', { farmerName });

    streamTextWithVoice(text);
  };

  // NEW: Handle crop selection for nutrient info
  const handleCropClick = (crop: RankedCrop) => {
    setSelectedCrop(crop);
    setShowNutrientInfo(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (rankedCrops.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center p-8">
          <Sprout className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">{t('no_data_title')}</h2>
          <p className="text-blue-200">{t('no_data_message', { farmerName })}</p>
          <Link href={`/interview/${sessionId}`} className="mt-6 inline-block px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
            {t('back_to_recommendations')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Voice Control Bar */}
      <div className="bg-blue-950 text-white p-3 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-full transition-all ${
                voiceEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <Volume2 className="w-5 h-5 opacity-50" />}
            </button>
            <span className="text-sm">
              {isSpeaking ? t('speaking') : voiceEnabled ? t('voice_ready') : t('voice_muted')}
            </span>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-3 py-1 bg-red-600 rounded-full text-xs hover:bg-red-700 transition-all flex items-center gap-1"
              >
                {t('stop')}
              </button>
            )}
          </div>
          <button
            onClick={streamComparison}
            className="px-4 py-2 bg-blue-700 rounded-lg text-sm hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            {t('listen_to_rankings')}
          </button>
        </div>
      </div>

      {/* Karaoke Streaming Display */}
      {isStreaming && streamingContent && (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-blue-900 p-6 shadow-xl sticky top-16 z-40">
          <div className="container mx-auto">
            <div className="flex items-start gap-4">
              <Volume2 className="w-6 h-6 text-blue-900 mt-1 animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <p className="text-2xl font-bold leading-relaxed">
                  {streamingContent.split(' ').map((word, idx, arr) => (
                    <span key={idx}>
                      <span className="bg-white/30 px-1 rounded">
                        {word}
                      </span>
                      {idx < arr.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-blue-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-150"
                      style={{
                        width: `${(currentWordIndex / wordsRef.current.length) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {currentWordIndex}/{wordsRef.current.length} {t('words')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-indigo-950 text-white p-6 shadow-xl">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/financial/${sessionId}`}
                className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  {t('rankings_title', { farmerName })}
                </h1>
                <p className="text-white/80 flex items-center gap-2">
                  <Sprout className="w-4 h-4" />
                  {t('comparing_count', { count: rankedCrops.length })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === "chart" ? "table" : "chart")}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl flex items-center gap-2 transition-all"
              >
                {viewMode === "chart" ? t('show_table') : t('show_chart')}
              </button>
              <Link
                href={`/ask/${sessionId}`}
                className="px-4 py-2 bg-white text-blue-900 rounded-xl font-medium hover:bg-white/90 transition-all flex items-center gap-2"
              >
                {t('ask_questions')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        {/* Business Summary Card */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 text-white shadow-xl mb-8">
          <div className="flex items-start gap-3">
            <Rocket className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="text-sm opacity-90">🔥 {t('business_insight_label', { farmerName: farmerName.toUpperCase() })}</p>
              <p className="font-medium">
                {t('most_profitable_enterprise_summary', { crop: rankedCrops[0]?.crop, profit: formatCurrencyForDisplay(rankedCrops[0]?.profit, currency) })}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">{t('most_profitable')}</p>
            <p className="text-2xl font-bold capitalize">{rankedCrops[0]?.crop}</p>
            <p className="text-xl">{formatCurrencyForDisplay(rankedCrops[0]?.profit, currency)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">{t('avg_profit_per_enterprise')}</p>
            <p className="text-2xl font-bold">
              {formatCurrencyForDisplay(rankedCrops.reduce((sum, c) => sum + c.profit, 0) / rankedCrops.length, currency)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">{t('total_enterprises')}</p>
            <p className="text-2xl font-bold">{rankedCrops.length}</p>
          </div>
        </div>

        {/* CHART VIEW - Side by side bars with hover effects */}
        {viewMode === "chart" && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-300">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-900">
              <BarChart3 className="w-5 h-5" />
              {t('profit_comparison', { farmerName })}
            </h2>

            {/* Bar Chart Container */}
            <div className="flex items-end justify-center gap-0 min-h-[450px] w-full">
              {rankedCrops.map((crop, index) => {
                const barHeight = (crop.profit / maxProfit) * 300;
                const roi = (crop.profit / crop.costs) * 100;

                return (
                  <div
                    key={crop.crop}
                    className="flex-1 flex flex-col items-center group cursor-pointer"
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                    onClick={() => handleCropClick(crop)}
                  >
                    {/* Profit amount (always visible) */}
                    <div className="mb-2 text-center transition-all duration-300">
                      <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                        hoveredBar === index
                          ? 'bg-yellow-400 text-blue-900 scale-110'
                          : 'bg-blue-100 text-blue-900'
                      }`}>
                        {formatCurrencyForDisplay(crop.profit, currency)}
                      </span>
                    </div>

                    {/* Bar with ROI inside (always visible) and hover effects */}
                    <div className="relative w-full px-1">
                      <div
                        className={`w-full bg-gradient-to-t ${crop.barColor} rounded-t-lg transition-all duration-300 flex flex-col items-center justify-center text-white font-bold`}
                        style={{
                          height: `${barHeight}px`,
                          minHeight: '80px',
                          transform: hoveredBar === index ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: hoveredBar === index ? '0 10px 25px -5px rgba(0,0,0,0.3)' : 'none'
                        }}
                      >
                        {/* Crop name */}
                        <span className="text-lg font-bold mb-1 drop-shadow-lg">
                          {crop.crop.toUpperCase()} {t('enterprise')}
                        </span>

                        {/* ROI inside the bar (always visible) */}
                        <span className="text-xs bg-white/30 px-2 py-1 rounded-full backdrop-blur-sm">
                          ROI: {formatPercentage(roi)}
                        </span>

                        {/* NEW: Damage indicator if plants were damaged */}
                        {crop.plantsDamaged && crop.plantsDamaged > 0 && (
                          <span className="absolute -top-2 -right-2">
                            <span className="flex h-5 w-5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">
                                !
                              </span>
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rank indicator below bar */}
                    <div className="mt-2 flex items-center justify-center gap-1">
                      {crop.rank === 1 && <Crown className="w-5 h-5 text-yellow-500" />}
                      {crop.rank === 2 && <Trophy className="w-5 h-5 text-gray-400" />}
                      {crop.rank === 3 && <Award className="w-5 h-5 text-amber-600" />}
                      <span className="text-xs text-white">{t('rank')} {crop.rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-6 flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-t from-yellow-500 to-amber-400 rounded"></div>
                  <span className="text-sm text-blue-800">{t('profit_bar')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-blue-800">{t('rank_1_label')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-blue-800">{t('rank_2_label')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-blue-800">{t('rank_3_label')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === "table" && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-300">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-900">
              <Scale className="w-5 h-5" />
              {t('rankings_title', { farmerName })}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="p-4 text-center rounded-tl-xl">{t('rank')}</th>
                    <th className="p-4 text-left">{t('crop_enterprise')}</th>
                    <th className="p-4 text-right">{t('revenue')}</th>
                    <th className="p-4 text-right">{t('costs')}</th>
                    <th className="p-4 text-right">{t('profit')}</th>
                    <th className="p-4 text-center">{t('roi')}</th>
                    <th className="p-4 text-right rounded-tr-xl">{t('vs_top')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedCrops.map((crop, index) => {
                    const percentageOfTop = (crop.profit / maxProfit) * 100;
                    const roi = (crop.profit / crop.costs) * 100;

                    return (
                      <tr
                        key={crop.crop}
                        className={`border-b border-blue-100 hover:bg-blue-50 transition-all cursor-pointer ${
                          index === 0 ? 'bg-yellow-50' :
                          index === 1 ? 'bg-gray-50' :
                          index === 2 ? 'bg-orange-50' : ''
                        }`}
                        onClick={() => handleCropClick(crop)}
                      >
                        <td className="p-4 text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mx-auto ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {crop.rank}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-blue-900 capitalize flex items-center gap-2">
                          {getCropIcon(crop.crop)}
                          {crop.crop} {t('enterprise')}
                          {/* NEW: Damage indicator */}
                          {crop.plantsDamaged && crop.plantsDamaged > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                              {crop.plantsDamaged} damaged
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right text-blue-900">{formatCurrencyForDisplay(crop.revenue, currency)}</td>
                        <td className="p-4 text-right text-blue-900">{formatCurrencyForDisplay(crop.costs, currency)}</td>
                        <td className="p-4 text-right font-bold text-blue-900">{formatCurrencyForDisplay(crop.profit, currency)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            roi > 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {formatPercentage(roi)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  index === 0 ? 'bg-green-500' :
                                  index === 1 ? 'bg-blue-500' :
                                  index === 2 ? 'bg-orange-500' :
                                  'bg-purple-500'
                                }`}
                                style={{ width: `${percentageOfTop}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{percentageOfTop.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NEW: Nutrient Info Modal */}
        {showNutrientInfo && selectedCrop && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNutrientInfo(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-900 capitalize flex items-center gap-2">
                  {getCropIcon(selectedCrop.crop)}
                  {selectedCrop.crop} {t('enterprise')}
                </h3>
                <button
                  onClick={() => setShowNutrientInfo(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Nutrient information from fertilizer plan */}
              {selectedCrop.fertilizerPlan && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-xl">
                    <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                      <Beaker className="w-4 h-4" />
                      Fertilizer Plan
                    </h4>
                    <p className="text-sm text-green-700">
                      Total investment: {formatCurrencyForDisplay(selectedCrop.fertilizerPlan.totalCost, currency)}
                    </p>
                  </div>

                  {/* Show planting fertilizer nutrients */}
                  {selectedCrop.fertilizerPlan.plantingRecommendations?.map((rec: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-medium text-blue-800">{rec.brand} ({rec.npk})</p>
                      <p className="text-sm text-gray-600">Amount: {rec.amountKg}kg</p>
                      {rec.provides && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          {rec.provides.n > 0 && (
                            <div className="bg-blue-50 p-2 rounded">
                              <span className="text-blue-600">N: {rec.provides.n.toFixed(1)}kg</span>
                            </div>
                          )}
                          {rec.provides.p > 0 && (
                            <div className="bg-blue-50 p-2 rounded">
                              <span className="text-blue-600">P: {rec.provides.p.toFixed(1)}kg</span>
                            </div>
                          )}
                          {rec.provides.k > 0 && (
                            <div className="bg-blue-50 p-2 rounded">
                              <span className="text-blue-600">K: {rec.provides.k.toFixed(1)}kg</span>
                            </div>
                          )}
                          {rec.provides.s > 0 && (
                            <div className="bg-purple-50 p-2 rounded">
                              <span className="text-purple-600">S: {rec.provides.s.toFixed(1)}kg</span>
                            </div>
                          )}
                          {rec.provides.ca > 0 && (
                            <div className="bg-purple-50 p-2 rounded">
                              <span className="text-purple-600">Ca: {rec.provides.ca.toFixed(1)}kg</span>
                            </div>
                          )}
                          {rec.provides.mg > 0 && (
                            <div className="bg-purple-50 p-2 rounded">
                              <span className="text-purple-600">Mg: {rec.provides.mg.toFixed(1)}kg</span>
                            </div>
                          )}
                          {rec.provides.zn > 0 && (
                            <div className="bg-purple-50 p-2 rounded">
                              <span className="text-purple-600">Zn: {rec.provides.zn.toFixed(1)}kg</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Damage report if any */}
              {selectedCrop.plantsDamaged && selectedCrop.plantsDamaged > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-xl">
                  <p className="text-sm text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Plants damaged beyond recovery: {selectedCrop.plantsDamaged.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowNutrientInfo(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Business Insight Card */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Wallet className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">💼 {t('business_insight_label', { farmerName: farmerName.toUpperCase() })}</h3>
              <p className="text-lg opacity-90">
                {t('top_enterprise_detail', {
                  crop: rankedCrops[0]?.crop,
                  profit: formatCurrencyForDisplay(rankedCrops[0]?.profit, currency)
                })}
                {rankedCrops.length >= 2 && t('rank2_detail', {
                  crop: rankedCrops[1].crop,
                  profit: formatCurrencyForDisplay(rankedCrops[1].profit, currency)
                })}
              </p>
              <p className="mt-3 text-white/80">
                🔥 {t('pro_tip', { symbol: currency.symbol })}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <Link
            href={`/financial/${sessionId}`}
            className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all flex items-center gap-2 border border-white/30"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('back_to_financial')}
          </Link>

          <Link
            href={`/ask/${sessionId}`}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-3 shadow-lg"
          >
            {t('continue_to_qa')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Reminder to test soil yearly */}
        <div className="mt-4 text-center text-white/50 text-sm">
          🔬 {t('soil_test_reminder_custom', { farmerName })}
        </div>
      </div>
    </div>
  );
}