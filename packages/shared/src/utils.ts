// Shared utility functions

import { USDC_DECIMALS, BASIS_POINTS_DIVISOR } from './constants';

/**
 * Format USDC amount (bigint with 6 decimals) to human readable string
 */
export function formatUSDC(amount: bigint, decimals: number = 2): string {
  const divisor = BigInt(10 ** USDC_DECIMALS);
  const whole = amount / divisor;
  const fractional = amount % divisor;
  
  const wholeStr = whole.toString();
  const fractionalStr = fractional.toString().padStart(USDC_DECIMALS, '0');
  
  const value = parseFloat(`${wholeStr}.${fractionalStr}`);
  
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(decimals)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(decimals)}K`;
  } else {
    return `$${value.toFixed(decimals)}`;
  }
}

/**
 * Parse USDC string to bigint with 6 decimals
 */
export function parseUSDC(amount: string): bigint {
  const num = parseFloat(amount);
  if (isNaN(num)) throw new Error('Invalid USDC amount');
  
  const multiplier = BigInt(10 ** USDC_DECIMALS);
  return BigInt(Math.floor(num * (10 ** USDC_DECIMALS)));
}

/**
 * Format probability from basis points to percentage
 */
export function formatProbability(basisPoints: number): string {
  const percentage = (basisPoints / BASIS_POINTS_DIVISOR) * 100;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Format time remaining until a date
 */
export function formatTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Calculate price impact for a trade
 */
export function calculatePriceImpact(
  currentPrice: number,
  newPrice: number
): number {
  if (currentPrice === 0) return 0;
  return Math.abs((newPrice - currentPrice) / currentPrice) * 100;
}

/**
 * Generate market ID from parameters (for duplicate detection)
 */
export function generateMarketId(
  category: string,
  title: string,
  resolveAt: number,
  primarySource: string,
  ruleBytes: string
): string {
  // This should match the contract's hash calculation
  const normalizedTitle = title.toLowerCase().trim();
  const data = `${category}${normalizedTitle}${resolveAt}${primarySource}${ruleBytes}`;
  
  // Note: In practice, this would use the same keccak256 hash as the contract
  // For now, we'll use a simple hash for client-side duplicate detection
  return `0x${Buffer.from(data).toString('hex').slice(0, 64)}`;
}

/**
 * Validate evidence data structure
 */
export function validateEvidenceData(data: any): boolean {
  return (
    typeof data.eventId === 'string' &&
    typeof data.sourceUrl === 'string' &&
    typeof data.fetchedAt === 'string' &&
    typeof data.parsedOutcome === 'string' &&
    ['YES', 'NO', 'VALUE'].includes(data.parsedOutcome) &&
    typeof data.notes === 'string' &&
    (data.rawValue !== undefined || data.snapshot !== undefined)
  );
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if market is expired
 */
export function isMarketExpired(resolveAt: Date): boolean {
  return new Date() > resolveAt;
}

/**
 * Calculate effective price per token
 */
export function calculateEffectivePrice(amountIn: bigint, tokensOut: bigint): number {
  if (tokensOut === BigInt('0')) return 0;
  
  const amountInFloat = Number(amountIn) / (10 ** USDC_DECIMALS);
  const tokensOutFloat = Number(tokensOut) / (10 ** USDC_DECIMALS);
  
  return amountInFloat / tokensOutFloat;
}
