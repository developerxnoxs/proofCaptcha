import geoip from 'geoip-lite';

export interface GeolocationData {
  country: string | null;
  countryName: string | null;
  region: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
}

interface IPAPIResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

const countryNames: { [key: string]: string } = {
  'US': 'United States',
  'ID': 'Indonesia',
  'GB': 'United Kingdom',
  'IN': 'India',
  'CN': 'China',
  'JP': 'Japan',
  'DE': 'Germany',
  'FR': 'France',
  'BR': 'Brazil',
  'CA': 'Canada',
  'AU': 'Australia',
  'KR': 'South Korea',
  'RU': 'Russia',
  'MX': 'Mexico',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'SG': 'Singapore',
  'MY': 'Malaysia',
  'TH': 'Thailand',
  'PH': 'Philippines',
  'VN': 'Vietnam',
  'TR': 'Turkey',
  'SA': 'Saudi Arabia',
  'AE': 'United Arab Emirates',
  'PL': 'Poland',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'IE': 'Ireland',
  'NZ': 'New Zealand',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'MA': 'Morocco',
  'DZ': 'Algeria',
  'TN': 'Tunisia',
  'GH': 'Ghana',
  'UG': 'Uganda',
  'TZ': 'Tanzania',
  'ET': 'Ethiopia',
  'IL': 'Israel',
  'IQ': 'Iraq',
  'IR': 'Iran',
  'JO': 'Jordan',
  'LB': 'Lebanon',
  'KW': 'Kuwait',
  'QA': 'Qatar',
  'OM': 'Oman',
  'BH': 'Bahrain',
  'YE': 'Yemen',
  'SY': 'Syria',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'RO': 'Romania',
  'GR': 'Greece',
  'PT': 'Portugal',
  'UA': 'Ukraine',
  'BG': 'Bulgaria',
  'RS': 'Serbia',
  'HR': 'Croatia',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'LT': 'Lithuania',
  'LV': 'Latvia',
  'EE': 'Estonia',
  'IS': 'Iceland',
  'LU': 'Luxembourg',
  'MT': 'Malta',
  'CY': 'Cyprus',
  'HK': 'Hong Kong',
  'TW': 'Taiwan',
  'MM': 'Myanmar',
  'KH': 'Cambodia',
  'LA': 'Laos',
  'NP': 'Nepal',
  'LK': 'Sri Lanka',
  'MV': 'Maldives',
  'BT': 'Bhutan',
  'AF': 'Afghanistan',
  'MN': 'Mongolia',
  'KZ': 'Kazakhstan',
  'UZ': 'Uzbekistan',
  'TM': 'Turkmenistan',
  'TJ': 'Tajikistan',
  'KG': 'Kyrgyzstan',
  'GE': 'Georgia',
  'AM': 'Armenia',
  'AZ': 'Azerbaijan',
  'BY': 'Belarus',
  'MD': 'Moldova',
  'AL': 'Albania',
  'MK': 'North Macedonia',
  'BA': 'Bosnia and Herzegovina',
  'ME': 'Montenegro',
  'XK': 'Kosovo',
};

function getCountryName(countryCode: string): string | null {
  if (!countryCode) return null;
  
  if (countryNames[countryCode]) {
    return countryNames[countryCode];
  }
  
  return countryCode;
}

function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  const first = parseInt(parts[0]);
  const second = parseInt(parts[1]);
  
  // 10.0.0.0 - 10.255.255.255
  if (first === 10) return true;
  
  // 172.16.0.0 - 172.31.255.255
  if (first === 172 && second >= 16 && second <= 31) return true;
  
  // 192.168.0.0 - 192.168.255.255
  if (first === 192 && second === 168) return true;
  
  // 127.0.0.0 - 127.255.255.255 (localhost)
  if (first === 127) return true;
  
  return false;
}

async function fetchGeolocationFromAPI(ipAddress: string): Promise<GeolocationData | null> {
  try {
    // Use IP-API.com - free, no signup required, 45 req/minute
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone`);
    
    if (!response.ok) {
      console.warn(`[GEOLOCATION-API] HTTP error! status: ${response.status}`);
      return null;
    }
    
    const data: IPAPIResponse = await response.json();
    
    if (data.status !== 'success') {
      console.warn(`[GEOLOCATION-API] ✗ API returned failure status for IP: ${ipAddress}`);
      return null;
    }
    
    console.log(`[GEOLOCATION-API] ✓ IP ${ipAddress} -> ${data.country} (${data.city || 'Unknown City'})`);
    
    return {
      country: data.countryCode,
      countryName: data.country,
      region: data.regionName || data.region || null,
      city: data.city || null,
      latitude: data.lat ? data.lat.toString() : null,
      longitude: data.lon ? data.lon.toString() : null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.error('[GEOLOCATION-API] Error fetching geolocation from external API:', error);
    return null;
  }
}

export async function getGeolocationFromIP(ipAddress: string | undefined | null): Promise<GeolocationData> {
  const defaultData: GeolocationData = {
    country: null,
    countryName: null,
    region: null,
    city: null,
    latitude: null,
    longitude: null,
    timezone: null,
  };

  // FIXED BUG: Better handling for missing/invalid IP addresses
  if (!ipAddress || ipAddress === 'unknown' || ipAddress === '') {
    console.warn('[GEOLOCATION] No valid IP address provided, returning default data. Received:', ipAddress);
    return defaultData;
  }

  let cleanIP = ipAddress.trim();
  
  // Remove IPv6 prefix
  if (cleanIP.startsWith('::ffff:')) {
    cleanIP = cleanIP.replace('::ffff:', '');
  }
  
  // Handle localhost
  if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || cleanIP === '::1') {
    console.log('[GEOLOCATION] Localhost IP detected:', cleanIP);
    return {
      country: 'XX',
      countryName: 'Localhost',
      region: 'Local',
      city: 'Local',
      latitude: '0',
      longitude: '0',
      timezone: 'UTC',
    };
  }

  // Validate IP format (basic validation)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  if (!ipv4Regex.test(cleanIP) && !ipv6Regex.test(cleanIP)) {
    console.warn('[GEOLOCATION] Invalid IP format:', cleanIP);
    return defaultData;
  }

  // Check if IP is private/internal
  // Private IPs cannot be geolocated - they should have been filtered out by getClientIP()
  // If we still receive one, it means no public IP was found in proxy chain
  if (isPrivateIP(cleanIP)) {
    console.warn(`[GEOLOCATION] Private IP detected (${cleanIP}) - cannot geolocate. This means getClientIP() could not find a public IP in proxy headers.`);
    return {
      country: null,
      countryName: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
      timezone: null,
    };
  }

  // Try local geoip-lite database first (faster)
  try {
    const geo = geoip.lookup(cleanIP);
    
    if (geo) {
      const countryCode = geo.country;
      const countryName = getCountryName(countryCode);
      
      console.log(`[GEOLOCATION] ✓ Local DB: IP ${cleanIP} -> ${countryName || countryCode} (${geo.city || 'Unknown City'})`);
      
      return {
        country: countryCode,
        countryName: countryName,
        region: geo.region || null,
        city: geo.city || null,
        latitude: geo.ll && geo.ll[0] ? geo.ll[0].toString() : null,
        longitude: geo.ll && geo.ll[1] ? geo.ll[1].toString() : null,
        timezone: geo.timezone || null,
      };
    } else {
      console.warn(`[GEOLOCATION] ✗ No data in local database for IP: ${cleanIP}, trying external API...`);
    }
  } catch (error) {
    console.error('[GEOLOCATION] Error looking up in local database for IP', cleanIP, ':', error);
  }

  // Fallback to external API if local database fails
  console.log(`[GEOLOCATION] Falling back to external API for IP: ${cleanIP}`);
  const apiData = await fetchGeolocationFromAPI(cleanIP);
  if (apiData) {
    return apiData;
  }

  console.warn('[GEOLOCATION] All geolocation methods failed, returning default data');
  return defaultData;
}

export function formatGeolocationString(geo: GeolocationData): string {
  const parts: string[] = [];
  
  if (geo.city) parts.push(geo.city);
  if (geo.region) parts.push(geo.region);
  if (geo.countryName) parts.push(geo.countryName);
  
  return parts.join(', ') || 'Unknown';
}
