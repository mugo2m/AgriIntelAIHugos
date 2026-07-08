// lib/config/currency.ts – Extended to include all Spanish, French, English speaking countries
// (Keeps all original African entries + adds the rest)

export interface CountryCurrency {
  code: string;           // ISO currency code
  symbol: string;         // Symbol for display
  name: string;           // Full name for speech
  locale: string;         // Locale for formatting
  position: 'before' | 'after'; // Symbol position
  decimalPlaces: number;  // Number of decimal places
}

export const COUNTRY_CURRENCY_MAP: Record<string, CountryCurrency> = {
  // ========== EAST AFRICA (original – kept) ==========
  kenya: { code: 'KES', symbol: 'Ksh', name: 'Kenyan Shillings', locale: 'en-KE', position: 'before', decimalPlaces: 0 },
  uganda: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shillings', locale: 'en-UG', position: 'before', decimalPlaces: 0 },
  tanzania: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shillings', locale: 'en-TZ', position: 'before', decimalPlaces: 0 },
  rwanda: { code: 'RWF', symbol: 'FRw', name: 'Rwandan Francs', locale: 'en-RW', position: 'before', decimalPlaces: 0 },
  burundi: { code: 'BIF', symbol: 'FBu', name: 'Burundian Francs', locale: 'en-BI', position: 'before', decimalPlaces: 0 },
  southsudan: { code: 'SSP', symbol: 'SS£', name: 'South Sudanese Pounds', locale: 'en-SS', position: 'before', decimalPlaces: 2 },
  ethiopia: { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', locale: 'am-ET', position: 'before', decimalPlaces: 2 },
  somalia: { code: 'SOS', symbol: 'Sh.So.', name: 'Somali Shillings', locale: 'so-SO', position: 'before', decimalPlaces: 0 },
  djibouti: { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Francs', locale: 'fr-DJ', position: 'before', decimalPlaces: 0 },
  eritrea: { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa', locale: 'ti-ER', position: 'before', decimalPlaces: 2 },

  // ========== WEST AFRICA (original – kept) ==========
  nigeria: { code: 'NGN', symbol: '₦', name: 'Nigerian Nairas', locale: 'en-NG', position: 'before', decimalPlaces: 2 },
  ghana: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedis', locale: 'en-GH', position: 'before', decimalPlaces: 2 },
  senegal: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Francs', locale: 'fr-SN', position: 'after', decimalPlaces: 0 },
  ivorycoast: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Francs', locale: 'fr-CI', position: 'after', decimalPlaces: 0 },
  mali: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Francs', locale: 'fr-ML', position: 'after', decimalPlaces: 0 },
  burkinafaso: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Francs', locale: 'fr-BF', position: 'after', decimalPlaces: 0 },
  niger: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Francs', locale: 'fr-NE', position: 'after', decimalPlaces: 0 },
  togo: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Francs', locale: 'fr-TG', position: 'after', decimalPlaces: 0 },
  benin: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Francs', locale: 'fr-BJ', position: 'after', decimalPlaces: 0 },
  guinea: { code: 'GNF', symbol: 'FG', name: 'Guinean Francs', locale: 'fr-GN', position: 'before', decimalPlaces: 0 },
  guineabissau: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Francs', locale: 'pt-GW', position: 'after', decimalPlaces: 0 },
  liberia: { code: 'LRD', symbol: 'L$', name: 'Liberian Dollars', locale: 'en-LR', position: 'before', decimalPlaces: 2 },
  sierraleone: { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leones', locale: 'en-SL', position: 'before', decimalPlaces: 0 },
  gambia: { code: 'GMD', symbol: 'D', name: 'Gambian Dalasis', locale: 'en-GM', position: 'before', decimalPlaces: 2 },
  capoverde: { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudos', locale: 'pt-CV', position: 'after', decimalPlaces: 0 },

  // ========== CENTRAL AFRICA (original – kept) ==========
  cameroon: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Francs', locale: 'fr-CM', position: 'after', decimalPlaces: 0 },
  gabon: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Francs', locale: 'fr-GA', position: 'after', decimalPlaces: 0 },
  chad: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Francs', locale: 'fr-TD', position: 'after', decimalPlaces: 0 },
  car: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Francs', locale: 'fr-CF', position: 'after', decimalPlaces: 0 },
  equatorialguinea: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Francs', locale: 'es-GQ', position: 'after', decimalPlaces: 0 },
  congobrazzaville: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Francs', locale: 'fr-CG', position: 'after', decimalPlaces: 0 },
  congokinshasa: { code: 'CDF', symbol: 'FC', name: 'Congolese Francs', locale: 'fr-CD', position: 'before', decimalPlaces: 2 },
  angola: { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanzas', locale: 'pt-AO', position: 'before', decimalPlaces: 2 },
  saotome: { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobras', locale: 'pt-ST', position: 'after', decimalPlaces: 0 },

  // ========== SOUTHERN AFRICA (original – kept) ==========
  southafrica: { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA', position: 'before', decimalPlaces: 2 },
  namibia: { code: 'NAD', symbol: 'N$', name: 'Namibian Dollars', locale: 'en-NA', position: 'before', decimalPlaces: 2 },
  botswana: { code: 'BWP', symbol: 'P', name: 'Botswana Pula', locale: 'en-BW', position: 'before', decimalPlaces: 2 },
  zimbabwe: { code: 'ZWL', symbol: 'Z$', name: 'Zimbabwean Dollars', locale: 'en-ZW', position: 'before', decimalPlaces: 2 },
  zambia: { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', locale: 'en-ZM', position: 'before', decimalPlaces: 2 },
  malawi: { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha', locale: 'en-MW', position: 'before', decimalPlaces: 0 },
  mozambique: { code: 'MZN', symbol: 'MT', name: 'Mozambican Meticais', locale: 'pt-MZ', position: 'before', decimalPlaces: 2 },
  madagascar: { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary', locale: 'mg-MG', position: 'before', decimalPlaces: 0 },
  comoros: { code: 'KMF', symbol: 'CF', name: 'Comorian Francs', locale: 'fr-KM', position: 'after', decimalPlaces: 0 },
  mauritius: { code: 'MUR', symbol: 'Rs', name: 'Mauritian Rupees', locale: 'en-MU', position: 'before', decimalPlaces: 0 },
  seychelles: { code: 'SCR', symbol: 'SR', name: 'Seychellois Rupees', locale: 'en-SC', position: 'before', decimalPlaces: 2 },
  eswatini: { code: 'SZL', symbol: 'E', name: 'Swazi Lilangeni', locale: 'en-SZ', position: 'before', decimalPlaces: 2 },
  lesotho: { code: 'LSL', symbol: 'L', name: 'Lesotho Loti', locale: 'en-LS', position: 'before', decimalPlaces: 2 },

  // ========== NORTH AFRICA (original – kept) ==========
  egypt: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pounds', locale: 'ar-EG', position: 'before', decimalPlaces: 2 },
  sudan: { code: 'SDG', symbol: 'SDG', name: 'Sudanese Pounds', locale: 'ar-SD', position: 'before', decimalPlaces: 2 },
  libya: { code: 'LYD', symbol: 'LD', name: 'Libyan Dinars', locale: 'ar-LY', position: 'before', decimalPlaces: 3 },
  tunisia: { code: 'TND', symbol: 'DT', name: 'Tunisian Dinars', locale: 'ar-TN', position: 'before', decimalPlaces: 3 },
  algeria: { code: 'DZD', symbol: 'DA', name: 'Algerian Dinars', locale: 'ar-DZ', position: 'before', decimalPlaces: 2 },
  morocco: { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirhams', locale: 'ar-MA', position: 'before', decimalPlaces: 2 },
  mauritania: { code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya', locale: 'ar-MR', position: 'after', decimalPlaces: 1 },

  // ========== ADDED: SPANISH‑SPEAKING COUNTRIES ==========
  spain: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'es-ES', position: 'before', decimalPlaces: 2 },
  mexico: { code: 'MXN', symbol: '$', name: 'Mexican Pesos', locale: 'es-MX', position: 'before', decimalPlaces: 2 },
  guatemala: { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzals', locale: 'es-GT', position: 'before', decimalPlaces: 2 },
  elsalvador: { code: 'USD', symbol: '$', name: 'US Dollars', locale: 'es-SV', position: 'before', decimalPlaces: 2 },
  honduras: { code: 'HNL', symbol: 'L', name: 'Honduran Lempiras', locale: 'es-HN', position: 'before', decimalPlaces: 2 },
  nicaragua: { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdobas', locale: 'es-NI', position: 'before', decimalPlaces: 2 },
  costarica: { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón', locale: 'es-CR', position: 'before', decimalPlaces: 2 },
  panama: { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa', locale: 'es-PA', position: 'before', decimalPlaces: 2 },
  colombia: { code: 'COP', symbol: '$', name: 'Colombian Pesos', locale: 'es-CO', position: 'before', decimalPlaces: 2 },
  venezuela: { code: 'VES', symbol: 'Bs.', name: 'Bolívar', locale: 'es-VE', position: 'before', decimalPlaces: 2 },
  ecuador: { code: 'USD', symbol: '$', name: 'US Dollars', locale: 'es-EC', position: 'before', decimalPlaces: 2 },
  peru: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', locale: 'es-PE', position: 'before', decimalPlaces: 2 },
  bolivia: { code: 'BOB', symbol: 'Bs.', name: 'Bolivian Bolivianos', locale: 'es-BO', position: 'before', decimalPlaces: 2 },
  paraguay: { code: 'PYG', symbol: '₲', name: 'Paraguayan Guaraní', locale: 'es-PY', position: 'before', decimalPlaces: 0 },
  chile: { code: 'CLP', symbol: '$', name: 'Chilean Pesos', locale: 'es-CL', position: 'before', decimalPlaces: 0 },
  argentina: { code: 'ARS', symbol: '$', name: 'Argentine Pesos', locale: 'es-AR', position: 'before', decimalPlaces: 2 },
  uruguay: { code: 'UYU', symbol: '$', name: 'Uruguayan Pesos', locale: 'es-UY', position: 'before', decimalPlaces: 2 },
  cuba: { code: 'CUP', symbol: '$', name: 'Cuban Pesos', locale: 'es-CU', position: 'before', decimalPlaces: 2 },
  dominicanrepublic: { code: 'DOP', symbol: '$', name: 'Dominican Pesos', locale: 'es-DO', position: 'before', decimalPlaces: 2 },
  puertorico: { code: 'USD', symbol: '$', name: 'US Dollars', locale: 'es-PR', position: 'before', decimalPlaces: 2 },

  // ========== ADDED: FRENCH‑SPEAKING COUNTRIES (outside Africa) ==========
  france: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'fr-FR', position: 'before', decimalPlaces: 2 },
  belgium: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'fr-BE', position: 'before', decimalPlaces: 2 },
  switzerland: { code: 'CHF', symbol: 'CHF', name: 'Swiss Francs', locale: 'fr-CH', position: 'before', decimalPlaces: 2 },
  luxembourg: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'fr-LU', position: 'before', decimalPlaces: 2 },
  monaco: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'fr-MC', position: 'before', decimalPlaces: 2 },
  canada: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollars', locale: 'en-CA', position: 'before', decimalPlaces: 2 },
  haiti: { code: 'HTG', symbol: 'G', name: 'Haitian Gourdes', locale: 'fr-HT', position: 'before', decimalPlaces: 2 },
  frenchguiana: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'fr-GF', position: 'before', decimalPlaces: 2 },
  guadeloupe: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'fr-GP', position: 'before', decimalPlaces: 2 },
  martinique: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'fr-MQ', position: 'before', decimalPlaces: 2 },
  reunion: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'fr-RE', position: 'before', decimalPlaces: 2 },
  mayotte: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'fr-YT', position: 'before', decimalPlaces: 2 },
  newcaledonia: { code: 'XPF', symbol: 'F', name: 'CFP Francs', locale: 'fr-NC', position: 'after', decimalPlaces: 0 },
  frenchpolynesia: { code: 'XPF', symbol: 'F', name: 'CFP Francs', locale: 'fr-PF', position: 'after', decimalPlaces: 0 },
  vanuatu: { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu', locale: 'fr-VU', position: 'before', decimalPlaces: 0 },

  // ========== ADDED: ENGLISH‑SPEAKING COUNTRIES (UK & US) ==========
  unitedkingdom: { code: 'GBP', symbol: '£', name: 'British Pounds', locale: 'en-GB', position: 'before', decimalPlaces: 2 },
  uk: { code: 'GBP', symbol: '£', name: 'British Pounds', locale: 'en-GB', position: 'before', decimalPlaces: 2 },
  ireland: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'en-IE', position: 'before', decimalPlaces: 2 },
  guernsey: { code: 'GBP', symbol: '£', name: 'British Pounds', locale: 'en-GG', position: 'before', decimalPlaces: 2 },
  jersey: { code: 'GBP', symbol: '£', name: 'British Pounds', locale: 'en-JE', position: 'before', decimalPlaces: 2 },
  isleofman: { code: 'GBP', symbol: '£', name: 'British Pounds', locale: 'en-IM', position: 'before', decimalPlaces: 2 },
  gibraltar: { code: 'GIP', symbol: '£', name: 'Gibraltar Pounds', locale: 'en-GI', position: 'before', decimalPlaces: 2 },
  unitedstates: { code: 'USD', symbol: '$', name: 'US Dollars', locale: 'en-US', position: 'before', decimalPlaces: 2 },
  us: { code: 'USD', symbol: '$', name: 'US Dollars', locale: 'en-US', position: 'before', decimalPlaces: 2 },
  usa: { code: 'USD', symbol: '$', name: 'US Dollars', locale: 'en-US', position: 'before', decimalPlaces: 2 },
  antiguaandbarbuda: { code: 'XCD', symbol: '$', name: 'East Caribbean Dollars', locale: 'en-AG', position: 'before', decimalPlaces: 2 },
  bahamas: { code: 'BSD', symbol: '$', name: 'Bahamian Dollars', locale: 'en-BS', position: 'before', decimalPlaces: 2 },
  barbados: { code: 'BBD', symbol: '$', name: 'Barbadian Dollars', locale: 'en-BB', position: 'before', decimalPlaces: 2 },
  belize: { code: 'BZD', symbol: '$', name: 'Belize Dollars', locale: 'en-BZ', position: 'before', decimalPlaces: 2 },
  dominica: { code: 'XCD', symbol: '$', name: 'East Caribbean Dollars', locale: 'en-DM', position: 'before', decimalPlaces: 2 },
  grenada: { code: 'XCD', symbol: '$', name: 'East Caribbean Dollars', locale: 'en-GD', position: 'before', decimalPlaces: 2 },
  guyana: { code: 'GYD', symbol: '$', name: 'Guyanese Dollars', locale: 'en-GY', position: 'before', decimalPlaces: 2 },
  jamaica: { code: 'JMD', symbol: '$', name: 'Jamaican Dollars', locale: 'en-JM', position: 'before', decimalPlaces: 2 },
  saintkittsandnevis: { code: 'XCD', symbol: '$', name: 'East Caribbean Dollars', locale: 'en-KN', position: 'before', decimalPlaces: 2 },
  saintlucia: { code: 'XCD', symbol: '$', name: 'East Caribbean Dollars', locale: 'en-LC', position: 'before', decimalPlaces: 2 },
  saintvincentandthegrenadines: { code: 'XCD', symbol: '$', name: 'East Caribbean Dollars', locale: 'en-VC', position: 'before', decimalPlaces: 2 },
  trinidadandtobago: { code: 'TTD', symbol: '$', name: 'Trinidad and Tobago Dollars', locale: 'en-TT', position: 'before', decimalPlaces: 2 },
  australia: { code: 'AUD', symbol: 'A$', name: 'Australian Dollars', locale: 'en-AU', position: 'before', decimalPlaces: 2 },
  newzealand: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollars', locale: 'en-NZ', position: 'before', decimalPlaces: 2 },
  fiji: { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollars', locale: 'en-FJ', position: 'before', decimalPlaces: 2 },
  papuanewguinea: { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina', locale: 'en-PG', position: 'before', decimalPlaces: 2 },
  solomonislands: { code: 'SBD', symbol: '$', name: 'Solomon Islands Dollars', locale: 'en-SB', position: 'before', decimalPlaces: 2 },
  samoa: { code: 'WST', symbol: 'T', name: 'Samoan Tala', locale: 'en-WS', position: 'before', decimalPlaces: 2 },
  tonga: { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga', locale: 'en-TO', position: 'before', decimalPlaces: 2 },
  kiribati: { code: 'AUD', symbol: 'A$', name: 'Australian Dollars', locale: 'en-KI', position: 'before', decimalPlaces: 2 },
  marshallislands: { code: 'USD', symbol: '$', name: 'US Dollars', locale: 'en-MH', position: 'before', decimalPlaces: 2 },
  micronesia: { code: 'USD', symbol: '$', name: 'US Dollars', locale: 'en-FM', position: 'before', decimalPlaces: 2 },
  palau: { code: 'USD', symbol: '$', name: 'US Dollars', locale: 'en-PW', position: 'before', decimalPlaces: 2 },
  nauru: { code: 'AUD', symbol: 'A$', name: 'Australian Dollars', locale: 'en-NR', position: 'before', decimalPlaces: 2 },
  tuvalu: { code: 'AUD', symbol: 'A$', name: 'Australian Dollars', locale: 'en-TV', position: 'before', decimalPlaces: 2 },
  india: { code: 'INR', symbol: '₹', name: 'Indian Rupees', locale: 'en-IN', position: 'before', decimalPlaces: 2 },
  pakistan: { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupees', locale: 'en-PK', position: 'before', decimalPlaces: 2 },
  bangladesh: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD', position: 'before', decimalPlaces: 2 },
  srilanka: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupees', locale: 'en-LK', position: 'before', decimalPlaces: 2 },
  nepal: { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupees', locale: 'en-NP', position: 'before', decimalPlaces: 2 },
  bhutan: { code: 'BTN', symbol: 'Nu.', name: 'Bhutanese Ngultrum', locale: 'dz-BT', position: 'before', decimalPlaces: 2 },
  maldives: { code: 'MVR', symbol: 'Rf', name: 'Maldivian Rufiyaa', locale: 'dv-MV', position: 'before', decimalPlaces: 2 },
  singapore: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollars', locale: 'en-SG', position: 'before', decimalPlaces: 2 },
  malaysia: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'en-MY', position: 'before', decimalPlaces: 2 },
  philippines: { code: 'PHP', symbol: '₱', name: 'Philippine Pesos', locale: 'en-PH', position: 'before', decimalPlaces: 2 },
  myanmar: { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat', locale: 'my-MM', position: 'before', decimalPlaces: 0 },
  brunei: { code: 'BND', symbol: '$', name: 'Brunei Dollars', locale: 'en-BN', position: 'before', decimalPlaces: 2 },
  hongkong: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollars', locale: 'en-HK', position: 'before', decimalPlaces: 2 },
  malta: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'en-MT', position: 'before', decimalPlaces: 2 },
  cyprus: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'en-CY', position: 'before', decimalPlaces: 2 },
  europe: { code: 'EUR', symbol: '€', name: 'Euros', locale: 'de-DE', position: 'after', decimalPlaces: 2 },
};

export const DEFAULT_COUNTRY = 'kenya';

// Helper function to get country by currency code
export function getCountryByCurrencyCode(code: string): string | undefined {
  for (const [country, currency] of Object.entries(COUNTRY_CURRENCY_MAP)) {
    if (currency.code === code) {
      return country;
    }
  }
  return undefined;
}

// Helper function to get all countries with the same currency
export function getCountriesByCurrencyCode(code: string): string[] {
  const countries: string[] = [];
  for (const [country, currency] of Object.entries(COUNTRY_CURRENCY_MAP)) {
    if (currency.code === code) {
      countries.push(country);
    }
  }
  return countries;
}

// Alias for easier consumption in components
export const CURRENCY_CONFIG = COUNTRY_CURRENCY_MAP;

// ========== EXPORT THE MISSING FUNCTION ==========
export function getDefaultCurrencyForLanguage(language: string): string {
  switch (language) {
    case 'es':
      return 'EUR';      // Spanish → Euro (or could be USD for many LatAm countries, adjust as needed)
    case 'fr':
      return 'EUR';      // French → Euro
    case 'sw':
      return 'KES';      // Swahili → Kenyan Shilling (or TZS, UGX – adjust as needed)
    case 'en':
      return 'USD';      // English → US Dollar
    default:
      return 'KES';      // Fallback to Kenyan Shillings
  }
}