// components/Agent.tsx – Android voice fix: only local voices, time‑based karaoke
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useOfflineTranslation } from '@/lib/hooks/useOfflineTranslation';
import VoiceService from "@/lib/voice/VoiceService";
import { MPESAPaymentModal } from "@/components/Payment/MPESAPaymentModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OfflineBanner } from "@/components/OfflineBanner";
import {
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  Loader2,
  ArrowLeft,
  MessageCircle,
  BarChart3,
  Beaker,
  AlertCircle,
  Rocket,
  VolumeX,
} from "lucide-react";
import { useCurrency } from '@/lib/context/CurrencyContext';

const LINE_BREAK = '␊';

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  sessionData?: any;
}

interface StructuredItem {
  key: string;
  params?: Record<string, any>;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  sessionData
}: AgentProps) => {
  const { t, ready, i18n } = useOfflineTranslation();
  const { currency } = useCurrency();
  const [currentLang, setCurrentLang] = useState<string>('en');

  const getDisplaySymbol = (): string => currency.symbol || 'Ksh';

  const getSpokenCurrencyName = (): string => {
    const lang = i18n.language;
    switch (currency.code) {
      case 'KES':
        if (lang === 'fr') return 'Shillings kényans';
        if (lang === 'sw') return 'Shilingi za Kenya';
        return 'Kenyan Shillings';
      case 'UGX':
        if (lang === 'fr') return 'Shillings ougandais';
        if (lang === 'sw') return 'Shilingi za Uganda';
        return 'Ugandan Shillings';
      case 'TZS':
        if (lang === 'fr') return 'Shillings tanzaniens';
        if (lang === 'sw') return 'Shilingi za Tanzania';
        return 'Tanzanian Shillings';
      default:
        return currency.name;
    }
  };

  useEffect(() => {
    const sessionLang = sessionData?.language;
    if (sessionLang && sessionLang !== i18n.language) {
      i18n.changeLanguage(sessionLang);
      setCurrentLang(sessionLang);
      localStorage.setItem('preferred-language', sessionLang);
    }
  }, [sessionData, i18n]);

  useEffect(() => {
    if (sessionData?.structuredList) setStructuredList(sessionData.structuredList);
    if (sessionData?.structuredFinancialAdvice) setStructuredFinancialAdvice(sessionData.structuredFinancialAdvice);
  }, [sessionData]);

  const safeT = (key: string, params?: any): string => {
    try {
      if (key && (key.includes(' ') || key.includes('\n') || key.includes('.'))) return key;
      const template = i18n.t(key);
      if (!params) return template;
      let result = template;
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      }
      return result;
    } catch { return key; }
  };

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceInitializing, setVoiceInitializing] = useState(false);
  const [hasPaid, setHasPaid] = useState(true); // For demo; adjust as needed
  const [paymentChecked, setPaymentChecked] = useState(true);
  const [paymentUsed, setPaymentUsed] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeSpoken, setWelcomeSpoken] = useState(false);
  const [recommendationsSpoken, setRecommendationsSpoken] = useState(false);
  const [structuredList, setStructuredList] = useState<any[]>([]);
  const [structuredFinancialAdvice, setStructuredFinancialAdvice] = useState<any>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [readRecommendations, setReadRecommendations] = useState<Set<number>>(new Set());
  const [recommendationStreams, setRecommendationStreams] = useState<{[key: number]: string}>({});
  const [activeStreamingRec, setActiveStreamingRec] = useState<number | null>(null);
  const nameUsageCountRef = useRef(0);
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const mountedRef = useRef(true);
  const voiceServiceInitializedRef = useRef(false);
  const abortStreamingRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const soilTest = sessionData?.soilTest;
  const hasSoilTest = soilTest && soilTest.testDate;
  const interventions = soilTest?.interventions || [];
  const fertilizerPlan = soilTest?.fertilizerPlan;
  const farmerName = sessionData?.farmerName || userName || "Farmer";
  const farmerCountry = sessionData?.country || 'kenya';
  const cropName = sessionData?.crops?.[0] || '';

  const getGapKeyFromCrop = (crop: string): string => {
    if (!crop) return 'gap_generic';
    const cropLower = crop.toLowerCase().trim();
    const cropKeyMap: Record<string, string> = {
      'banana': 'gap_bananas', 'bananas': 'gap_bananas', 'maize': 'gap_maize', 'beans': 'gap_beans',
      'finger millet': 'gap_finger_millet', 'sorghum': 'gap_sorghum', 'onions': 'gap_onions',
      'avocados': 'gap_avocados', 'avocado': 'gap_avocados', 'rice': 'gap_rice', 'mangoes': 'gap_mangoes',
      'mango': 'gap_mangoes', 'pineapples': 'gap_pineapples', 'watermelons': 'gap_watermelons',
      'carrots': 'gap_carrots', 'chillies': 'gap_chillies', 'spinach': 'gap_spinach', 'pigeonpeas': 'gap_pigeonpeas',
      'bambaranuts': 'gap_bambaranuts', 'yams': 'gap_yams', 'taro': 'gap_taro', 'okra': 'gap_okra',
      'tea': 'gap_tea', 'macadamia': 'gap_macadamia', 'cocoa': 'gap_cocoa', 'soya beans': 'gap_soya_beans',
      'cowpeas': 'gap_cowpeas', 'green grams': 'gap_green_grams', 'groundnuts': 'gap_groundnuts',
      'sunflower': 'gap_sunflower', 'simsim': 'gap_simsim', 'coffee': 'gap_coffee', 'cotton': 'gap_cotton',
      'sugarcane': 'gap_sugarcane', 'tobacco': 'gap_tobacco', 'cassava': 'gap_cassava',
      'sweet potatoes': 'gap_sweet_potatoes', 'irish potatoes': 'gap_irish_potatoes', 'tomatoes': 'gap_tomatoes',
      'kales': 'gap_kales', 'cabbages': 'gap_cabbages', 'capsicums': 'gap_capsicums', 'brinjals': 'gap_brinjals',
      'french beans': 'gap_french_beans', 'garden peas': 'gap_garden_peas', 'oranges': 'gap_oranges',
      'pawpaws': 'gap_pawpaws', 'passion fruit': 'gap_passion_fruit', 'lemons': 'gap_lemons', 'limes': 'gap_limes',
      'grapefruit': 'gap_grapefruit', 'guava': 'gap_guava', 'jackfruit': 'gap_jackfruit', 'breadfruit': 'gap_breadfruit',
      'pomegranate': 'gap_pomegranate', 'star fruit': 'gap_star_fruit', 'coconut': 'gap_coconut', 'cashew': 'gap_cashew',
      'fig': 'gap_fig', 'date palm': 'gap_date_palm', 'mulberry': 'gap_mulberry', 'lychee': 'gap_lychee',
      'persimmon': 'gap_persimmon', 'gooseberry': 'gap_gooseberry', 'currant': 'gap_currant', 'elderberry': 'gap_elderberry',
      'rambutan': 'gap_rambutan', 'durian': 'gap_durian', 'mangosteen': 'gap_mangosteen', 'longan': 'gap_longan',
      'marula': 'gap_marula', 'vanilla': 'gap_vanilla', 'cardamom': 'gap_cardamom', 'cinnamon': 'gap_cinnamon',
      'cloves': 'gap_cloves', 'black pepper': 'gap_black_pepper', 'lemon grass': 'gap_lemon_grass',
      'rosemary': 'gap_rosemary', 'thyme': 'gap_thyme', 'parsley': 'gap_parsley', 'coriander': 'gap_coriander',
      'cauliflower': 'gap_cauliflower', 'broccoli': 'gap_broccoli', 'leeks': 'gap_leeks', 'celery': 'gap_celery',
      'lettuce': 'gap_lettuce', 'radish': 'gap_radish', 'beetroot': 'gap_beetroot', 'sisal': 'gap_sisal',
      'bamboo': 'gap_bamboo', 'napier grass': 'gap_napier_grass', 'rhodes grass': 'gap_rhodes_grass',
      'lucerne': 'gap_lucerne', 'aloe vera': 'gap_aloe_vera', 'hibiscus': 'gap_hibiscus', 'brachiaria': 'gap_brachiaria',
      'guinea grass': 'gap_guinea_grass', 'buffel grass': 'gap_buffel_grass', 'napier hybrid': 'gap_napier_hybrid',
      'oats': 'gap_oats', 'italian ryegrass': 'gap_italian_ryegrass', 'timothy grass': 'gap_timothy_grass',
      'orchard grass': 'gap_orchard_grass', 'white clover': 'gap_white_clover', 'forage sorghum': 'gap_forage_sorghum',
      'alfalfa': 'gap_alfalfa', 'almond': 'gap_almond', 'artichoke': 'gap_artichoke', 'arugula': 'gap_arugula',
      'asparagus': 'gap_asparagus', 'barley': 'gap_barley', 'basil': 'gap_basil', 'birds eye chili': 'gap_birds_eye_chili',
      'brazil nut': 'gap_brazil_nut', 'buckwheat': 'gap_buckwheat', 'cayenne': 'gap_cayenne', 'chamomile': 'gap_chamomile',
      'chestnut': 'gap_chestnut', 'chickpea': 'gap_chickpea', 'clover': 'gap_clover', 'dill': 'gap_dill',
      'echinacea': 'gap_echinacea', 'endive': 'gap_endive', 'escarole': 'gap_escarole', 'faba bean': 'gap_faba_bean',
      'fennel': 'gap_fennel', 'fenugreek': 'gap_fenugreek', 'flax': 'gap_flax', 'fonio': 'gap_fonio',
      'frisee': 'gap_frisee', 'ginseng': 'gap_ginseng', 'goldenseal': 'gap_goldenseal', 'hazelnut': 'gap_hazelnut',
      'hemp': 'gap_hemp', 'hops': 'gap_hops', 'horseradish': 'gap_horseradish', 'jalapeno': 'gap_jalapeno',
      'jute': 'gap_jute', 'kenaf': 'gap_kenaf', 'kohlrabi': 'gap_kohlrabi', 'lavender': 'gap_lavender',
      'lentil': 'gap_lentil', 'mint': 'gap_mint', 'mushroom': 'gap_mushroom', 'mustard': 'gap_mustard',
      'oil palm': 'gap_oil_palm', 'oregano': 'gap_oregano', 'parsnip': 'gap_parsnip', 'peanut': 'gap_peanut',
      'pecan': 'gap_pecan', 'pistachio': 'gap_pistachio', 'potatoes': 'gap_potatoes', 'pumpkin': 'gap_pumpkin',
      'quinoa': 'gap_quinoa', 'rapeseed': 'gap_rapeseed', 'rhubarb': 'gap_rhubarb', 'rubber': 'gap_rubber',
      'rutabaga': 'gap_rutabaga', 'safflower': 'gap_safflower', 'sage': 'gap_sage', 'sesame': 'gap_sesame',
      'shea': 'gap_shea', 'spelt': 'gap_spelt', 'stinging nettle': 'gap_stinging_nettle', 'swiss chard': 'gap_swiss_chard',
      'tarragon': 'gap_tarragon', 'teff': 'gap_teff', 'triticale': 'gap_triticale', 'turnip': 'gap_turnip',
      'turnip greens': 'gap_turnip_greens', 'valerian': 'gap_valerian', 'vetch': 'gap_vetch', 'walnut': 'gap_walnut',
      'wasabi': 'gap_wasabi', 'watercress': 'gap_watercress', 'wheat': 'gap_wheat', 'shallots': 'gap_shallots',
      'chives': 'gap_chives', 'garlic': 'gap_garlic', 'african nightshade': 'gap_african_nightshade',
      'amaranth': 'gap_amaranth', 'spider plant': 'gap_spider_plant', 'pumpkin leaves': 'gap_pumpkin_leaves',
      'jute mallow': 'gap_jute_mallow', 'ethiopian kale': 'gap_ethiopian_kale', 'slender leaf': 'gap_slender_leaf',
      'oyster nut': 'gap_oyster_nut', 'mucuna': 'gap_mucuna', 'desmodium': 'gap_desmodium', 'dolichos': 'gap_dolichos',
      'canavalia': 'gap_canavalia', 'sunn hemp': 'gap_sunn_hemp', 'crotalaria paulina': 'gap_crotalaria_paulina',
      'moringa': 'gap_moringa', 'ginger': 'gap_ginger', 'turmeric': 'gap_turmeric',
    };
    return cropKeyMap[cropLower] || 'gap_generic';
  };

  const recognitionLanguage = (() => {
    const lang = i18n.language || 'en';
    if (lang === 'en-GB') return 'en-GB';
    if (lang === 'en') return 'en-US';
    if (lang === 'fr') return 'fr-FR';
    if (lang === 'sw') return 'sw-KE';
    if (lang === 'es') return 'es-ES';
    return 'en-US';
  })();

  // ========== VOICE CANDIDATES: ONLY LOCAL / OFFLINE VOICES ==========
  const getLocalVoiceCandidates = (): SpeechSynthesisVoice[] => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return [];

    const isLocal = (v: SpeechSynthesisVoice) => {
      const name = v.name.toLowerCase();
      return !name.includes('online') && !name.includes('natural') && !name.includes('google') && !name.includes('cloud') && !name.includes('remote');
    };

    // Filter only local voices
    const localVoices = voices.filter(isLocal);
    if (localVoices.length === 0) return [];

    // Prioritise by language: exact match, then en-GB, en-US, any English, then any
    const exact = localVoices.filter(v => v.lang === recognitionLanguage);
    const enGB = localVoices.filter(v => v.lang === 'en-GB');
    const enUS = localVoices.filter(v => v.lang === 'en-US');
    const anyEn = localVoices.filter(v => v.lang.startsWith('en'));
    const any = [...localVoices];

    const candidates: SpeechSynthesisVoice[] = [];
    const addUnique = (list: SpeechSynthesisVoice[]) => {
      for (const v of list) {
        if (!candidates.some(ex => ex.name === v.name && ex.lang === v.lang)) {
          candidates.push(v);
        }
      }
    };
    addUnique(exact);
    addUnique(enGB);
    addUnique(enUS);
    addUnique(anyEn);
    addUnique(any);
    return candidates;
  };

  const waitForVoices = (maxAttempts = 10): Promise<void> => {
    return new Promise((resolve) => {
      const check = (attempt = 0) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
          resolve();
        } else if (attempt < maxAttempts) {
          setTimeout(() => check(attempt + 1), 300);
        } else {
          setVoicesLoaded(false);
          resolve();
        }
      };
      check();
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      waitForVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => waitForVoices();
      }
    }
  }, []);

  useEffect(() => {
    setHasPaid(true);
    setPaymentChecked(true);
  }, [interviewId, userId]);

  useEffect(() => {
    if (!mountedRef.current) return;
    if (voiceServiceInitializedRef.current && voiceServiceRef.current) return;

    if (!voiceEnabled) {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.destroy();
        voiceServiceRef.current = null;
        voiceServiceInitializedRef.current = false;
      }
      return;
    }

    if (voiceEnabled && !voiceServiceRef.current && !voiceServiceInitializedRef.current) {
      let currentUserId = userId;
      if (!currentUserId) {
        currentUserId = localStorage.getItem('userId') || `user-${Date.now()}`;
        localStorage.setItem('userId', currentUserId);
      }

      try {
        voiceServiceRef.current = new VoiceService({
          interviewId: interviewId || `demo-${Date.now()}`,
          userId: currentUserId,
          type: "practice",
          speechRate: 0.9,
          speechVolume: 0.8,
          country: farmerCountry,
          farmerName: farmerName
        });
        voiceServiceInitializedRef.current = true;
        setVoiceInitializing(false);
        toast.success(safeT('smart_farmer_here') || "Smart Farmer AI is here!");
      } catch (error: any) {
        console.error("Failed to initialize VoiceService:", error);
        toast.error(safeT('voice_service_failed') || "Failed to initialize voice service");
        setVoiceInitializing(false);
      }
    }
  }, [voiceEnabled, farmerName, farmerCountry, safeT]);

  if (!ready) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner fullScreen={false} message="Loading your farm advisor..." />
      </div>
    );
  }

  const cleanText = (text: string): string => {
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/\*\*\*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/_/g, '')
      .replace(/~/g, '')
      .replace(/`/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const prepareForSpeech = (text: string): string => {
    let speechText = cleanText(text);
    const currencyName = getSpokenCurrencyName();
    const symbol = currency.symbol;
    const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    speechText = speechText.replace(new RegExp(`${escapedSymbol}\\s`, 'g'), `${currencyName} `);
    speechText = speechText.replace(new RegExp(`\\b${escapedSymbol}\\b`, 'g'), currencyName);
    speechText = speechText
      .replace(/Ksh\s/g, `${currencyName} `)
      .replace(/Ksh\b/g, currencyName)
      .replace(/USh\s/g, `${currencyName} `)
      .replace(/USh\b/g, currencyName)
      .replace(/TSh\s/g, `${currencyName} `)
      .replace(/TSh\b/g, currencyName);

    nameUsageCountRef.current++;
    const useName = nameUsageCountRef.current % 3 === 0;
    speechText = speechText
      .replace(/\b(farmer)\b/gi, useName ? farmerName : 'the farmer')
      .replace(/\b(you)\b/gi, useName ? farmerName : 'you')
      .replace(/\b(your)\b/gi, useName ? `${farmerName}'s` : 'your');
    return speechText;
  };

  // ========== KARAOKE STREAMING WITH LOCAL VOICES ONLY ==========
  const streamRecommendationKaraoke = async (rawRecommendation: string, index: number) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    abortStreamingRef.current = false;
    setActiveStreamingRec(index);
    setRecommendationStreams(prev => ({ ...prev, [index]: "" }));

    const speechText = prepareForSpeech(rawRecommendation);
    const fullRawText = rawRecommendation;
    const estimatedDuration = Math.max(1000, speechText.length * 70);

    // Time-based animation (always runs)
    let animationId: number | null = null;
    let startTime = 0;
    const updateProgress = (progress: number) => {
      if (abortStreamingRef.current) return;
      const charIndex = Math.floor(progress * fullRawText.length);
      setRecommendationStreams(prev => ({ ...prev, [index]: fullRawText.substring(0, charIndex) }));
    };
    const startAnimation = () => {
      if (animationId) cancelAnimationFrame(animationId);
      startTime = 0;
      const animate = (timestamp: number) => {
        if (abortStreamingRef.current) return;
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / estimatedDuration);
        updateProgress(progress);
        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          setRecommendationStreams(prev => ({ ...prev, [index]: fullRawText }));
          animationId = null;
        }
      };
      animationId = requestAnimationFrame(animate);
    };
    startAnimation();

    // Voice candidates – only local voices
    const candidates = getLocalVoiceCandidates();
    if (candidates.length === 0) {
      // No local voices – rely on animation only; mark as read when animation ends
      setTimeout(() => {
        if (activeStreamingRec === index && !readRecommendations.has(index)) {
          setRecommendationStreams(prev => ({ ...prev, [index]: fullRawText }));
          setReadRecommendations(prev => new Set(prev).add(index));
          setActiveStreamingRec(null);
        }
      }, estimatedDuration + 500);
      return;
    }

    let voiceIdx = 0;
    const trySpeak = () => {
      if (voiceIdx >= candidates.length) {
        // All local voices failed – rely on animation
        setTimeout(() => {
          if (activeStreamingRec === index && !readRecommendations.has(index)) {
            setRecommendationStreams(prev => ({ ...prev, [index]: fullRawText }));
            setReadRecommendations(prev => new Set(prev).add(index));
            setActiveStreamingRec(null);
          }
        }, estimatedDuration + 500);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(speechText);
      const voice = candidates[voiceIdx];
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      utterance.onend = () => {
        if (animationId) cancelAnimationFrame(animationId);
        setRecommendationStreams(prev => ({ ...prev, [index]: fullRawText }));
        setReadRecommendations(prev => new Set(prev).add(index));
        setActiveStreamingRec(null);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (err) => {
        console.warn(`Local voice ${voice.name} (${voice.lang}) failed, trying next`);
        voiceIdx++;
        trySpeak();
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };
    trySpeak();

    // Safety timeout
    setTimeout(() => {
      if (activeStreamingRec === index && !readRecommendations.has(index)) {
        if (animationId) cancelAnimationFrame(animationId);
        setRecommendationStreams(prev => ({ ...prev, [index]: fullRawText }));
        setReadRecommendations(prev => new Set(prev).add(index));
        setActiveStreamingRec(null);
      }
    }, estimatedDuration + 2000);
  };

  const speakWithVoice = async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      if (!voicesLoaded) {
        await waitForVoices();
      }

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      setTimeout(() => {
        const speechText = prepareForSpeech(text);
        const candidates = getLocalVoiceCandidates();
        if (candidates.length === 0) {
          resolve();
          return;
        }
        let idx = 0;
        const trySpeak = () => {
          if (idx >= candidates.length) {
            resolve();
            return;
          }
          const utterance = new SpeechSynthesisUtterance(speechText);
          const voice = candidates[idx];
          utterance.voice = voice;
          utterance.lang = voice.lang;
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          utterance.volume = 1.0;

          utterance.onend = () => resolve();
          utterance.onerror = () => {
            idx++;
            trySpeak();
          };
          window.speechSynthesis.speak(utterance);
        };
        trySpeak();

        setTimeout(() => resolve(), Math.max(text.length * 20, 3000));
      }, 100);
    });
  };

  const streamAllRecommendations = async () => {
    if (structuredList.length === 0 || recommendationsSpoken) return;

    setRecommendationsSpoken(true);
    nameUsageCountRef.current = 0;

    const currencyName = getSpokenCurrencyName();

    let introMessage = safeT('prepared_recommendations', 'I\'ve prepared personalized recommendations for your farm enterprise. ');
    if (hasSoilTest && fertilizerPlan?.totalCost) {
      introMessage += safeT('soil_test_recommendations', {
        amount: fertilizerPlan.totalCost.toLocaleString(),
        currencyName
      }) + ' ';
    } else if (hasSoilTest) {
      introMessage += safeT('soil_test_calculated', 'Based on your soil test, I\'ve calculated precision fertilizer recommendations. ');
    }

    await speakWithVoice(introMessage);
    await new Promise(resolve => setTimeout(resolve, 2000));

    for (let i = 0; i < structuredList.length; i++) {
      let content = '';
      const item = structuredList[i];
      if (item.params?.content) {
        content = item.params.content;
      } else if (item.key === 'gap_grouped') {
        const parts = [];
        if (item.params?.title) parts.push(item.params.title);
        let gapKey = item.params?.gapKey;
        if (!gapKey && cropName) {
          gapKey = getGapKeyFromCrop(cropName);
        }
        if (gapKey) parts.push(safeT(gapKey, {}));
        if (item.params?.remember) parts.push(item.params.remember);
        content = parts.join(LINE_BREAK);
      } else if (item.key === 'damage_report_grouped') {
        const parts = [];
        if (item.params?.title) parts.push(item.params.title);
        if (item.params?.message) parts.push(item.params.message);
        if (item.params?.advice) parts.push(item.params.advice);
        if (item.params?.followUp) parts.push(item.params.followUp);
        content = parts.join(LINE_BREAK);
      } else if (item.key === 'crop_benefits_grouped') {
        const p = item.params;
        const parts = [];
        if (p.title) parts.push(p.title);
        if (p.subtitle) parts.push(p.subtitle);
        if (p.nutrientsHeader) parts.push(p.nutrientsHeader);
        if (p.nutrientsList) parts.push(p.nutrientsList);
        if (p.healthHeader) parts.push(p.healthHeader);
        if (p.healthList) parts.push(p.healthList);
        content = parts.join(LINE_BREAK);
      } else {
        content = safeT(item.key, item.params);
      }
      if (!content || content.trim() === '') {
        console.log(`⚠️ Skipping empty recommendation at index ${i}`);
        continue;
      }
      await streamRecommendationKaraoke(content, i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (structuredFinancialAdvice) {
      const financialText = safeT(structuredFinancialAdvice.key, structuredFinancialAdvice.params);
      await speakWithVoice(financialText);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await speakWithVoice(safeT('post_recommendations'));
  };

  const startVoiceInterview = async () => {
    if (!voiceEnabled) {
      toast.error("Please turn voice ON first by clicking the 'Voice ON' button");
      return;
    }

    if (interviewId && userId) {
      if (paymentUsed) {
        toast.info(safeT('payment_used_new'));
        setShowPaymentModal(true);
        return;
      }
      if (!hasPaid) {
        toast.info(safeT('payment_required_to_start'));
        setShowPaymentModal(true);
        return;
      }
    }

    if (!voiceServiceRef.current) {
      const initToast = toast.loading(safeT('initializing_voice'));
      setVoiceInitializing(true);
      let attempts = 0;
      while (!voiceServiceRef.current && attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
      }
      toast.dismiss(initToast);
      setVoiceInitializing(false);
      if (!voiceServiceRef.current) {
        toast.error(safeT('voice_service_failed'));
        return;
      }
    }

    setIsLoading(true);

    try {
      if (sessionData && voiceServiceRef.current && typeof voiceServiceRef.current.startFarmerSession === 'function') {
        await voiceServiceRef.current.startFarmerSession(sessionData);
      }

      if (sessionData && !welcomeSpoken) {
        setWelcomeSpoken(true);
        nameUsageCountRef.current = 0;

        setRecommendationStreams({});
        setReadRecommendations(new Set());

        const welcomeText = safeT('welcome_farm_plan');
        await speakWithVoice(welcomeText);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await streamAllRecommendations();
      }

      toast.success(safeT('ready_ask_away'));
    } catch (error: any) {
      console.error("Failed to start:", error);
      toast.error(safeT('failed_to_start', { message: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const isStartButtonDisabled = isLoading || !voiceEnabled || !hasPaid || voiceInitializing;

  const getStartButtonText = () => {
    if (isLoading) return safeT('starting');
    if (voiceInitializing) return safeT('initializing');
    if (!hasPaid) return safeT('pay_to_start', { symbol: getDisplaySymbol(), amount: 3 });
    if (!voiceEnabled) return "Turn Voice ON First";
    return safeT('start_voice_session');
  };

  const renderRecommendationText = (item: StructuredItem, idx: number) => {
    let displayContent = '';

    if (item.params?.content) {
      displayContent = item.params.content;
    } else if (item.key === 'gap_grouped') {
      const parts = [];
      if (item.params?.title) parts.push(item.params.title);
      let gapKey = item.params?.gapKey;
      if (!gapKey && cropName) {
        gapKey = getGapKeyFromCrop(cropName);
      }
      if (gapKey) parts.push(safeT(gapKey, {}));
      if (item.params?.remember) parts.push(item.params.remember);
      displayContent = parts.join(LINE_BREAK);
    } else if (item.key === 'damage_report_grouped') {
      const parts = [];
      if (item.params?.title) parts.push(item.params.title);
      if (item.params?.message) parts.push(item.params.message);
      if (item.params?.advice) parts.push(item.params.advice);
      if (item.params?.followUp) parts.push(item.params.followUp);
      displayContent = parts.join(LINE_BREAK);
    } else if (item.key === 'crop_benefits_grouped') {
      const p = item.params;
      const parts = [];
      if (p.title) parts.push(p.title);
      if (p.subtitle) parts.push(p.subtitle);
      if (p.nutrientsHeader) parts.push(p.nutrientsHeader);
      if (p.nutrientsList) parts.push(p.nutrientsList);
      if (p.healthHeader) parts.push(p.healthHeader);
      if (p.healthList) parts.push(p.healthList);
      displayContent = parts.join(LINE_BREAK);
    } else {
      displayContent = safeT(item.key, item.params);
    }

    if (!displayContent || displayContent.trim() === '') {
      return null;
    }

    const displayedText = recommendationStreams[idx] || '';
    const isActive = activeStreamingRec === idx;
    const isRead = readRecommendations.has(idx);

    if (!isActive && !isRead) return null;

    const finalText = isActive ? displayedText : displayContent;
    if (!finalText) return null;

    const displaySymbol = getDisplaySymbol();
    const originalSymbol = currency.symbol;
    let processedText = finalText;
    if (displaySymbol !== originalSymbol) {
      const escapedOrig = originalSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processedText = processedText.replace(new RegExp(escapedOrig, 'g'), displaySymbol);
    }
    if (displaySymbol !== 'Ksh') {
      processedText = processedText.replace(/Ksh/g, displaySymbol);
    }

    const lines = processedText.split(/\n/);
    const progressPercent = (displayedText.length / displayContent.length) * 100;

    return (
      <div
        key={idx}
        className={`rounded-xl p-5 transition-all duration-300 border-2 ${
          isActive ? 'bg-purple-100 border-purple-500 shadow-2xl scale-105' : 'bg-purple-50 border-purple-300'
        }`}
      >
        <div className="flex items-start gap-4">
          <span className="rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 bg-purple-500 text-white">
            {idx + 1}
          </span>
          <div className="flex-1">
            <p className="text-xl text-gray-800 leading-relaxed">
              {lines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < lines.length - 1 && <br />}
                </span>
              ))}
            </p>
            {isActive && displayContent.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-sm text-purple-700 font-medium">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-emerald-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/interview/${interviewId}`} className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-xl">
              <ArrowLeft className="w-5 h-5 text-emerald-700" />
            </Link>
            <div className="relative">
              <Image src="/beautiful-avatar.png" alt={userName} width={48} height={48} className="rounded-full size-12 ring-4 ring-emerald-200" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-800">{userName}</h4>
              <div className="flex flex-wrap gap-1 text-xs">
                {sessionData?.crops && <span className="text-emerald-600">{sessionData.crops.join(", ")}</span>}
                {sessionData?.county && <span className="text-gray-500">• {sessionData.county}</span>}
                {sessionData?.country && <span className="text-gray-400">• {sessionData.country}</span>}
                {hasSoilTest && <span className="text-purple-600">• {safeT('soil_test')}</span>}
              </div>
              {interviewId && userId && (
                <div className="mt-1">
                  {hasPaid ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {safeT('payment_verified', { symbol: getDisplaySymbol(), amount: 3 })}
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {safeT('payment_required', { symbol: getDisplaySymbol(), amount: 3 })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-sm transition-all ${
                voiceEnabled
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
              }`}
            >
              {voiceEnabled ? <><Mic className="w-4 h-4" /><span>Voice ON</span></> : <><MicOff className="w-4 h-4" /><span>Voice OFF</span></>}
            </button>
            <button onClick={startVoiceInterview} disabled={isStartButtonDisabled} className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap ${!isStartButtonDisabled ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              <span className="flex items-center gap-2">
                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                {getStartButtonText()}
              </span>
            </button>
          </div>
        </div>
        {isSpeaking && (
          <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
            <Volume2 className="w-3 h-3 animate-pulse" />
            <span>{safeT('speaking')}</span>
          </div>
        )}
      </div>

      {!voiceEnabled && structuredList.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <VolumeX className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">Voice is OFF</p>
              <p className="text-sm text-yellow-700">Click "Voice ON" above, then "Start Voice Session" to hear recommendations with karaoke effect.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-row gap-4 justify-center">
        {sessionData?.grossMarginAnalysis && (
          <Link href={`/financial/${interviewId}`} className="flex-1">
            <button className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {safeT('view_financial_analysis')}
            </button>
          </Link>
        )}
        <Link href={`/ask/${interviewId}`} className="flex-1">
          <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {safeT('ask_questions')}
          </button>
        </Link>
      </div>

      {structuredList.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-xl">
          <h3 className="font-bold text-2xl mb-4 flex items-center gap-2 text-purple-800">
            <Sparkles className="w-6 h-6 text-purple-600" />
            {safeT('personalized_recommendations')}
            {activeStreamingRec !== null && (
              <span className="ml-auto flex items-center gap-2 text-purple-600">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span className="text-sm">{safeT('speaking')}</span>
              </span>
            )}
          </h3>
          <div className="mb-6 p-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl text-white">
            <p className="text-sm flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              {safeT('business_tip_short')}
            </p>
          </div>
          <div className="space-y-4">
            {structuredList.map((item, idx) => renderRecommendationText(item, idx))}
          </div>
          {interventions.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Beaker className="w-5 h-5" />
                {safeT('precision_fertilizer_calculations')}
              </h4>
              <div className="space-y-3">
                {interventions.map((inv: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-red-500 pl-3 py-1">
                    <p className="font-semibold text-gray-800">{inv.nutrient}: {inv.value} ({inv.level})</p>
                    <p className="text-sm text-gray-700">{inv.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!hasSoilTest && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
              <p className="text-yellow-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {safeT('soil_test_reminder')}
              </p>
            </div>
          )}
          <div className="mt-4 text-center text-sm text-gray-500">
            {safeT('yearly_testing_reminder')}
          </div>
        </div>
      )}

      <MPESAPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          setHasPaid(true);
          setPaymentUsed(false);
          toast.success(safeT('payment_confirmed'));
          setTimeout(() => startVoiceInterview(), 1500);
        }}
        cost={3}
        interviewId={interviewId || ""}
        userId={userId || ""}
      />

      <OfflineBanner />
    </div>
  );
};

export default Agent;