export interface ParcelData {
  parcel_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  area_sqm: number;
  assessed_value: number;
  owner_name?: string;
  geometry: any; // GeoJSON
}

export interface FloodRiskResult {
  parcel_id: string;
  flood_zones: Array<{
    zone_type: string;
    risk_level: string;
    overlap_area_sqm: number;
  }>;
  overall_risk: string;
  assessment_date: string;
}

export interface VisionAnalysisResult {
  location: {
    latitude: number;
    longitude: number;
  };
  analysis_type: string;
  timestamp: string;
  [key: string]: any; // Dynamic fields based on analysis type
}
