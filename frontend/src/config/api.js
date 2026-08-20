// Configuration for API URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Ensure URL is absolute if it doesn't start with http
export const getAbsoluteUrl = (url) => {
  if (!url) return '/api';
  if (url.startsWith('http')) return url;
  if (typeof window !== 'undefined' && window.location) {
    if (url.startsWith('/')) return `${window.location.origin}${url}`;
    return `${window.location.origin}/${url}`;
  }
  return url;
};

export const BASE_URL = getAbsoluteUrl(API_BASE_URL);

/**
 * Standard fetch helper with JWT Authorization support
 */
export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('luxedrive_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data.data !== undefined ? data.data : data;
};
