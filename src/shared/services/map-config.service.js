import axios from 'axios'

const FALLBACK = {
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
  defaultCenter: [-12.0464, -77.0428],
  defaultZoom: 12,
  minZoom: 5,
  maxZoom: 19
}

let cached = null
let inflight = null

export async function getMapConfig() {
  if (cached) return cached
  if (inflight) return inflight
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  inflight = axios.get(`${baseUrl}config/map`, { timeout: 4000 })
    .then(r => {
      const d = r.data || {}
      cached = {
        tileUrl: d.tileUrl || d.tile_url || FALLBACK.tileUrl,
        attribution: d.attribution || FALLBACK.attribution,
        defaultCenter: d.defaultCenter || (d.bbox
          ? [(d.bbox.minLat + d.bbox.maxLat) / 2, (d.bbox.minLng + d.bbox.maxLng) / 2]
          : FALLBACK.defaultCenter),
        defaultZoom: d.defaultZoom || FALLBACK.defaultZoom,
        minZoom: d.minZoom || FALLBACK.minZoom,
        maxZoom: d.maxZoom || FALLBACK.maxZoom
      }
      return cached
    })
    .catch(() => {
      cached = { ...FALLBACK }
      return cached
    })
    .finally(() => { inflight = null })
  return inflight
}
