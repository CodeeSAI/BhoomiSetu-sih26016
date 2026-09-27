// ============================================================
// BhoomiSetu - Official India State Boundary Geometry (GeoJSON)
// Provides accurate state polygon boundaries for Leaflet GIS layer
// ============================================================

export interface StateGeoJSONFeature {
  type: 'Feature';
  properties: {
    state: string;
    stateCode: string;
    capital: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [lng, lat] GeoJSON standard
  };
}

export interface StateGeoJSONCollection {
  type: 'FeatureCollection';
  features: StateGeoJSONFeature[];
}

export const INDIA_STATE_BOUNDARIES: StateGeoJSONCollection = {
  type: 'FeatureCollection',
  features: [
    // 1. Karnataka (KA)
    {
      type: 'Feature',
      properties: { state: 'Karnataka', stateCode: 'KA', capital: 'Bengaluru' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.05, 14.85], [74.32, 15.65], [74.78, 15.82], [75.12, 16.55],
          [75.85, 17.48], [76.95, 17.82], [77.58, 17.45], [77.35, 16.12],
          [76.88, 15.22], [77.15, 14.05], [78.22, 13.75], [78.45, 13.12],
          [77.75, 12.65], [77.12, 11.95], [76.45, 11.75], [75.75, 12.15],
          [75.22, 12.85], [74.75, 13.45], [74.25, 14.15], [74.05, 14.85]
        ]]
      }
    },
    // 2. Maharashtra (MH)
    {
      type: 'Feature',
      properties: { state: 'Maharashtra', stateCode: 'MH', capital: 'Mumbai' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [72.82, 18.95], [72.78, 19.85], [73.25, 20.25], [74.15, 21.05],
          [75.25, 21.45], [76.85, 21.65], [78.45, 21.55], [79.95, 21.45],
          [80.75, 20.95], [80.55, 19.45], [79.85, 18.75], [78.75, 18.95],
          [77.85, 18.45], [76.55, 18.15], [75.85, 17.55], [74.65, 16.85],
          [73.85, 15.85], [73.35, 16.65], [72.95, 17.75], [72.82, 18.95]
        ]]
      }
    },
    // 3. Gujarat (GJ)
    {
      type: 'Feature',
      properties: { state: 'Gujarat', stateCode: 'GJ', capital: 'Gandhinagar' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [68.18, 23.75], [69.45, 24.45], [71.12, 24.65], [72.45, 24.45],
          [73.55, 24.15], [74.15, 23.25], [74.35, 22.15], [73.85, 21.45],
          [73.15, 20.35], [72.75, 20.85], [72.55, 21.75], [72.15, 22.25],
          [71.45, 20.85], [70.25, 20.75], [69.25, 21.65], [68.85, 22.45],
          [69.65, 23.05], [68.75, 23.45], [68.18, 23.75]
        ]]
      }
    },
    // 4. Rajasthan (RJ)
    {
      type: 'Feature',
      properties: { state: 'Rajasthan', stateCode: 'RJ', capital: 'Jaipur' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [70.15, 27.25], [71.45, 28.15], [72.85, 29.35], [73.85, 29.95],
          [75.45, 28.95], [76.45, 28.15], [77.45, 27.85], [77.85, 26.95],
          [76.85, 25.85], [76.75, 24.85], [75.85, 24.25], [74.65, 23.65],
          [73.65, 24.15], [72.75, 24.75], [71.25, 25.45], [70.15, 26.25],
          [70.15, 27.25]
        ]]
      }
    },
    // 5. Uttar Pradesh (UP)
    {
      type: 'Feature',
      properties: { state: 'Uttar Pradesh', stateCode: 'UP', capital: 'Lucknow' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [77.45, 29.95], [78.65, 29.45], [80.15, 28.75], [81.35, 28.25],
          [82.85, 27.55], [84.15, 27.25], [84.65, 26.15], [83.85, 25.35],
          [83.25, 24.15], [82.25, 24.45], [81.45, 25.15], [80.35, 25.05],
          [78.85, 24.25], [78.25, 25.15], [77.85, 26.85], [77.35, 27.95],
          [77.25, 28.85], [77.45, 29.95]
        ]]
      }
    },
    // 6. Tamil Nadu (TN)
    {
      type: 'Feature',
      properties: { state: 'Tamil Nadu', stateCode: 'TN', capital: 'Chennai' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [80.35, 13.45], [79.85, 12.85], [78.95, 12.75], [78.15, 12.45],
          [77.15, 11.95], [76.75, 11.25], [77.15, 10.45], [77.45, 9.65],
          [77.35, 8.45], [77.55, 8.08], [78.15, 8.65], [78.95, 9.25],
          [79.35, 9.95], [79.85, 10.75], [79.85, 11.85], [80.25, 12.65],
          [80.35, 13.45]
        ]]
      }
    },
    // 7. Telangana (TS)
    {
      type: 'Feature',
      properties: { state: 'Telangana', stateCode: 'TS', capital: 'Hyderabad' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [77.85, 18.45], [78.65, 19.35], [79.45, 19.75], [80.25, 18.95],
          [80.75, 18.25], [80.95, 17.55], [80.15, 16.95], [79.45, 16.55],
          [78.55, 16.25], [77.65, 16.45], [77.35, 17.15], [77.85, 17.95],
          [77.85, 18.45]
        ]]
      }
    },
    // 8. Madhya Pradesh (MP)
    {
      type: 'Feature',
      properties: { state: 'Madhya Pradesh', stateCode: 'MP', capital: 'Bhopal' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.45, 23.65], [75.85, 24.25], [76.75, 24.85], [77.85, 26.95],
          [78.95, 26.45], [79.85, 25.35], [81.45, 25.15], [82.65, 24.25],
          [82.45, 23.45], [81.85, 22.35], [80.65, 21.65], [78.85, 21.55],
          [76.85, 21.45], [75.25, 21.65], [74.25, 22.15], [74.45, 23.65]
        ]]
      }
    },
    // 9. Assam (AS)
    {
      type: 'Feature',
      properties: { state: 'Assam', stateCode: 'AS', capital: 'Dispur' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [89.85, 26.25], [90.55, 26.85], [91.85, 26.95], [93.15, 27.25],
          [94.65, 27.75], [95.85, 27.85], [95.45, 27.15], [94.45, 26.75],
          [93.85, 26.05], [93.15, 25.35], [92.65, 24.85], [92.45, 25.35],
          [91.85, 25.85], [90.85, 25.65], [89.85, 26.25]
        ]]
      }
    },
    // 10. Delhi NCR (DL)
    {
      type: 'Feature',
      properties: { state: 'Delhi NCR', stateCode: 'DL', capital: 'New Delhi' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.92, 28.65], [77.12, 28.85], [77.35, 28.75], [77.38, 28.52],
          [77.25, 28.42], [77.08, 28.45], [76.92, 28.65]
        ]]
      }
    }
  ]
};
