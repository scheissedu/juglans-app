// packages/juglans-app/src/api/newsApi.ts
import type { NewsArticle } from '@/types';

/**
 * Fetches general news from a specific source via the backend.
 * @param source The news source (e.g., 'coindesk').
 * @param token The user's authentication token.
 * @returns A promise that resolves to an array of news articles.
 */
export async function fetchNews(source: string = 'coindesk', token: string | null): Promise<NewsArticle[]> {
  if (!token) {
    console.error("Authentication token is missing. Cannot fetch news.");
    return [];
  }
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/news?source=${source}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      console.error("Unauthorized. Token might be invalid.");
      return [];
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const data: NewsArticle[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

/**
 * Fetches news for a specific symbol via the backend.
 * @param symbol The asset symbol (e.g., 'BTC').
 * @param token The user's authentication token.
 * @returns A promise that resolves to an array of news articles.
 */
export async function fetchNewsBySymbol(symbol: string, token: string | null): Promise<NewsArticle[]> {
  if (!token) {
    console.error("Authentication token is missing.");
    return [];
  }
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/news?symbol=${symbol}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch news for ${symbol}:`, error);
    return [];
  }
}