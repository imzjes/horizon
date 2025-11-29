// Crypto data providers with fallbacks

import { CryptoAsset, CryptoProvider } from './types';
import { dataCache } from './cache';

// Fallback provider using local JSON
class LocalCryptoProvider implements CryptoProvider {
  async fetchTop100Assets(): Promise<CryptoAsset[]> {
    try {
      const response = await fetch('/data/top100-crypto.json');
      const data = await response.json();
      return data.assets || [];
    } catch (error) {
      console.warn('Failed to load local crypto assets:', error);
      return [];
    }
  }

  async searchAssets(query: string): Promise<CryptoAsset[]> {
    const assets = await this.fetchTop100Assets();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return assets;
    
    return assets.filter((asset) => 
      asset.symbol.toLowerCase().includes(searchTerm) ||
      asset.name.toLowerCase().includes(searchTerm)
    );
  }
}

// CoinGecko provider (no API key required for basic endpoints)
class CoinGeckoProvider implements CryptoProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_COINGECKO_BASE || 'https://api.coingecko.com/api/v3';
  }

  async fetchTop100Assets(): Promise<CryptoAsset[]> {
    try {
      const url = `${this.baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=150&page=1&sparkline=false`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price,
        market_cap: coin.market_cap
      }));
    } catch (error) {
      console.warn('CoinGecko API failed:', error);
      throw error;
    }
  }

  async searchAssets(query: string): Promise<CryptoAsset[]> {
    const assets = await this.fetchTop100Assets();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return assets;
    
    return assets.filter((asset) => 
      asset.symbol.toLowerCase().includes(searchTerm) ||
      asset.name.toLowerCase().includes(searchTerm)
    );
  }
}

// Main crypto data service with provider fallback
class CryptoDataService {
  private providers: CryptoProvider[] = [];
  private localProvider = new LocalCryptoProvider();

  constructor() {
    // Setup provider chain
    this.providers.push(new CoinGeckoProvider());
    this.providers.push(this.localProvider);
  }

  async fetchTop100Assets(): Promise<CryptoAsset[]> {
    const cacheKey = 'crypto_top150';
    
    // Check cache first
    const cached = dataCache.get<CryptoAsset[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Try providers in order until one succeeds
    for (const provider of this.providers) {
      try {
        const assets = await provider.fetchTop100Assets();
        if (assets.length > 0) {
          dataCache.set(cacheKey, assets);
          return assets;
        }
      } catch (error) {
        console.warn(`Crypto provider failed, trying next:`, error);
        continue;
      }
    }

    // If all providers fail, return empty array
    console.warn('All crypto providers failed');
    return [];
  }

  async searchAssets(query: string): Promise<CryptoAsset[]> {
    const cacheKey = `crypto_search_${query.toLowerCase()}`;
    
    // Check cache first for this specific search
    const cached = dataCache.get<CryptoAsset[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Try providers in order
    for (const provider of this.providers) {
      try {
        const assets = await provider.searchAssets(query);
        dataCache.set(cacheKey, assets);
        return assets;
      } catch (error) {
        console.warn(`Crypto search provider failed, trying next:`, error);
        continue;
      }
    }

    return [];
  }

  clearCache(): void {
    dataCache.clear();
  }
}

export const cryptoDataService = new CryptoDataService();

// Utility functions for crypto templates
export function generateCryptoTitle(asset: CryptoAsset, target: number, date: Date): string {
  return `Will ${asset.symbol.toUpperCase()} price reach ≥ $${target.toLocaleString()} by ${formatCryptoDate(date)}?`;
}

export function generateCryptoDescription(asset: CryptoAsset, target: number, date: Date): string {
  const dateStr = formatCryptoDateUTC(date);
  return `YES if the CoinGecko USD price for ${asset.symbol.toUpperCase()} is ≥ $${target.toLocaleString()} at 23:59 UTC on ${dateStr}.
NO otherwise. Source: CoinGecko asset page historical price.`;
}

export function generateCryptoPrimarySource(asset: CryptoAsset): string {
  return `https://www.coingecko.com/en/coins/${asset.id}`;
}

export function generateTargetSuggestions(currentPrice: number): number[] {
  const suggestions = [
    Math.round(currentPrice * 1.05), // +5%
    Math.round(currentPrice * 1.10), // +10%
    Math.round(currentPrice * 1.25), // +25%
    Math.round(currentPrice * 1.50), // +50%
    Math.round(currentPrice * 2.00), // +100%
  ];
  
  // Add some round numbers near current price
  const roundNumbers = [
    Math.ceil(currentPrice / 1000) * 1000, // Next thousand
    Math.ceil(currentPrice / 500) * 500,   // Next 500
    Math.ceil(currentPrice / 100) * 100,   // Next hundred
  ].filter(n => n > currentPrice);
  
  return [...new Set([...suggestions, ...roundNumbers])].sort((a, b) => a - b);
}

function formatCryptoDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCryptoDateUTC(date: Date): string {
  return date.toISOString().split('T')[0];
}
