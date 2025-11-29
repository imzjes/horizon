import { Game } from './types';

export interface DemoMarket {
  id: string;
  title: string;
  description: string;
  category: 'sports' | 'crypto' | 'entertainment';
  marketType: 'binary' | 'ternary';
  outcomes: string[];
  currentProbabilities: number[];
  /**
   * Convenience field for binary markets where we want a single
   * YES probability value. When not explicitly set, the UI will
   * derive YES probability from currentProbabilities[0].
   */
  yesProbability?: number;
  totalLiquidity: number;
  totalVolume: number;
  participants: number;
  createdAt: string;
  resolveAt: string;
  creator: string;
  imageUrl?: string;
  game?: Game;
  priceHistory: Array<{
    timestamp: string;
    probabilities: number[];
    volume: number;
  }>;
}

// Generate realistic price history data
function generatePriceHistory(
  days: number,
  initialProbabilities: number[],
  volatility: number = 0.1
): Array<{ timestamp: string; probabilities: number[]; volume: number }> {
  const history = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    // Add some realistic volatility to probabilities
    const probabilities = initialProbabilities.map(prob => {
      const change = (Math.random() - 0.5) * volatility;
      const newProb = Math.max(0.1, Math.min(0.9, prob + change));
      return Math.round(newProb * 100) / 100;
    });
    
    // Normalize probabilities to sum to 1
    const sum = probabilities.reduce((a, b) => a + b, 0);
    const normalizedProbs = probabilities.map(p => Math.round((p / sum) * 100) / 100);
    
    // Generate volume (higher volume on recent days)
    const volumeMultiplier = Math.max(0.1, 1 - (i / days) * 0.8);
    const volume = Math.round((Math.random() * 5000 + 1000) * volumeMultiplier);
    
    history.push({
      timestamp: date.toISOString(),
      probabilities: normalizedProbs,
      volume
    });
  }
  
  return history;
}

// Basketball games (binary markets)
const basketballGames: DemoMarket[] = [
  {
    id: 'demo_basketball_1',
    title: 'Lakers vs Warriors: Who wins?',
    description: 'Los Angeles Lakers vs Golden State Warriors - Regular Season Game',
    category: 'sports',
    marketType: 'binary',
    outcomes: ['Lakers', 'Warriors'],
    currentProbabilities: [0.52, 0.48],
    totalLiquidity: 12500,
    totalVolume: 8900,
    participants: 234,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resolveAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    creator: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    game: {
      id: 'nba_lakers_warriors',
      league: 'NBA',
      startsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      home: 'Lakers',
      away: 'Warriors',
      venue: 'Crypto.com Arena',
      sourceUrl: 'https://www.nba.com/game/lakers-warriors',
      allowsDraw: false
    },
    priceHistory: generatePriceHistory(7, [0.52, 0.48], 0.08)
  },
  {
    id: 'demo_basketball_2',
    title: 'Celtics vs Heat: Who wins?',
    description: 'Boston Celtics vs Miami Heat - Regular Season Game',
    category: 'sports',
    marketType: 'binary',
    outcomes: ['Celtics', 'Heat'],
    currentProbabilities: [0.68, 0.32],
    totalLiquidity: 18700,
    totalVolume: 12300,
    participants: 189,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolveAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    creator: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    game: {
      id: 'nba_celtics_heat',
      league: 'NBA',
      startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      home: 'Celtics',
      away: 'Heat',
      venue: 'TD Garden',
      sourceUrl: 'https://www.nba.com/game/celtics-heat',
      allowsDraw: false
    },
    priceHistory: generatePriceHistory(5, [0.68, 0.32], 0.06)
  },
  {
    id: 'demo_basketball_3',
    title: 'Nuggets vs Suns: Who wins?',
    description: 'Denver Nuggets vs Phoenix Suns - Regular Season Game',
    category: 'sports',
    marketType: 'binary',
    outcomes: ['Nuggets', 'Suns'],
    currentProbabilities: [0.45, 0.55],
    totalLiquidity: 9800,
    totalVolume: 6700,
    participants: 156,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    resolveAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    creator: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    game: {
      id: 'nba_nuggets_suns',
      league: 'NBA',
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      home: 'Nuggets',
      away: 'Suns',
      venue: 'Ball Arena',
      sourceUrl: 'https://www.nba.com/game/nuggets-suns',
      allowsDraw: false
    },
    priceHistory: generatePriceHistory(10, [0.45, 0.55], 0.12)
  }
];

// Soccer games with draw option (ternary markets)
const soccerGames: DemoMarket[] = [
  {
    id: 'demo_soccer_1',
    title: 'Manchester City vs Arsenal: Match Outcome',
    description: 'Manchester City vs Arsenal - Premier League Match',
    category: 'sports',
    marketType: 'ternary',
    outcomes: ['Manchester City', 'Draw', 'Arsenal'],
    currentProbabilities: [0.42, 0.28, 0.30],
    totalLiquidity: 22100,
    totalVolume: 15600,
    participants: 312,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolveAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    creator: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    game: {
      id: 'soccer_city_arsenal',
      league: 'MLS', // Using MLS as proxy for soccer
      startsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      home: 'Manchester City',
      away: 'Arsenal',
      venue: 'Etihad Stadium',
      sourceUrl: 'https://www.premierleague.com/match/city-arsenal',
      allowsDraw: true
    },
    priceHistory: generatePriceHistory(6, [0.42, 0.28, 0.30], 0.1)
  },
  {
    id: 'demo_soccer_2',
    title: 'Barcelona vs Real Madrid: Match Outcome',
    description: 'Barcelona vs Real Madrid - La Liga El Clasico',
    category: 'sports',
    marketType: 'ternary',
    outcomes: ['Barcelona', 'Draw', 'Real Madrid'],
    currentProbabilities: [0.38, 0.25, 0.37],
    totalLiquidity: 45600,
    totalVolume: 28900,
    participants: 567,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resolveAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    creator: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    game: {
      id: 'soccer_barca_madrid',
      league: 'MLS', // Using MLS as proxy for soccer
      startsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      home: 'Barcelona',
      away: 'Real Madrid',
      venue: 'Camp Nou',
      sourceUrl: 'https://www.laliga.com/match/barcelona-madrid',
      allowsDraw: true
    },
    priceHistory: generatePriceHistory(8, [0.38, 0.25, 0.37], 0.15)
  }
];

// Crypto market
const cryptoMarket: DemoMarket = {
  id: 'demo_crypto_1',
  title: 'Will Sonic hit $5.88 by December 31st, 2025?',
  description: 'Sonic token price prediction - Will SONIC reach $5.88 USD by end of 2025?',
  category: 'crypto',
  marketType: 'binary',
  outcomes: ['Yes', 'No'],
  currentProbabilities: [0.23, 0.77],
  totalLiquidity: 34500,
  totalVolume: 22300,
  participants: 445,
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  resolveAt: new Date('2025-12-31T23:59:59.999Z').toISOString(),
  creator: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  priceHistory: generatePriceHistory(30, [0.23, 0.77], 0.2)
};

// Entertainment market
const entertainmentMarket: DemoMarket = {
  id: 'demo_entertainment_1',
  title: 'Will Taylor Swift be pregnant in 2025?',
  description: 'Celebrity prediction - Will Taylor Swift announce a pregnancy in 2025?',
  category: 'entertainment',
  marketType: 'binary',
  outcomes: ['Yes', 'No'],
  currentProbabilities: [0.12, 0.88],
  totalLiquidity: 8900,
  totalVolume: 5600,
  participants: 123,
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  resolveAt: new Date('2025-12-31T23:59:59.999Z').toISOString(),
  creator: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
  priceHistory: generatePriceHistory(14, [0.12, 0.88], 0.05)
};

export const DEMO_MARKETS: DemoMarket[] = [
  ...basketballGames,
  ...soccerGames,
  cryptoMarket,
  entertainmentMarket
];

// Helper function to get market by ID
export function getDemoMarket(id: string): DemoMarket | undefined {
  return DEMO_MARKETS.find(market => market.id === id);
}

// Helper function to get markets by category
export function getDemoMarketsByCategory(category: string): DemoMarket[] {
  return DEMO_MARKETS.filter(market => market.category === category);
}

// Helper function to get recent markets
export function getRecentDemoMarkets(limit: number = 10): DemoMarket[] {
  return DEMO_MARKETS
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
