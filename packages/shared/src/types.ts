// Shared types for the prediction market

export interface EventParams {
  category: string;
  title: string;
  description: string;
  resolveAt: number;
  primarySource: string;
  ruleBytes: string;
  initialLiquidity: bigint;
}

export interface EventInfo {
  marketId: string;
  creator: string;
  ammAddress: string;
  createdAt: number;
  resolveAt: number;
  category: string;
  title: string;
  description: string;
  primarySource: string;
  ruleBytes: string;
  createBondAmount: bigint;
  bondRefunded: boolean;
  finalized: boolean;
}

export interface MarketData {
  marketId: string;
  eventInfo: EventInfo;
  yesProbability: number; // in basis points (0-10000)
  liquidityUsd: bigint;
  volumeUsd: bigint;
  openInterestUsd: bigint;
  userLpBalance?: bigint;
  userLpShare?: number; // percentage
}

export interface TradeQuote {
  tokensOut: bigint;
  fee: bigint;
  effectivePrice: number; // price per token in USDC
  priceImpact: number; // percentage
}

export enum ResolutionState {
  PENDING = 0,
  REPORTABLE = 1,
  REPORTED = 2,
  DISPUTED = 3,
  RESOLVED = 4
}

export interface ResolutionInfo {
  state: ResolutionState;
  reporter?: string;
  reportedOutcome?: boolean;
  evidenceURI?: string;
  disputer?: string;
  disputeReason?: string;
  finalOutcome?: boolean;
  isInvalid?: boolean;
}

export interface EvidenceData {
  eventId: string;
  sourceUrl: string;
  fetchedAt: string; // ISO date string
  rawValue?: string;
  parsedOutcome: 'YES' | 'NO' | 'VALUE';
  snapshot?: string; // IPFS hash
  notes: string;
}

// Frontend-specific types
export interface MarketCardData {
  marketId: string;
  title: string;
  category: string;
  yesProbability: number;
  liquidityUsd: string; // formatted for display
  volumeUsd: string; // formatted for display
  resolveAt: Date;
  timeLeft: string; // formatted time remaining
  creator: string;
}

export interface CreatorStats {
  totalEarnings: bigint;
  activeMarkets: number;
  totalVolume: bigint;
  averageVolume: bigint;
  reputation: number; // placeholder for future reputation system
}

// Error types
export interface ContractError {
  code: string;
  message: string;
  details?: any;
}

// Transaction states
export enum TxState {
  IDLE = 'idle',
  PREPARING = 'preparing',
  WAITING_APPROVAL = 'waiting_approval',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface TxStatus {
  state: TxState;
  hash?: string;
  error?: ContractError;
}

// Wallet connection
export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  usdcBalance?: bigint;
  usdcAllowance?: bigint;
}
