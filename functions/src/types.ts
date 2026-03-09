// ── Shared types for the NoorSpace API ────────────────────

export interface PlaceSummary {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
}

export interface PlaceDetails {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] } | null;
}

export interface NearbyResponse {
  source: "nearby" | "text" | "fallbackText";
  places: PlaceSummary[];
}

export interface DetailsResponse {
  place: PlaceDetails;
}

export interface PaymentLinkResponse {
  url: string;
  note?: string;
}

// ── Google Places API (New) raw response shapes ──────────
export interface GooglePlaceRaw {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  location?: { latitude?: number; longitude?: number };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] } | null;
}
