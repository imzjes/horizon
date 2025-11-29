import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { MarketAMMABI, EventFactoryABI } from '@sonic-prediction-market/shared';
import { getContractAddresses } from '../config';
import { formatUnits, parseUnits } from 'viem';

export function useMarket(marketId: string) {
  const { address } = useAccount();
  const contracts = getContractAddresses();

  // Get market info from EventFactory
  const { data: eventInfo, isLoading: eventLoading } = useReadContract({
    address: contracts.eventFactory,
    abi: EventFactoryABI,
    functionName: 'getEvent',
    args: [marketId as `0x${string}`],
  });

  // Get market data from AMM (if we have AMM address)
  const ammAddress = eventInfo?.ammAddress as `0x${string}` | undefined;

  // Get all market data in one call
  const { data: marketData } = useReadContract({
    address: ammAddress,
    abi: MarketAMMABI,
    functionName: 'getMarketData',
    query: { enabled: !!ammAddress },
  });

  // Get user position data
  const { data: userPosition } = useReadContract({
    address: ammAddress,
    abi: MarketAMMABI,
    functionName: 'getUserPosition',
    args: address ? [address] : undefined,
    query: { enabled: !!ammAddress && !!address },
  });

  // Extract data from the market data object
  const yesReserve = marketData?.yesReserve || BigInt('0');
  const noReserve = marketData?.noReserve || BigInt('0');
  const liquidityUsd = marketData?.liquidityUsd || BigInt('0');
  const volumeUsd = marketData?.volumeUsd || BigInt('0');
  const totalLpSupply = marketData?.totalLpSupply || BigInt('1');
  
  // Calculate yes probability from reserves
  const totalReserve = yesReserve + noReserve;
  const yesProbability = totalReserve > BigInt('0') 
    ? (Number(yesReserve) / Number(totalReserve)) * 10000 // Convert to basis points
    : 5000; // Default to 50%
  
  // Extract user position data
  const userLpBalance = userPosition?.[2] || BigInt('0'); // LP tokens from getUserPosition
  
  // Calculate user LP share percentage
  const userLpShare = userLpBalance && totalLpSupply && totalLpSupply > BigInt('0')
    ? (Number(userLpBalance) / Number(totalLpSupply)) * 100
    : 0;

  // Trade quote function
  const getQuote = (isYes: boolean, amountUSDC: string) => {
    if (!ammAddress || !amountUSDC) return null;
    
    // This would normally be a contract call, but for simplicity
    // we'll calculate a basic quote client-side
    const amount = parseUnits(amountUSDC, 6);
    return { tokensOut: amount, fee: amount / BigInt('100') }; // 1% fee estimate
  };

  // Write functions
  const { writeContract: buyYes, isPending: buyYesPending } = useWriteContract();
  const { writeContract: buyNo, isPending: buyNoPending } = useWriteContract();
  const { writeContract: provideLiquidity, isPending: provideLiquidityPending } = useWriteContract();

  const executeBuyYes = (amountUSDC: string) => {
    if (!ammAddress) return;
    const amount = parseUnits(amountUSDC, 6);
    const minTokensOut = BigInt('0'); // Accept any amount of tokens
    buyYes({
      address: ammAddress,
      abi: MarketAMMABI,
      functionName: 'buyYes',
      args: [amount, minTokensOut],
    });
  };

  const executeBuyNo = (amountUSDC: string) => {
    if (!ammAddress) return;
    const amount = parseUnits(amountUSDC, 6);
    const minTokensOut = BigInt('0'); // Accept any amount of tokens
    buyNo({
      address: ammAddress,
      abi: MarketAMMABI,
      functionName: 'buyNo',
      args: [amount, minTokensOut],
    });
  };

  const executeProvideLiquidity = (amountUSDC: string) => {
    if (!ammAddress) return;
    const amount = parseUnits(amountUSDC, 6);
    provideLiquidity({
      address: ammAddress,
      abi: MarketAMMABI,
      functionName: 'provideLiquidity',
      args: [amount],
    });
  };

  return {
    // Data
    eventInfo,
    marketData: {
      marketId,
      eventInfo,
      yesProbability: yesProbability,
      liquidityUsd: liquidityUsd,
      volumeUsd: volumeUsd,
      openInterestUsd: BigInt('0'), // Not available in current ABI
      userLpBalance: userLpBalance || BigInt('0'),
      userLpShare,
    },
    
    // Loading states
    isLoading: eventLoading,
    
    // Functions
    getQuote,
    executeBuyYes,
    executeBuyNo,
    executeProvideLiquidity,
    
    // Pending states
    isPending: buyYesPending || buyNoPending || provideLiquidityPending,
  };
}
