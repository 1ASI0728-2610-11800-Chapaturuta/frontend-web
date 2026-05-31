/**
 * Servicio de reverse-geocoding usando Nominatim (OpenStreetMap).
 *
 * Nota: el navegador no permite setear el header User-Agent, así que no se
 * intenta. Nominatim acepta peticiones del navegador usando el Referer.
 * Respetar el rate-limit de Nominatim (1 req/s): este servicio solo debe
 * llamarse al fijar una coordenada (no en cada render).
 */

/**
 * Hace reverse-geocode de una coordenada.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Object|null>} objeto JSON de Nominatim o null si falla.
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}` +
    `&accept-language=es&zoom=18&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('reverseGeocode falló:', err);
    return null;
  }
}

/**
 * Arma una dirección legible a partir del objeto `address` de Nominatim.
 * Campos típicos: road, house_number, neighbourhood, suburb, pedestrian.
 * @param {Object} addr - result.address de Nominatim
 * @returns {string} dirección legible (puede ser '')
 */
export function buildAddress(addr) {
  if (!addr || typeof addr !== 'object') return '';
  const road = addr.road || addr.pedestrian || addr.footway || '';
  if (road) {
    return `${road} ${addr.house_number || ''}`.trim();
  }
  return (addr.suburb || addr.neighbourhood || '').trim();
}
