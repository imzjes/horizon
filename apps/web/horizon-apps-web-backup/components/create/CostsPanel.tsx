'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUSDC } from '@sonic-prediction-market/shared';
import { getContractAddresses } from '../../lib/config';
import { FeeConfigABI, ERC20ABI } from '@sonic-prediction-market/shared';

interface CostsPanelProps {
  initialLiquidity: string;
  onInitialLiquidityChange: (amount: string) => void;
  onApprove: () => void;
  onApproveComplete: () => void;
  isApproving: boolean;
  hasRequiredAllowance: boolean;
  totalRequired: bigint;
}

export function CostsPanel({ 
  initialLiquidity,
  onInitialLiquidityChange,
  onApprove,
  onApproveComplete,
  isApproving,
  hasRequiredAllowance,
  totalRequired
}: CostsPanelProps) {
  const { address, isConnected } = useAccount();
  const contracts = getContractAddresses();

  // Get creation bond from FeeConfig (createBond)
  const { data: creationBond } = useReadContract({
    address: contracts.feeConfig,
    abi: FeeConfigABI,
    functionName: 'createBond',
    query: { staleTime: 30_000 }
  });

  // Fee + refund config
  const { data: tradeFeeRate } = useReadContract({
    address: contracts.feeConfig,
    abi: FeeConfigABI,
    functionName: 'tradeFeeRate',
    query: { staleTime: 60_000 }
  });
  const { data: settlementFeeRate } = useReadContract({
    address: contracts.feeConfig,
    abi: FeeConfigABI,
    functionName: 'settlementFeeRate',
    query: { staleTime: 60_000 }
  });
  const { data: createBondRefundPercent } = useReadContract({
    address: contracts.feeConfig,
    abi: FeeConfigABI,
    functionName: 'createBondRefundPercent',
    query: { staleTime: 60_000 }
  });
  const { data: createBondRefundWindow } = useReadContract({
    address: contracts.feeConfig,
    abi: FeeConfigABI,
    functionName: 'createBondRefundWindow',
    query: { staleTime: 60_000 }
  });

  // Fee split (LP/Creator/Protocol) in basis points
  const { data: tradeFeeLP } = useReadContract({
    address: contracts.feeConfig,
    abi: FeeConfigABI,
    functionName: 'tradeFeeLP',
    query: { staleTime: 60_000 }
  });
  const { data: tradeFeeCreator } = useReadContract({
    address: contracts.feeConfig,
    abi: FeeConfigABI,
    functionName: 'tradeFeeCreator',
    query: { staleTime: 60_000 }
  });
  const { data: tradeFeeProtocol } = useReadContract({
    address: contracts.feeConfig,
    abi: FeeConfigABI,
    functionName: 'tradeFeeProtocol',
    query: { staleTime: 60_000 }
  });

  // USDCs token decimals (dynamic formatting)
  const { data: usdcDecimals } = useReadContract({
    address: contracts.usdc,
    abi: ERC20ABI,
    functionName: 'decimals',
    query: { staleTime: 60_000 }
  });

  // Get user's USDCs balance
  const { data: balance } = useReadContract({
    address: contracts.usdc,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { staleTime: 10_000 }
  });

  // Get current allowance for EventFactory
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
  });

  const bond = creationBond || BigInt(0);
  const userBalance = balance || BigInt(0);
  const currentAllowance = allowance || BigInt(0);
  
  // Helpers for decimals-aware math/formatting
  const tokenDecimals = typeof usdcDecimals === 'number' ? usdcDecimals : 6;
  const unit = 10 ** tokenDecimals;
  const toUnits = (amountStr: string) => {
    const n = Number.isFinite(parseFloat(amountStr)) ? parseFloat(amountStr) : 0;
    return BigInt(Math.round(n * unit));
  };
  const formatToken = (value: bigint) => {
    if (tokenDecimals === 6) return formatUSDC(value);
    const whole = Number(value) / unit;
    return `$${whole.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  // Convert user-entered USD string to token units using decimals
  const liquidityAmount = initialLiquidity ? toUnits(initialLiquidity) : BigInt(0);
  const total = bond + liquidityAmount;
  
  // Check if allowance is unreasonably large (likely max uint256) or if it's exactly 0
  const maxReasonableAllowance = BigInt('1000000000000000000000000000'); // 1M USDC with 6 decimals
  const isAllowanceUnreasonable = currentAllowance > maxReasonableAllowance;
  const isAllowanceZero = currentAllowance === BigInt(0);
  
  // Force approval needed if allowance is loading, 0, unreasonable, or insufficient
  const needsApproval = allowanceLoading || isAllowanceZero || isAllowanceUnreasonable || currentAllowance < total;
  const insufficientBalance = userBalance < total;

  // Debug logging to understand the allowance issue
  console.log('CostsPanel Debug:', {
    currentAllowance: currentAllowance.toString(),
    total: total.toString(),
    needsApproval,
    hasRequiredAllowance: hasRequiredAllowance,
    bond: bond.toString(),
    liquidityAmount: liquidityAmount.toString(),
    isAllowanceUnreasonable,
    isAllowanceZero,
    allowanceLoading,
    maxReasonableAllowance: maxReasonableAllowance.toString(),
    eventFactoryAddress: contracts.eventFactory,
    usdcAddress: contracts.usdc,
    userAddress: address
  });

  const handleLiquidityChange = (value: string) => {
    // Only allow positive numbers
    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
      onInitialLiquidityChange(value);
    }
  };

  const quickAmounts = ['100', '500', '1000', '5000'];
  const percent = (bp?: bigint) => bp !== undefined ? `${Number(bp) / 100}%` : '—';
  const formatHours = (seconds?: bigint) => seconds !== undefined ? `${Number(seconds) / 3600}h` : '—';
  const maxAffordableLiquidity = () => {
    if (userBalance <= bond) return '0';
    const max = Number(userBalance - bond) / unit;
    return Math.floor(max).toString();
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-600">
      <h3 className="text-lg font-semibold text-white mb-4">Costs & Approval</h3>
      
      <div className="space-y-4">
        {/* Fee summary (live from FeeConfig; show placeholders if loading) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400">Trade Fee</div>
            <div className="text-white font-medium">{percent(tradeFeeRate as bigint | undefined)}</div>
            <div className="text-xs text-gray-400 mt-1">Split: LP {percent((tradeFeeLP as unknown as bigint))} • Creator {percent((tradeFeeCreator as unknown as bigint))} • Protocol {percent((tradeFeeProtocol as unknown as bigint))}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400">Settlement Fee</div>
            <div className="text-white font-medium">{percent(settlementFeeRate as bigint | undefined)}</div>
            <div className="text-xs text-gray-400 mt-1">applies on resolution payouts</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400">Bond Refund</div>
            <div className="text-white font-medium">
              {percent(createBondRefundPercent as bigint | undefined)} within {formatHours(createBondRefundWindow as bigint | undefined)}
              <span className="text-xs text-gray-400">  (or by resolve time, whichever comes first)</span>
            </div>
          </div>
        </div>

        {/* Creation Bond */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white">Creation Bond</div>
            <div className="text-sm text-gray-400">Required to create market. Refundable portion applies if canceled within refund window.</div>
          </div>
          <div className="text-white font-medium">
            {formatToken(bond)}
          </div>
        </div>
        
        {/* Initial Liquidity */}
        <div className="space-y-3">
          <div>
            <div className="text-white">Initial Liquidity</div>
            <div className="text-sm text-gray-400">Optional - provides initial trading volume</div>
          </div>
          
          <div className="space-y-2">
            <input
              type="number"
              value={initialLiquidity}
              onChange={(e) => handleLiquidityChange(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            
            {/* Quick amount buttons */}
            <div className="flex space-x-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => onInitialLiquidityChange(amount)}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                >
                  ${amount}
                </button>
              ))}
              <button
                onClick={() => onInitialLiquidityChange(maxAffordableLiquidity())}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Max
              </button>
              <button
                onClick={() => onInitialLiquidityChange('0')}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                None
              </button>
            </div>
          </div>
          
          <div className="text-right text-white font-medium">
            {formatToken(liquidityAmount)}
          </div>
        </div>
        
        {/* Total */}
        <div className="border-t border-gray-600 pt-4">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-white">Total Required</div>
            <div className="text-lg font-semibold text-white">
              {formatToken(total)}
            </div>
          </div>
        </div>
        
        {/* Balance check */}
        {isConnected && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Your USDCs balance:</span>
              <span className="text-white">{formatToken(userBalance)}</span>
            </div>
            
            {insufficientBalance && (
              <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3">
                <div className="text-red-400 text-sm">
                  ⚠️ Insufficient balance. You need {formatToken(total - userBalance)} more USDCs.
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Approval section */}
        {isConnected && !insufficientBalance && (
          <div className="space-y-3">
            {needsApproval ? (
              <div className="space-y-3">
                <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3">
                  <div className="text-yellow-400 text-sm">
                    You need to approve USDCs spending before creating the market.
                  </div>
                </div>
                
                <button
                  onClick={onApprove}
                  disabled={isApproving}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {isApproving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Approving...
                    </div>
                  ) : (
                    `Approve ${formatToken(total)} USDCs`
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
                <div className="flex items-center text-green-400 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  USDCs spending approved
                </div>
              </div>
            )}
          </div>
        )}
        
        {!isConnected && (
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
            <div className="text-blue-400 text-sm">
              Connect your wallet to see balance and approve spending.
            </div>
          </div>
        )}
        
        {/* Debug refresh button */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => refetchAllowance()}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            🔄 Refresh Allowance (Debug)
          </button>
        </div>
      </div>
    </div>
  );
}
