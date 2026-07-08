// lib/utils/voiceHelpers.ts
import { CountryCurrency } from '@/lib/config/currency';

export function getCurrencyNameForSpeech(currency: CountryCurrency): string {
  const currencyNames: Record<string, string> = {
    'KES': 'Kenyan Shillings',
    'UGX': 'Ugandan Shillings',
    'TZS': 'Tanzanian Shillings',
    'RWF': 'Rwandan Francs',
    'BIF': 'Burundian Francs',
    'SSP': 'South Sudanese Pounds',
    'ETB': 'Ethiopian Birr',
    'SOS': 'Somali Shillings',
    'DJF': 'Djiboutian Francs',
    'ERN': 'Eritrean Nakfa',
    'NGN': 'Nigerian Nairas',
    'GHS': 'Ghanaian Cedis',
    'XOF': 'West African CFA Francs',
    'XAF': 'Central African CFA Francs',
    'GNF': 'Guinean Francs',
    'LRD': 'Liberian Dollars',
    'SLL': 'Sierra Leonean Leones',
    'GMD': 'Gambian Dalasis',
    'CVE': 'Cape Verdean Escudos',
    'CDF': 'Congolese Francs',
    'AOA': 'Angolan Kwanzas',
    'STN': 'São Tomé and Príncipe Dobras',
    'ZAR': 'South African Rand',
    'NAD': 'Namibian Dollars',
    'BWP': 'Botswana Pula',
    'ZWL': 'Zimbabwean Dollars',
    'ZMW': 'Zambian Kwacha',
    'MWK': 'Malawian Kwacha',
    'MZN': 'Mozambican Meticais',
    'MGA': 'Malagasy Ariary',
    'KMF': 'Comorian Francs',
    'MUR': 'Mauritian Rupees',
    'SCR': 'Seychellois Rupees',
    'SZL': 'Swazi Lilangeni',
    'LSL': 'Lesotho Loti',
    'EGP': 'Egyptian Pounds',
    'SDG': 'Sudanese Pounds',
    'LYD': 'Libyan Dinars',
    'TND': 'Tunisian Dinars',
    'DZD': 'Algerian Dinars',
    'MAD': 'Moroccan Dirhams',
    'MRU': 'Mauritanian Ouguiya',
    'USD': 'US Dollars',
    'GBP': 'British Pounds',
    'EUR': 'Euros'
  };

  return currencyNames[currency.code] || currency.name;
}

export function personalizeText(text: string, farmerName: string, frequency: number = 3): string {
  if (!farmerName) return text;

  let nameCount = 0;

  let personalized = text
    .replace(/\b(?:farmer|user)\b/gi, () => {
      nameCount++;
      return nameCount % frequency === 0 ? farmerName : 'the farmer';
    })
    .replace(/\byour\b/gi, () => {
      nameCount++;
      return nameCount % frequency === 0 ? `the ${farmerName}'s` : 'your';
    })
    .replace(/\byou\b/gi, () => {
      nameCount++;
      return nameCount % frequency === 0 ? farmerName : 'you';
    });

  return personalized;
}

export function addBusinessFlavor(text: string): string {
  const businessPhrases = [
    `Remember, this is your business. `,
    `Think profit. `,
    `Produce more with less. `,
    `More money in your pocket. `,
    `This is your enterprise. `,
    `Every shilling counts. `,
    `Make every shilling work for you. `,
    `Your farm is an investment. `,
    `Maximize your returns. `,
  ];

  const randomIndex = Math.floor(Math.random() * businessPhrases.length);
  return businessPhrases[randomIndex] + text;
}

export function addNaturalPauses(text: string): string {
  return text
    .replace(/\. /g, '. ... ')
    .replace(/\? /g, '? ... ')
    .replace(/\! /g, '! ... ');
}

export function cleanTextOfEmojisAndFormatting(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s?/g, '')
    .replace(/_/g, '')
    .replace(/~/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatCurrencyForSpeechWithName(
  amount: number,
  currency: CountryCurrency,
  farmerName?: string
): string {
  const currencyName = getCurrencyNameForSpeech(currency);
  let text = `${currencyName} ${amount.toLocaleString()}`;

  if (farmerName) {
    text = personalizeText(text, farmerName, 3);
  }

  return text;
}

export function getCelebratoryMessage(
  roi: number,
  farmerName: string,
  currency: CountryCurrency
): string {
  const currencyName = getCurrencyNameForSpeech(currency);

  if (roi > 200) {
    return `Excellent! Your return on investment is ${roi.toFixed(1)} percent. That's ${currencyName} ${(roi/100).toFixed(1)} profit for every ${currency.symbol} 1 invested.`;
  } else if (roi > 100) {
    return `Great job! Your return on investment is ${roi.toFixed(1)} percent. Every ${currency.symbol} 1 invested returns ${currencyName} ${(roi/100).toFixed(1)}.`;
  } else if (roi > 50) {
    return `Good work! Your return on investment is ${roi.toFixed(1)} percent. We can still improve this.`;
  } else {
    return `Your return on investment is ${roi.toFixed(1)} percent. Let's work together to increase this.`;
  }
}

export function getSavingsMessage(
  amount: number,
  farmerName: string,
  currency: CountryCurrency
): string {
  const currencyName = getCurrencyNameForSpeech(currency);

  const messages = [
    `You saved ${currencyName} ${amount.toLocaleString()}!`,
    `That's ${currencyName} ${amount.toLocaleString()} in your pocket!`,
    `${currencyName} ${amount.toLocaleString()} saved! Every shilling counts in your business.`,
    `You just saved ${currencyName} ${amount.toLocaleString()}! Put that toward your next investment.`,
  ];

  const randomIndex = Math.floor(Math.random() * messages.length);
  return personalizeText(messages[randomIndex], farmerName, 3);
}

export function getRecommendationIntro(
  farmerName: string,
  hasSoilTest: boolean,
  totalInvestment?: number,
  currency?: CountryCurrency
): string {
  let intro = `I've prepared personalized recommendations for your farm enterprise. `;

  if (hasSoilTest && totalInvestment && currency) {
    const currencyName = getCurrencyNameForSpeech(currency);
    intro += `Based on your soil test, I've calculated precision recommendations. Total investment is ${currencyName} ${totalInvestment.toLocaleString()}. `;
  } else if (hasSoilTest) {
    intro += `Based on your soil test, I've calculated precision recommendations. `;
  }

  intro += `Remember, every recommendation is designed to put more money in your pocket.`;

  return personalizeText(intro, farmerName, 2);
}