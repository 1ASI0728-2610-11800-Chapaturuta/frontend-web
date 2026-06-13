// Bounding box de Perú (debe coincidir con backend PeruBounds.cs).
// Filtro grueso para feedback instantáneo en el mapa; la validación fina de
// país real la hace el reverse-geocode (country_code === 'pe').
export const PERU_BOUNDS = {
  minLat: -18.35,
  maxLat: -0.03,
  minLng: -81.33,
  maxLng: -68.65
}

export function isWithinPeru(lat, lng) {
  if (lat == null || lng == null) return false
  return lat >= PERU_BOUNDS.minLat && lat <= PERU_BOUNDS.maxLat
    && lng >= PERU_BOUNDS.minLng && lng <= PERU_BOUNDS.maxLng
}
