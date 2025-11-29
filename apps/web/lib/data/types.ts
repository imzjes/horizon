// Data types for template auto-fill system

export type Game = {
  id: string;
  league: 'NBA' | 'NFL' | 'MLS' | 'NHL';
  startsAt: string;      // ISO (UTC)
  home: string;
  away: string;
  venue?: string;
  sourceUrl?: string;    // e.g., ESPN/FoxSports boxscore page
  allowsDraw?: boolean;  // True for sports where draws are possible
};

export type CryptoAsset = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
};

export type League = 'NBA' | 'NFL' | 'MLS' | 'NHL';

export type PredictionType = 'price_target';

export interface DateRange {
  startUTC: Date;
  endUTC: Date;
}

export interface GameQueryOptions {
  startUTC?: Date;
  endUTC?: Date;
  includeLive?: boolean;
  includePostponed?: boolean;
}

export interface SportsProvider {
  fetchUpcomingGames(league: League, options?: GameQueryOptions): Promise<Game[]>;
}

export interface CryptoProvider {
  fetchTop100Assets(): Promise<CryptoAsset[]>;
  searchAssets(query: string): Promise<CryptoAsset[]>;
}

// Cache interface
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export type CacheKey = string;
