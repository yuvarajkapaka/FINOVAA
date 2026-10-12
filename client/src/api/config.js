/**
 * FINOVA Centralized API Configuration & Helper
 *
 * Provides safe API endpoint resolution and a unified fetch wrapper.
 * Automatically respects VITE_API_BASE_URL for production (e.g. Vercel -> Render)
 * while defaulting seamlessly to the Vite /api proxy for local development.
 */

export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '').trim();

/**
 * Builds a normalized API URL from an endpoint string.
 * Prevents duplicate slashes and duplicate '/api' path segments.
 *
 * @param {string} endpoint - The API endpoint (e.g. '/api/wallet' or 'wallet')
 * @returns {string} The resolved URL string
 */
export function apiUrl(endpoint = '') {
  if (!endpoint) return API_BASE_URL || '/api';
  if (/^https?:\/\//i.test(endpoint)) return endpoint;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const trimmedBase = API_BASE_URL.replace(/\/+$/, '');

  // Local development / default Vite proxy mode
  if (!trimmedBase) {
    return cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  }

  // Base URL provided (e.g., Render backend in production)
  if (trimmedBase.endsWith('/api')) {
    if (cleanEndpoint === '/api') return trimmedBase;
    const stripped = cleanEndpoint.startsWith('/api/')
      ? cleanEndpoint.slice(4)
      : (cleanEndpoint.startsWith('/api') ? cleanEndpoint.slice(4) : cleanEndpoint);
    const finalPart = stripped.startsWith('/') ? stripped : `/${stripped}`;
    return `${trimmedBase}${finalPart}`;
  }

  if (cleanEndpoint.startsWith('/api')) {
    return `${trimmedBase}${cleanEndpoint}`;
  }

  return `${trimmedBase}/api${cleanEndpoint}`;
}

/**
 * Centralized fetch wrapper that resolves the endpoint with apiUrl.
 *
 * @param {string} endpoint - Target endpoint or relative route
 * @param {RequestInit} [options] - Standard fetch options
 * @returns {Promise<Response>}
 */
export function apiFetch(endpoint, options) {
  return fetch(apiUrl(endpoint), options);
}

export default apiFetch;
