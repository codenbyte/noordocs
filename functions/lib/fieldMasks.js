"use strict";
// ── Field mask constants for Google Places API (New) ────
// Keep masks minimal; do not include photos/reviews.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DETAIL_FIELD_MASK_C = exports.LIST_FIELD_MASK_B = void 0;
/** Balanced list mask — used for nearby and text search results */
exports.LIST_FIELD_MASK_B = "places.id,places.displayName,places.location,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri";
/** Moderate detail mask — used for single place detail requests */
exports.DETAIL_FIELD_MASK_C = "id,displayName,formattedAddress,location,rating,userRatingCount,googleMapsUri,websiteUri,nationalPhoneNumber,regularOpeningHours";
//# sourceMappingURL=fieldMasks.js.map