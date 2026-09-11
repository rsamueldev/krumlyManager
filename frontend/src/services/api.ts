export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('krumly_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
