// Demo data for showcasing the platform without wallet connection

export interface DemoMarket {
  id: string;
  title: string;
  category: string;
  description: string;
  creator: string;
  createdAt: number;
  resolveAt: number;
  primarySource: string;
  yesProbability: number; // basis points (0-10000)
  liquidityUsd: bigint;
  volumeUsd: bigint;
  openInterestUsd: bigint;
  status: 'active' | 'resolved' | 'disputed' | 'invalid';
  resolvedOutcome?: boolean;
  totalLpSupply: bigint;
  yesReserve: bigint;
  noReserve: bigint;
  imageUrl?: string; // Optional banner image
  outcomes?: { label: string; probBps: number }[]; // Optional multi-outcome (e.g., 3-way)
}

export interface DemoUserPosition {
  marketId: string;
  yesTokens: bigint;
  noTokens: bigint;
  lpTokens: bigint;
  averagePrice: number;
  realizedPnl: bigint;
  unrealizedPnl: bigint;
}

// Demo markets data
export const DEMO_MARKETS: DemoMarket[] = [
  // 2-way Sports (binary)
  {
    id: 'demo_sports_vikings_bears_20250908',
    title: 'Vikings vs Bears: Who wins?',
    category: 'Sports',
    description: 'Resolves to the official game winner. Overtime counts.',
    creator: '0xDemoCreator',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    resolveAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
    primarySource: 'https://www.espn.com/nfl/',
    yesProbability: 5400,
    liquidityUsd: BigInt('20000000000'),
    volumeUsd: BigInt('8330000000'),
    openInterestUsd: BigInt('12000000000'),
    status: 'active',
    totalLpSupply: BigInt('20000000000'),
    yesReserve: BigInt('9200000000'),
    noReserve: BigInt('10800000000'),
    imageUrl: '/images/placeholders/sports-card.jpg'
  },
  // 3-way Sports (ternary) with Draw in the middle
  {
    id: 'demo_sports_united_city_draw_20250912',
    title: 'United vs City: Match outcome',
    category: 'Sports',
    description: 'Regulation-time result. Draw is valid outcome.',
    creator: '0xDemoCreator',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    resolveAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    primarySource: 'https://www.espn.com/soccer/',
    yesProbability: 0, // unused for multi-outcome
    liquidityUsd: BigInt('15000000000'),
    volumeUsd: BigInt('4300000000'),
    openInterestUsd: BigInt('10000000000'),
    status: 'active',
    totalLpSupply: BigInt('15000000000'),
    yesReserve: BigInt('0'),
    noReserve: BigInt('0'),
    imageUrl: '/images/placeholders/soccer-card.jpg',
    outcomes: [
      { label: 'UNITED', probBps: 4100 },
      { label: 'DRAW', probBps: 1800 },
      { label: 'CITY', probBps: 4100 }
    ]
  },
];

// Demo user positions for testing
export const DEMO_USER_POSITIONS: DemoUserPosition[] = [
  {
    marketId: '0x1234567890123456789012345678901234567890123456789012345678901234',
    yesTokens: BigInt('15000000'), // 15 YES tokens
    noTokens: BigInt('0'),
    lpTokens: BigInt('5000000000'), // $5,000 LP
    averagePrice: 0.68,
    realizedPnl: BigInt('0'),
    unrealizedPnl: BigInt('2400000'), // $2.40 unrealized profit
  },
  {
    marketId: '0x2345678901234567890123456789012345678901234567890123456789012345',
    yesTokens: BigInt('0'),
    noTokens: BigInt('25000000'), // 25 NO tokens
    lpTokens: BigInt('0'),
    averagePrice: 0.68, // Bought NO at 68% (paid 32 cents each)
    realizedPnl: BigInt('0'),
    unrealizedPnl: BigInt('-1200000'), // -$1.20 unrealized loss
  },
];

// Demo creator stats
export const DEMO_CREATOR_STATS = {
  totalEarnings: BigInt('8750000000'), // $8,750
  activeMarkets: 3,
  totalVolume: BigInt('445200000000'), // $445,200
  averageVolume: BigInt('148400000000'), // $148,400
  reputation: 87,
};

// Demo market categories with counts
export const DEMO_CATEGORIES = [
  { name: 'All', count: DEMO_MARKETS.length },
  { name: 'Sports', count: DEMO_MARKETS.filter(m => m.category === 'Sports').length },
  { name: 'Crypto', count: DEMO_MARKETS.filter(m => m.category === 'Crypto').length },
  { name: 'Technology', count: DEMO_MARKETS.filter(m => m.category === 'Technology').length },
  { name: 'Economics', count: DEMO_MARKETS.filter(m => m.category === 'Economics').length },
  { name: 'Politics', count: DEMO_MARKETS.filter(m => m.category === 'Politics').length },
];

// Helper functions
export function getDemoMarket(id: string): DemoMarket | undefined {
  return DEMO_MARKETS.find(market => market.id === id);
}

export function getDemoMarketsByCategory(category: string): DemoMarket[] {
  if (category === 'All') return DEMO_MARKETS;
  return DEMO_MARKETS.filter(market => market.category === category);
}

export function getUserPosition(marketId: string): DemoUserPosition | undefined {
  return DEMO_USER_POSITIONS.find(pos => pos.marketId === marketId);
}

export function calculateProbabilityFromReserves(yesReserve: bigint, noReserve: bigint): number {
  const total = yesReserve + noReserve;
  if (total === BigInt('0')) return 5000; // 50% if no liquidity
  
  // In CPMM, probability = noReserve / (yesReserve + noReserve)
  // Because buying YES removes from noReserve, increasing YES probability
  return Math.round(Number(noReserve * BigInt('10000') / total));
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

