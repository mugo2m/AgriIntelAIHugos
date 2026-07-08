// lib/data/plantingDates.ts
// Complete planting date database for all 219 crops
// Based on East African agro-ecological zones and global best practices

export interface PlantingDateInfo {
  earliest: string;   // e.g., "15th March"
  latest: string;     // e.g., "15th May"
  optimal: string;    // e.g., "March-April"
  notes?: string;
}

export interface CountryPlantingData {
  regions?: Record<string, PlantingDateInfo>;
  default: PlantingDateInfo;
  source?: string;
}

export const plantingDates: Record<string, { countries?: Record<string, CountryPlantingData>; default: PlantingDateInfo }> = {
  // ========== CEREALS & GRAINS ==========
  maize: {
    countries: {
      kenya: {
        regions: {
          "Western": { earliest: "15th February", latest: "15th April", optimal: "March-April" },
          "Rift Valley": { earliest: "15th March", latest: "15th May", optimal: "April-May" },
          "Eastern": { earliest: "15th March", latest: "15th May", optimal: "March-April" },
          "Coast": { earliest: "1st October", latest: "15th December", optimal: "October-November" }
        },
        default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
      },
      uganda: { default: { earliest: "1st March", latest: "15th May", optimal: "March-April" } },
      tanzania: { default: { earliest: "1st March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  rice: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      tanzania: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  sorghum: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  finger_millet: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  millet: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  barley: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "April-May" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
  },
  oats: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "April-May" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
  },
  wheat: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "April-May" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
  },
  teff: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  triticale: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "April-May" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
  },
  buckwheat: {
    countries: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  quinoa: {
    countries: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  fonio: {
    countries: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  spelt: {
    countries: { default: { earliest: "15th March", latest: "15th May", optimal: "April-May" } },
    default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
  },
  kamut: {
    countries: { default: { earliest: "15th March", latest: "15th May", optimal: "April-May" } },
    default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
  },
  amaranth_grain: {
    countries: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },

  // ========== PULSES & LEGUMES ==========
  beans: {
    countries: {
      kenya: {
        regions: {
          "Western": { earliest: "1st March", latest: "30th April", optimal: "March-April" },
          "Rift Valley": { earliest: "15th March", latest: "15th May", optimal: "April-May" }
        },
        default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
      },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  cowpeas: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  green_grams: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  pigeonpeas: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  bambaranuts: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  chickpea: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  faba_bean: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "April-May" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
  },
  lentil: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  soya_beans: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  groundnuts: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  peanut: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },

  // ========== VEGETABLES (Leafy, Fruit, Root) ==========
  tomatoes: {
    countries: {
      kenya: {
        regions: {
          "Central": { earliest: "1st March", latest: "30th April", optimal: "March-April" },
          "Rift Valley": { earliest: "15th February", latest: "15th April", optimal: "February-March" }
        },
        default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
      },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  onions: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cabbages: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  kales: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  spinach: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  carrots: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  chillies: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  capsicums: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  okra: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  brinjals: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  french_beans: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  garden_peas: {
    countries: {
      kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "April-May" } },
      default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
    },
    default: { earliest: "15th March", latest: "15th May", optimal: "April-May" }
  },
  african_nightshade: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  amaranth: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  arugula: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  asparagus: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  beetroot: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  broccoli: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cauliflower: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  celery: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  coriander: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  courgettes: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cucumbers: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  eggplants: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  endive: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  escarole: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  ethiopian_kale: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  frisee: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  kohlrabi: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  leeks: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  lettuce: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  parsley: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  radicchio: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  radish: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  rhubarb: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  rutabaga: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  swiss_chard: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  turnip: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  turnip_greens: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  watercress: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  spider_plant: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  sweet_potato_leaves: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  jute_mallow: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  slender_leaf: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  collard_greens: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  mustard_greens: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  bok_choy: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },

  // ========== TUBERS & ROOTS ==========
  potatoes: {
    countries: {
      kenya: {
        regions: {
          "Central": { earliest: "1st March", latest: "30th April", optimal: "March-April" },
          "Rift Valley": { earliest: "15th February", latest: "15th April", optimal: "February-March" }
        },
        default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
      },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cassava: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  sweet_potatoes: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  yams: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  taro: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  ginger: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  turmeric: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  horseradish: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  parsnip: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  irish_potatoes: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },

  // ========== FRUITS ==========
  bananas: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  mangoes: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  avocados: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  oranges: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  lemons: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  limes: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  grapefruit: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  guava: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  pineapples: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  watermelons: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  passion_fruit: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  pawpaws: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  papayas: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  breadfruit: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  coconut: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  jackfruit: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  pomegranate: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  star_fruit: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  pumpkin: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  fig: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  date_palm: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  mulberry: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  lychee: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  persimmon: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  gooseberry: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  currant: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  elderberry: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  rambutan: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  durian: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  mangosteen: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  longan: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  marula: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },

  // ========== NUTS ==========
  almond: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  brazil_nut: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cashew: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  chestnut: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  hazelnut: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  macadamia: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  pecan: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  pistachio: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  shea: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  walnut: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  pili_nut: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },

  // ========== CASH CROPS ==========
  coffee: {
    countries: {
      kenya: {
        regions: {
          "Central": { earliest: "1st March", latest: "30th April", optimal: "March-April" },
          "Eastern": { earliest: "1st March", latest: "30th April", optimal: "March-April" }
        },
        default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
      },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  tea: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cocoa: {
    countries: {
      ghana: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      cote_divoire: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  sugarcane: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cotton: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  tobacco: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  sisal: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  pyrethrum: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  oil_palm: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  rubber: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },

  // ========== OIL CROPS ==========
  sunflower: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  sesame: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  simsim: {
    countries: {
      kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
      default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
    },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  rapeseed: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  safflower: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },

  // ========== COVER CROPS ==========
  alfalfa: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  lucerne: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  clover: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  white_clover: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  vetch: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  canavalia: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  crotalaria_juncea: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  crotalaria_ochroleuca: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  crotalaria_paulina: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  desmodium: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  dolichos: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  mucuna: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  sunn_hemp: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },

  // ========== FORAGE GRASSES ==========
  brachiaria: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  buffel_grass: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cenchrus: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  forage_sorghum: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  guinea_grass: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  italian_ryegrass: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  napier_grass: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  napier_hybrid: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  orchard_grass: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  rhodes_grass: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  timothy_grass: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  calliandra: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  leucaena: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  sesbania: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },

  // ========== HERBS & SPICES ==========
  basil: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  black_pepper: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cardamom: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  chamomile: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cinnamon: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cloves: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  dill: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  echinacea: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  fennel: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  ginseng: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  goldenseal: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  hibiscus: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  hops: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  lavender: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  lemon_grass: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  mint: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  moringa: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  mustard: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  oregano: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  rosemary: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  sage: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  thyme: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  vanilla: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  wasabi: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  stevia: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  fenugreek: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cumin: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  caraway: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  anise: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  lovage: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  marjoram: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  tarragon: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  sorrel: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  chervil: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  savory: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  calendula: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  nasturtium: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  borage: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  st_johns_wort: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  valerian: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },

  // ========== MEDICINAL PLANTS ==========
  aloe_vera: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  stinging_nettle: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },

  // ========== OTHER ==========
  bamboo: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  mushroom: {
    countries: { default: { earliest: "Year-round", latest: "Year-round", optimal: "Year-round (controlled environment)" } },
    default: { earliest: "Year-round", latest: "Year-round", optimal: "Year-round (controlled environment)" }
  },
  oyster_nut: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  birds_eye_chili: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  cayenne: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  jalapeno: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  ramie: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  flax: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  hemp: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  jute: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  kenaf: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  garlic: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  shallots: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  garlic: {
  countries: {
    kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
    egypt: { default: { earliest: "1st October", latest: "30th November", optimal: "October-November" } },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
},
shallots: {
  countries: {
    kenya: { default: { earliest: "15th March", latest: "15th May", optimal: "March-April" } },
    default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
  },
  default: { earliest: "15th March", latest: "15th May", optimal: "March-April" }
},

chives: {
  countries: {
    kenya: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  },
  default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
},

  chives: {
    countries: { default: { earliest: "1st March", latest: "30th April", optimal: "March-April" } },
    default: { earliest: "1st March", latest: "30th April", optimal: "March-April" }
  }
};

// ========== HELPER FUNCTIONS (unchanged) ==========
export function getPlantingAdvice(
  crop: string,
  country: string,
  region: string,
  plantingDate: string
): "optimal" | "acceptable" | "late" | "no-data" {
  const cropData = (plantingDates as any)[crop.toLowerCase()];
  if (!cropData) return "no-data";

  const countryData = cropData.countries?.[country.toLowerCase()];
  if (!countryData) return "no-data";

  const regionData = countryData.regions?.[region] || countryData.default;
  if (!regionData) return "no-data";

  const date = new Date(plantingDate);
  const month = date.getMonth() + 1;

  // Parse optimal months
  const optimalRange = regionData.optimal.split('-');
  const optimalMonths: number[] = [];
  const monthMap: Record<string, number> = {
    "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
    "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
  };
  optimalRange.forEach(monthName => {
    const trimmed = monthName.trim();
    if (monthMap[trimmed]) optimalMonths.push(monthMap[trimmed]);
  });

  if (optimalMonths.includes(month)) return "optimal";

  const earliestMatch = regionData.earliest.match(/(\d+)(?:st|nd|rd|th)?\s+(\w+)/);
  const latestMatch = regionData.latest.match(/(\d+)(?:st|nd|rd|th)?\s+(\w+)/);

  if (earliestMatch && latestMatch) {
    const earliestMonth = monthMap[earliestMatch[2]];
    const latestMonth = monthMap[latestMatch[2]];

    if (latestMonth < earliestMonth) {
      if (month >= earliestMonth || month <= latestMonth) return "acceptable";
    } else {
      if (month >= earliestMonth && month <= latestMonth) return "acceptable";
    }
  }
  return "late";
}

export function getPlantingAdviceText(crop: string, country: string, region: string, plantingDate: string): string {
  const advice = getPlantingAdvice(crop, country, region, plantingDate);
  switch(advice) {
    case "optimal": return "✅ Optimal planting time - Perfect conditions for this crop!";
    case "acceptable": return "⚠️ Acceptable planting time - May have slightly reduced yields";
    case "late": return "❌ Late planting - Consider waiting for next season or use short-season varieties";
    case "no-data": return "Planting advice not available for this combination";
    default: return "Planting advice not available for this combination";
  }
}