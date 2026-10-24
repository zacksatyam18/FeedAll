/**
 * Geo-Utilities: Distance Calculation and Location Resolution
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula to compute great-circle distance between two coordinates in kilometers.
 * Precision: 1 decimal place (e.g., 2.4 km)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

/**
 * Common Indian city centers, PIN codes, and hubs for instant offline resolution.
 */
export const KNOWN_LOCATIONS = {
  // PIN Codes
  '110001': { name: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
  '110021': { name: 'Chanakyapuri, New Delhi', lat: 28.5910, lng: 77.1890 },
  '110016': { name: 'Hauz Khas / Green Park, New Delhi', lat: 28.5494, lng: 77.2001 },
  '110054': { name: 'Civil Lines, North Delhi', lat: 28.6750, lng: 77.2280 },
  '110002': { name: 'Daryaganj, Old Delhi', lat: 28.6433, lng: 77.2407 },
  '110019': { name: 'Kalkaji / Nehru Place, New Delhi', lat: 28.5463, lng: 77.2589 },
  '122002': { name: 'DLF Phase 2, Gurugram', lat: 28.4870, lng: 77.0880 },
  '122001': { name: 'Old Railway Road, Gurugram', lat: 28.4630, lng: 77.0180 },
  '201301': { name: 'Sector 18, Noida', lat: 28.5700, lng: 77.3200 },
  '400013': { name: 'Lower Parel, Mumbai', lat: 18.9986, lng: 72.8311 },
  '400050': { name: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295 },
  '400001': { name: 'Fort / Colaba, South Mumbai', lat: 18.9322, lng: 72.8347 },
  '560010': { name: 'Rajajinagar, Bengaluru', lat: 12.9982, lng: 77.5530 },
  '560038': { name: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408 },
  '560001': { name: 'MG Road, Bengaluru', lat: 12.9756, lng: 77.6066 },
  '600001': { name: 'George Town, Chennai', lat: 13.0878, lng: 80.2785 },
  '700001': { name: 'BBD Bagh, Kolkata', lat: 22.5726, lng: 88.3639 },
  '500001': { name: 'Abids, Hyderabad', lat: 17.3850, lng: 78.4867 },
  '411001': { name: 'Pune Station, Pune', lat: 18.5204, lng: 73.8567 },

  // Key city and locality names
  'delhi': { name: 'New Delhi (Central Capital Hub)', lat: 28.6139, lng: 77.2090 },
  'new delhi': { name: 'New Delhi (Central)', lat: 28.6139, lng: 77.2090 },
  'connaught place': { name: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
  'chanakyapuri': { name: 'Chanakyapuri, New Delhi', lat: 28.5910, lng: 77.1890 },
  'hauz khas': { name: 'Hauz Khas, New Delhi', lat: 28.5494, lng: 77.2001 },
  'saket': { name: 'Saket, New Delhi', lat: 28.5244, lng: 77.2066 },
  'gurugram': { name: 'Gurugram, Haryana', lat: 28.4595, lng: 77.0266 },
  'gurgaon': { name: 'Gurugram, Haryana', lat: 28.4595, lng: 77.0266 },
  'noida': { name: 'Noida, Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  'mumbai': { name: 'Mumbai, Maharashtra', lat: 18.9986, lng: 72.8311 },
  'bandra': { name: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295 },
  'lower parel': { name: 'Lower Parel, Mumbai', lat: 18.9986, lng: 72.8311 },
  'bengaluru': { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
  'bangalore': { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
  'indiranagar': { name: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408 },
  'koramangala': { name: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 },
  'hyderabad': { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
  'chennai': { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  'kolkata': { name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639 },
  'pune': { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  'jaipur': { name: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 },
  'ahmedabad': { name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714 }
};

/**
 * Resolves a text query (address/city/PIN) to coordinates.
 * Tries local directory first, then online Nominatim if available.
 */
export async function resolveLocation(query) {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase();

  // 1. Direct match or substring in known directory
  for (const [key, val] of Object.entries(KNOWN_LOCATIONS)) {
    if (clean === key || clean.includes(key) || key.includes(clean)) {
      return { ...val, source: 'directory' };
    }
  }

  // 2. Try online geocoding if network is available
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=1`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          name: data[0].display_name,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          source: 'nominatim'
        };
      }
    }
  } catch {
    // Graceful offline fallback
  }

  return null;
}
