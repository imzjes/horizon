// Market duplicate detection using canonical hash

import { keccak256, toBytes } from 'viem';
import { useReadContract } from 'wagmi';
import { EventFactoryABI } from '@sonic-prediction-market/shared';
import { getContractAddresses } from './config';

export type MarketParams = {
  category: string;
  title: string;
  resolveAt: number; // Unix timestamp
  primarySource: string;
  rules: string;
};

// Normalize strings exactly like the contracts do
export function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Generate canonical market hash using same logic as contracts
export function generateMarketHash(params: MarketParams): `0x${string}` {
  const normalizedTitle = normalizeString(params.title);
  const normalizedCategory = normalizeString(params.category);
  const normalizedSource = normalizeString(params.primarySource);
  const normalizedRules = normalizeString(params.rules);
  
  // Pack data exactly like the contract: category | title | resolveAt | primarySource | rules
  const packedData = `${normalizedCategory}|${normalizedTitle}|${params.resolveAt}|${normalizedSource}|${normalizedRules}`;
  
  return keccak256(toBytes(packedData));
}

// Hook to check if a market already exists on-chain
// Note: marketExists function doesn't exist in current ABI, so we return a placeholder
export function useMarketExists(marketHash: `0x${string}` | null) {
  return {
    data: false, // Placeholder - would check if market exists
    isLoading: false,
    error: null
  };
}

// Alternative: Check via events if marketExists function doesn't exist
export function useMarketCreatedEvents() {
  const contracts = getContractAddresses();
  
  // This would use wagmi's event watching to get all MarketCreated events
  // and check if our hash matches any existing market
  // Implementation depends on the exact EventFactory ABI structure
  
  return {
    data: null, // Placeholder - would return array of existing market hashes
    isLoading: false,
    error: null
  };
}

// Client-side duplicate detection result
export type DuplicateCheckResult = {
  isDuplicate: boolean;
  existingMarketId?: string;
  existingAmmAddress?: string;
  isLoading: boolean;
  error?: string;
};

// Main duplicate detection hook
export function useDuplicateDetection(params: MarketParams | null): DuplicateCheckResult {
  const marketHash = params ? generateMarketHash(params) : null;
  const { data: exists, isLoading, error } = useMarketExists(marketHash);
  
  return {
    isDuplicate: !!exists,
    existingMarketId: exists && marketHash ? marketHash : undefined,
    isLoading,
    error: error ? String(error) : undefined,
  };
}

// Utility to format market hash for display (shortened)
export function formatMarketId(hash: `0x${string}`): string {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

// Validation helpers
export function validateMarketParams(params: Partial<MarketParams>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!params.category?.trim()) {
    errors.push('Category is required');
  }
  
  if (!params.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (!params.resolveAt || params.resolveAt <= Date.now() / 1000 + 3600) {
    errors.push('Resolve time must be at least 1 hour in the future');
  }
  
  if (!params.primarySource?.trim()) {
    errors.push('Primary source is required');
  }
  
  if (!params.rules?.trim()) {
    errors.push('Rules are required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
