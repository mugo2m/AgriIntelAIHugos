// lib/config/phoneCodes.ts
// Country codes for phone number selection

export const countryCodes = [
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+211", country: "South Sudan", flag: "🇸🇸" },
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+252", country: "Somalia", flag: "🇸🇴" },
  { code: "+253", country: "Djibouti", flag: "🇩🇯" },
  { code: "+291", country: "Eritrea", flag: "🇪🇷" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+221", country: "Senegal", flag: "🇸🇳" },
  { code: "+225", country: "Ivory Coast", flag: "🇨🇮" },
  { code: "+223", country: "Mali", flag: "🇲🇱" },
  { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
  { code: "+227", country: "Niger", flag: "🇳🇪" },
  { code: "+228", country: "Togo", flag: "🇹🇬" },
  { code: "+229", country: "Benin", flag: "🇧🇯" },
  { code: "+224", country: "Guinea", flag: "🇬🇳" },
  { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "+231", country: "Liberia", flag: "🇱🇷" },
  { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
  { code: "+220", country: "Gambia", flag: "🇬🇲" },
  { code: "+238", country: "Cape Verde", flag: "🇨🇻" },
  { code: "+237", country: "Cameroon", flag: "🇨🇲" },
  { code: "+241", country: "Gabon", flag: "🇬🇦" },
  { code: "+235", country: "Chad", flag: "🇹🇩" },
  { code: "+236", country: "Central African Republic", flag: "🇨🇫" },
  { code: "+240", country: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "+242", country: "Congo Brazzaville", flag: "🇨🇬" },
  { code: "+243", country: "Congo Kinshasa", flag: "🇨🇩" },
  { code: "+244", country: "Angola", flag: "🇦🇴" },
  { code: "+239", country: "São Tomé", flag: "🇸🇹" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+264", country: "Namibia", flag: "🇳🇦" },
  { code: "+267", country: "Botswana", flag: "🇧🇼" },
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+265", country: "Malawi", flag: "🇲🇼" },
  { code: "+258", country: "Mozambique", flag: "🇲🇿" },
  { code: "+261", country: "Madagascar", flag: "🇲🇬" },
  { code: "+269", country: "Comoros", flag: "🇰🇲" },
  { code: "+230", country: "Mauritius", flag: "🇲🇺" },
  { code: "+248", country: "Seychelles", flag: "🇸🇨" },
  { code: "+268", country: "Eswatini", flag: "🇸🇿" },
  { code: "+266", country: "Lesotho", flag: "🇱🇸" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+249", country: "Sudan", flag: "🇸🇩" },
  { code: "+218", country: "Libya", flag: "🇱🇾" },
  { code: "+216", country: "Tunisia", flag: "🇹🇳" },
  { code: "+213", country: "Algeria", flag: "🇩🇿" },
  { code: "+212", country: "Morocco", flag: "🇲🇦" },
  { code: "+222", country: "Mauritania", flag: "🇲🇷" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" }
];

// Helper function to get country code by country name
export function getCountryCode(countryName: string): string {
  const found = countryCodes.find(
    c => c.country.toLowerCase() === countryName.toLowerCase()
  );
  return found?.code || "+254"; // Default to Kenya
}

// Helper function to get all codes as array of strings
export function getAllCountryCodes(): string[] {
  return countryCodes.map(c => c.code);
}