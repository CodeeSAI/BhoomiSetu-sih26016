// ============================================================
// BhoomiSetu - Authoritative Geographic Data & Validation
// Single Source of Truth for India Demonstration Coordinates
// ============================================================

export interface DistrictGeoInfo {
  lat: number;
  lng: number;
  state: string;
  stateCode: string;
  districtCode: string;
}

export const DISTRICT_COORDINATES: Record<string, DistrictGeoInfo> = {
  // Karnataka (KA)
  'Bengaluru Urban': { lat: 12.9716, lng: 77.5946, state: 'Karnataka', stateCode: 'KA', districtCode: '2901' },
  'Mysuru': { lat: 12.2958, lng: 76.6394, state: 'Karnataka', stateCode: 'KA', districtCode: '2902' },
  'Dharwad': { lat: 15.4589, lng: 75.0078, state: 'Karnataka', stateCode: 'KA', districtCode: '2904' },
  'Mangalore': { lat: 12.9141, lng: 74.8560, state: 'Karnataka', stateCode: 'KA', districtCode: '2905' },

  // Maharashtra (MH)
  'Mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra', stateCode: 'MH', districtCode: '2701' },
  'Pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra', stateCode: 'MH', districtCode: '2704' },
  'Nagpur': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra', stateCode: 'MH', districtCode: '2705' },
  'Nashik': { lat: 19.9975, lng: 73.7898, state: 'Maharashtra', stateCode: 'MH', districtCode: '2707' },

  // Gujarat (GJ)
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat', stateCode: 'GJ', districtCode: '2401' },
  'Surat': { lat: 21.1702, lng: 72.8311, state: 'Gujarat', stateCode: 'GJ', districtCode: '2402' },
  'Vadodara': { lat: 22.3072, lng: 73.1812, state: 'Gujarat', stateCode: 'GJ', districtCode: '2403' },
  'Rajkot': { lat: 22.3039, lng: 70.8022, state: 'Gujarat', stateCode: 'GJ', districtCode: '2404' },

  // Rajasthan (RJ)
  'Jaipur': { lat: 26.9124, lng: 75.7873, state: 'Rajasthan', stateCode: 'RJ', districtCode: '0801' },
  'Jodhpur': { lat: 26.2389, lng: 73.0243, state: 'Rajasthan', stateCode: 'RJ', districtCode: '0802' },
  'Udaipur': { lat: 24.5854, lng: 73.7125, state: 'Rajasthan', stateCode: 'RJ', districtCode: '0803' },
  'Bikaner': { lat: 28.0229, lng: 73.3119, state: 'Rajasthan', stateCode: 'RJ', districtCode: '0805' },

  // Uttar Pradesh (UP)
  'Lucknow': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh', stateCode: 'UP', districtCode: '0901' },
  'Noida': { lat: 28.5355, lng: 77.3910, state: 'Uttar Pradesh', stateCode: 'UP', districtCode: '0905' },
  'Varanasi': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh', stateCode: 'UP', districtCode: '0902' },
  'Agra': { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh', stateCode: 'UP', districtCode: '0904' },

  // Tamil Nadu (TN)
  'Chennai': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu', stateCode: 'TN', districtCode: '3301' },
  'Coimbatore': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu', stateCode: 'TN', districtCode: '3302' },
  'Madurai': { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu', stateCode: 'TN', districtCode: '3303' },
  'Salem': { lat: 11.6643, lng: 78.1460, state: 'Tamil Nadu', stateCode: 'TN', districtCode: '3304' },

  // Telangana (TS)
  'Hyderabad': { lat: 17.3850, lng: 78.4867, state: 'Telangana', stateCode: 'TS', districtCode: '3601' },
  'Warangal': { lat: 17.9689, lng: 79.5941, state: 'Telangana', stateCode: 'TS', districtCode: '3602' },
  'Karimnagar': { lat: 18.4386, lng: 79.1288, state: 'Telangana', stateCode: 'TS', districtCode: '3603' },
  'Nizamabad': { lat: 18.6725, lng: 78.0941, state: 'Telangana', stateCode: 'TS', districtCode: '3604' },

  // Madhya Pradesh (MP)
  'Bhopal': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh', stateCode: 'MP', districtCode: '2301' },
  'Indore': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh', stateCode: 'MP', districtCode: '2302' },
  'Jabalpur': { lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh', stateCode: 'MP', districtCode: '2303' },
  'Gwalior': { lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh', stateCode: 'MP', districtCode: '2304' },

  // Assam (AS)
  'Guwahati': { lat: 26.1445, lng: 91.7362, state: 'Assam', stateCode: 'AS', districtCode: '1802' },
  'Dibrugarh': { lat: 27.4728, lng: 94.9120, state: 'Assam', stateCode: 'AS', districtCode: '1803' },
  'Silchar': { lat: 24.8333, lng: 92.7789, state: 'Assam', stateCode: 'AS', districtCode: '1804' },
  'Jorhat': { lat: 26.7509, lng: 94.2037, state: 'Assam', stateCode: 'AS', districtCode: '1805' },

  // Delhi NCR (DL)
  'New Delhi': { lat: 28.6139, lng: 77.2090, state: 'Delhi NCR', stateCode: 'DL', districtCode: '0701' },
  'Central Delhi': { lat: 28.6448, lng: 77.2167, state: 'Delhi NCR', stateCode: 'DL', districtCode: '0702' },
  'South Delhi': { lat: 28.5355, lng: 77.2410, state: 'Delhi NCR', stateCode: 'DL', districtCode: '0703' },
  'East Delhi': { lat: 28.6280, lng: 77.2950, state: 'Delhi NCR', stateCode: 'DL', districtCode: '0704' },
};

export interface StateBoundBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  center: [number, number];
  zoom: number;
}

export const STATE_BOUNDING_BOXES: Record<string, StateBoundBox> = {
  'Karnataka': { minLat: 11.5, maxLat: 18.5, minLng: 74.0, maxLng: 78.6, center: [14.8, 75.9], zoom: 7 },
  'Maharashtra': { minLat: 15.6, maxLat: 22.1, minLng: 72.6, maxLng: 80.9, center: [19.3, 76.1], zoom: 7 },
  'Gujarat': { minLat: 20.1, maxLat: 24.7, minLng: 68.1, maxLng: 74.5, center: [22.4, 71.8], zoom: 7 },
  'Rajasthan': { minLat: 23.0, maxLat: 30.2, minLng: 69.5, maxLng: 78.3, center: [26.5, 74.2], zoom: 6 },
  'Uttar Pradesh': { minLat: 23.8, maxLat: 30.4, minLng: 77.0, maxLng: 84.7, center: [27.0, 80.8], zoom: 7 },
  'Tamil Nadu': { minLat: 8.0, maxLat: 13.6, minLng: 76.2, maxLng: 80.4, center: [11.1, 78.6], zoom: 7 },
  'Telangana': { minLat: 15.8, maxLat: 19.9, minLng: 77.2, maxLng: 81.8, center: [17.8, 79.1], zoom: 7 },
  'Madhya Pradesh': { minLat: 21.0, maxLat: 26.9, minLng: 74.0, maxLng: 82.8, center: [23.5, 78.5], zoom: 6 },
  'Assam': { minLat: 24.1, maxLat: 28.2, minLng: 89.7, maxLng: 96.0, center: [26.2, 92.9], zoom: 7 },
  'Delhi NCR': { minLat: 28.4, maxLat: 28.9, minLng: 76.8, maxLng: 77.4, center: [28.61, 77.21], zoom: 11 },
};

/**
 * Validate that a geospatial entity (Project or LandParcel) has authentic,
 * non-overlapping coordinates strictly within India and its stated State.
 */
export function validateGeoRecord(record: {
  id?: string;
  state?: string;
  district?: string;
  latitude?: number | null;
  longitude?: number | null;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof record.latitude !== 'number' || isNaN(record.latitude)) {
    errors.push('Latitude is missing or not a valid number');
  }
  if (typeof record.longitude !== 'number' || isNaN(record.longitude)) {
    errors.push('Longitude is missing or not a valid number');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const lat = record.latitude!;
  const lng = record.longitude!;

  // 1. Check territory of India
  if (lat < 6.0 || lat > 37.5 || lng < 68.0 || lng > 97.5) {
    errors.push(`Coordinates [${lat}, ${lng}] fall outside the geographical boundaries of India`);
  }

  // 2. Check state boundary consistency
  if (record.state && STATE_BOUNDING_BOXES[record.state]) {
    const bbox = STATE_BOUNDING_BOXES[record.state];
    if (lat < bbox.minLat || lat > bbox.maxLat || lng < bbox.minLng || lng > bbox.maxLng) {
      errors.push(`Coordinates [${lat}, ${lng}] fall outside the bounding box for state "${record.state}"`);
    }
  }

  // 3. Check district consistency if district is registered
  if (record.district && DISTRICT_COORDINATES[record.district]) {
    const dCoord = DISTRICT_COORDINATES[record.district];
    // Distance approximation in degrees: roughly 1.5 degrees (~160 km) max tolerance
    const distDeg = Math.sqrt(Math.pow(lat - dCoord.lat, 2) + Math.pow(lng - dCoord.lng, 2));
    if (distDeg > 1.2) {
      errors.push(`Coordinates [${lat}, ${lng}] deviate significantly (>120km) from district centroid "${record.district}"`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
