'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, parseEventLogs } from 'viem';
import { EventFactoryABI, MarketAMMABI, ERC20ABI, FeeConfigABI } from '@sonic-prediction-market/shared';
import { getContractAddresses } from '../config';
import { MarketParams, generateMarketHash, validateMarketParams, useDuplicateDetection } from '../duplicate-detection';
import { Game } from '../data/types';
import { CryptoAsset } from '../data/types';
import { generateSportsTitle, generateSportsDescription, calculateSportsResolveAt, calculateSportsMaxDeadline, getSportsResolutionRules } from '../data/sports';
import { generateCryptoTitle, generateCryptoDescription, generateCryptoPrimarySource } from '../data/crypto';

export type TemplateType = 'manual' | 'sports' | 'crypto';
export type MarketType = 'binary' | 'ternary';
export type CreateMarketStep = 'template' | 'details' | 'review' | 'launch';

export interface CreateMarketState {
  // Step management
  currentStep: CreateMarketStep;
  templateType: TemplateType;
  
  // Sports template
  selectedLeague?: 'NBA' | 'NFL' | 'MLS' | 'NHL';
  selectedGame?: Game;
  marketType?: MarketType; // binary or ternary based on sport
  
  // Crypto template
  selectedAsset?: CryptoAsset;
  targetPrice?: number;
  targetDate?: Date;
  
  // Market parameters
  params: Partial<MarketParams>;
  
  // Costs
  initialLiquidity: string;
  
  // Transaction state
  isCreating: boolean;
  createError?: string;
  txHash?: `0x${string}`;
  createdMarketId?: string;
  createdAmmAddress?: string;
}

export function useCreateMarket() {
  const { address, isConnected } = useAccount();
  const contracts = getContractAddresses();
  
  const [state, setState] = useState<CreateMarketState>({
    currentStep: 'template',
    templateType: 'manual',
    params: {},
    initialLiquidity: '0',
    isCreating: false,
  });

  // Contract interactions
  const { writeContractAsync } = useWriteContract();
  
  // Get creation bond from FeeConfig (USDC units)
  const { data: creationBond } = useReadContract({
    address: contracts.feeConfig,
    abi: FeeConfigABI,
    functionName: 'createBond',
    query: { staleTime: 30_000 }
  });

  // USDC decimals for accurate parsing/formatting
  const { data: usdcDecimals } = useReadContract({
    address: contracts.usdc,
    abi: ERC20ABI,
    functionName: 'decimals',
    query: { staleTime: 60_000 }
  });

  // Get current allowance
  const { data: allowance, refetch: refetchAllowance, isLoading: allowanceLoading } = useReadContract({
    address: contracts.usdc,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: address ? [address, contracts.eventFactory] : undefined,
    query: { 
      staleTime: 0, // Always fetch fresh data
      refetchInterval: 10000, // Refetch every 10 seconds
      enabled: !!address // Only fetch when address is available
    }
  } as any);

  // Calculate required amounts
  const liquidityAmount = useMemo(() => {
    const decimals = typeof usdcDecimals === 'number' ? usdcDecimals : 6;
    return state.initialLiquidity ? parseUnits(state.initialLiquidity, decimals) : BigInt(0);
  }, [state.initialLiquidity, usdcDecimals]);

  const totalRequired = useMemo(() => {
    const bondAmount = typeof creationBond === 'bigint' ? creationBond : BigInt(0);
    return bondAmount + liquidityAmount;
  }, [creationBond, liquidityAmount]);

  const hasRequiredAllowance = useMemo(() => {
    const allowanceAmount = typeof allowance === 'bigint' ? allowance : BigInt(0);
    
    // Check if allowance is unreasonably large (likely max uint256) or if it's exactly 0
    const maxReasonableAllowance = BigInt('1000000000000000000000000000'); // 1M USDC with 6 decimals
    const isAllowanceUnreasonable = allowanceAmount > maxReasonableAllowance;
    const isAllowanceZero = allowanceAmount === BigInt(0);
    
    // Force approval needed if allowance is loading, 0, unreasonable, or insufficient
    const result = !allowanceLoading && !isAllowanceZero && !isAllowanceUnreasonable && allowanceAmount >= totalRequired;
    
    // Debug logging
    console.log('useCreateMarket Debug:', {
      allowanceAmount: allowanceAmount.toString(),
      totalRequired: totalRequired.toString(),
      hasRequiredAllowance: result,
      isAllowanceUnreasonable,
      isAllowanceZero,
      allowanceLoading,
      maxReasonableAllowance: maxReasonableAllowance.toString()
    });
    
    return result;
  }, [allowance, totalRequired]);

  // Generate market hash for duplicate detection
  const marketHash = useMemo(() => {
    const validation = validateMarketParams(state.params);
    if (!validation.isValid) return null;
    return generateMarketHash(state.params as MarketParams);
  }, [state.params]);

  // Duplicate detection
  const duplicateCheck = useDuplicateDetection(
    marketHash ? (state.params as MarketParams) : null
  );

  // Step navigation
  const setCurrentStep = useCallback((step: CreateMarketStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const setTemplateType = useCallback((type: TemplateType) => {
    setState(prev => ({ 
      ...prev, 
      templateType: type,
      selectedGame: undefined,
      selectedAsset: undefined,
      targetPrice: undefined,
      targetDate: undefined,
      params: type === 'manual' ? prev.params : {}
    }));
  }, []);

  // Sports template actions
  const setSelectedLeague = useCallback((league: 'NBA' | 'NFL' | 'MLS' | 'NHL') => {
    setState(prev => ({ ...prev, selectedLeague: league, selectedGame: undefined }));
  }, []);

  const setSelectedGame = useCallback((game: Game) => {
    setState(prev => {
      const resolveAt = Math.floor(calculateSportsResolveAt(game).getTime() / 1000);
      const marketType = game.allowsDraw ? 'ternary' : 'binary';
      
      return {
        ...prev,
        selectedGame: game,
        marketType,
        params: {
          category: game.league,
          title: generateSportsTitle(game),
          rules: generateSportsDescription(game),
          resolveAt,
          primarySource: game.sourceUrl || `https://www.${game.league.toLowerCase()}.com`,
        }
      };
    });
  }, []);

  // Crypto template actions
  const setSelectedAsset = useCallback((asset: CryptoAsset) => {
    setState(prev => ({ ...prev, selectedAsset: asset }));
  }, []);

  const setCryptoTarget = useCallback((targetPrice: number, targetDate: Date) => {
    setState(prev => {
      if (!prev.selectedAsset) return prev;
      
      // Ensure the target date is set to 23:59:59 UTC for consistent resolution
      const endOfDayDate = new Date(targetDate);
      endOfDayDate.setUTCHours(23, 59, 59, 999);
      const resolveAt = Math.floor(endOfDayDate.getTime() / 1000);
      
      return {
        ...prev,
        targetPrice,
        targetDate: endOfDayDate,
        params: {
          category: 'Crypto',
          title: generateCryptoTitle(prev.selectedAsset, targetPrice, endOfDayDate),
          rules: generateCryptoDescription(prev.selectedAsset, targetPrice, endOfDayDate),
          resolveAt,
          primarySource: generateCryptoPrimarySource(prev.selectedAsset),
        }
      };
    });
  }, []);

  // Manual parameter updates
  const updateParams = useCallback((updates: Partial<MarketParams>) => {
    setState(prev => ({
      ...prev,
      params: { ...prev.params, ...updates }
    }));
  }, []);

  const setInitialLiquidity = useCallback((amount: string) => {
    setState(prev => ({ ...prev, initialLiquidity: amount }));
  }, []);

  // USDCs approval
  const approveUSDCs = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const txHash = await writeContractAsync({
        address: contracts.usdc,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [contracts.eventFactory, totalRequired],
      });

      // Wait for the transaction to be mined and then refetch allowance
      // This ensures the UI updates immediately after approval
      setTimeout(() => {
        refetchAllowance();
      }, 2000); // Wait 2 seconds for the transaction to be mined

      return txHash;
    } catch (error) {
      console.error('Approval failed:', error);
      throw error;
    }
  }, [isConnected, address, writeContractAsync, contracts, totalRequired, refetchAllowance]);

  // Create market
  const createMarket = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    const validation = validateMarketParams(state.params);
    if (!validation.isValid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }

    if (duplicateCheck.isDuplicate) {
      throw new Error('A market with these parameters already exists');
    }

    if (!hasRequiredAllowance) {
      throw new Error('USDC spending not approved');
    }

    setState(prev => ({ ...prev, isCreating: true, createError: undefined }));

    try {
      const params = state.params as MarketParams;
      
      // Create the market
      const txHash = await writeContractAsync({
        address: contracts.eventFactory,
        abi: EventFactoryABI,
        functionName: 'createEvent',
        args: [
          params.category,
          params.title,
          params.rules,
          BigInt(params.resolveAt),
          params.primarySource,
          liquidityAmount.toString()
        ] as any,
      });

      setState(prev => ({ ...prev, txHash }));

      // Wait for transaction receipt to get the created market details
      // This would typically be handled by the component using useWaitForTransactionReceipt
      
      return txHash;
    } catch (error) {
      console.error('Market creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ 
        ...prev, 
        isCreating: false, 
        createError: errorMessage 
      }));
      throw error;
    }
  }, [
    isConnected,
    address,
    state.params,
    duplicateCheck.isDuplicate,
    hasRequiredAllowance,
    writeContractAsync,
    contracts,
    liquidityAmount
  ]);

  // Handle successful market creation
  const handleMarketCreated = useCallback((marketId: string, ammAddress: string) => {
    setState(prev => ({
      ...prev,
      isCreating: false,
      createdMarketId: marketId,
      createdAmmAddress: ammAddress,
    }));

    // Store the created market in localStorage for the Markets page to display
    try {
      const existingMarkets = JSON.parse(localStorage.getItem('horizon-created-markets') || '[]');
      const newMarket = {
        id: marketId,
        ammAddress: ammAddress,
        title: state.params.title || 'New Market',
        category: state.params.category || 'General',
        createdAt: Date.now(),
        creator: address
      };
      existingMarkets.unshift(newMarket); // Add to beginning
      localStorage.setItem('horizon-created-markets', JSON.stringify(existingMarkets));
    } catch (error) {
      console.error('Failed to store market in localStorage:', error);
    }
  }, [state.params, address]);

  return {
    // State
    state,
    marketHash,
    duplicateCheck,
    totalRequired,
    hasRequiredAllowance,
    
    // Actions
    setCurrentStep,
    setTemplateType,
    setSelectedLeague,
    setSelectedGame,
    setSelectedAsset,
    setCryptoTarget,
    updateParams,
    setInitialLiquidity,
    approveUSDCs,
    createMarket,
    handleMarketCreated,
    
    // Computed
    isValid: validateMarketParams(state.params).isValid,
    validationErrors: validateMarketParams(state.params).errors,
    canCreate: isConnected && 
               hasRequiredAllowance && 
               validateMarketParams(state.params).isValid && 
               !duplicateCheck.isDuplicate &&
               !state.isCreating,
  };
}
