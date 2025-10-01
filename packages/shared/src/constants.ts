// Protocol constants

export const FEE_BASIS_POINTS = {
  TRADE_FEE: 30, // 0.3%
  SETTLEMENT_FEE: 100, // 1.0%
} as const;

export const BOND_AMOUNTS = {
  CREATE_BOND: BigInt('10000000'), // 10 USDC (6 decimals)
  REPORT_BOND: BigInt('25000000'), // 25 USDC (6 decimals)
  MIN_DISPUTE_BOND: BigInt('25000000'), // 25 USDC (6 decimals)
} as const;

export const TIME_WINDOWS = {
  CREATE_BOND_REFUND: 24 * 60 * 60, // 24 hours in seconds
  DISPUTE_WINDOW: 24 * 60 * 60, // 24 hours in seconds
} as const;

export const USDC_DECIMALS = 6;
export const PERCENTAGE_DECIMALS = 2;
export const BASIS_POINTS_DIVISOR = 10000;

// UI Constants
export const POLLING_INTERVALS = {
  MARKET_DATA: 30_000, // 30 seconds
  USER_BALANCE: 15_000, // 15 seconds
  TRANSACTION_STATUS: 2_000, // 2 seconds
} as const;

export const CATEGORIES = [
  'Sports',
  'Crypto',
  'Politics',
  'Economics',
  'Technology',
  'Weather',
  'Entertainment',
  'Other'
] as const;

export const DEFAULT_MARKET_LIQUIDITY = BigInt('500000000'); // 500 USDC

// IPFS/Pinata constants
export const PINATA_API_URL = 'https://api.pinata.cloud';
export const MAX_EVIDENCE_SIZE = 1024 * 1024; // 1MB

// Network constants
export const SONIC_CHAIN_CONFIG = {
  id: 146,
  name: 'Sonic Mainnet',
  network: 'sonic',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.soniclabs.com'],
    },
    public: {
      http: ['https://rpc.soniclabs.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SonicScan',
      url: 'https://sonicscan.org',
    },
  },
} as const;
