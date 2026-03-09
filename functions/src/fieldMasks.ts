// ── Field mask constants for Google Places API (New) ────
// Keep masks minimal; do not include photos/reviews.

/** Balanced list mask — used for nearby and text search results */
export const LIST_FIELD_MASK_B =
  "places.id,places.displayName,places.location,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri";

/** Moderate detail mask — used for single place detail requests */
export const DETAIL_FIELD_MASK_C =
  "id,displayName,formattedAddress,location,rating,userRatingCount,googleMapsUri,websiteUri,nationalPhoneNumber,regularOpeningHours";
