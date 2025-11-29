'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMarket } from '../../../lib/hooks/useMarket';
import { useUSDCs } from '../../../lib/hooks/useUSDC';
import { useResolution } from '../../../lib/hooks/useResolution';
import { Navigation } from '../../../components/Navigation';
import { MarketHeaderSkeleton, TradingFormSkeleton, ChartSkeleton } from '../../../components/ui/Skeleton';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
// Toast system completely removed
import { 
  formatUSDC, 
  formatProbability, 
  formatTimeRemaining, 
  ResolutionState
} from '@sonic-prediction-market/shared';
import { getDemoMarket, DemoMarket } from '../../../lib/data/demo-markets';
import { PriceChart } from '../../../components/ui/PriceChart';
import { parseUnits } from 'viem';

export default function MarketPage() {
  const params = useParams();
  const marketId = params.id as string;
  
  // Try to get demo market data first (for offline/demo usage)
  const demoMarket = getDemoMarket(marketId);
  
  // Type guard for eventInfo
  const isValidEventInfo = (info: any): info is { 
    creator: string; 
    ammAddress: string; 
    createdAt: bigint; 
    resolveAt: bigint; 
    category: string; 
    title: string; 
    description: string; 
    primarySource: string; 
  } => {
    return info && typeof info === 'object' && 'category' in info && 'title' in info;
  };
  
  const [tradeAmount, setTradeAmount] = useState('10');
  const [liquidityAmount, setLiquidityAmount] = useState('100');
  const [activeTab, setActiveTab] = useState<'trade' | 'liquidity' | 'resolution'>('trade');
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionLoading, setTransactionLoading] = useState<string | null>(null);
  
  // Toast system completely removed

  const { marketData, eventInfo, isLoading, executeBuyYes, executeBuyNo, executeProvideLiquidity, isPending } = useMarket(marketId);
  const { balance, hasAllowance, approveAMM, isApproving } = useUSDCs();
  const { resolutionState, stateLabel, canReport, canDispute, isResolved, report, dispute } = useResolution(marketId);

  // Loading state
  if (isLoading && !demoMarket) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-white">Loading market...</div>
        </div>
      </div>
    );
  }

  // Use demo data if real data isn't available
  const displayMarket = eventInfo || demoMarket;
  
  // If neither real nor demo data exists, return 404
  if (!displayMarket) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-red-400">Market not found</div>
        </div>
      </div>
    );
  }

  // Demo mode indicator
  const isDemoMode = !isValidEventInfo(eventInfo) && !!demoMarket;
  const validEventInfo = isValidEventInfo(eventInfo) ? eventInfo : null;

  // Prepare display data (works for both real and demo markets)
  const resolveDate = isDemoMode 
    ? new Date(demoMarket.resolveAt) 
    : new Date(Number(validEventInfo?.resolveAt || 0) * 1000);
  const timeLeft = formatTimeRemaining(resolveDate);
  const requiredAllowance = parseUnits(tradeAmount || '0', 6);
  const needsApproval = !isDemoMode && validEventInfo && !hasAllowance(validEventInfo.ammAddress as `0x${string}`, requiredAllowance);

  // Create unified market data object for display
  // In demo mode we don't track per-user positions, so we use
  // sensible defaults and derive values from the demo market.
  const displayMarketData = isDemoMode ? {
    yesProbability: demoMarket.yesProbability ?? demoMarket.currentProbabilities[0],
    liquidityUsd: demoMarket.liquidityUsd ?? demoMarket.totalLiquidity,
    volumeUsd: demoMarket.volumeUsd ?? demoMarket.totalVolume,
    userLpBalance: BigInt(0),
    userLpShare: 0,
    userYesBalance: BigInt(0),
    userNoBalance: BigInt(0),
  } : marketData;

  const handleBuyYes = async () => {
    if (isDemoMode) {
      alert('Demo Mode: Connect a wallet to perform real transactions');
      return;
    }
    
    try {
      setTransactionError(null);
      setTransactionLoading('Preparing transaction...');
      
      if (needsApproval && validEventInfo) {
        setTransactionLoading('Approving USDCs spending...');
        await approveAMM(validEventInfo.ammAddress as `0x${string}`, tradeAmount);
        setTransactionLoading('Buying YES tokens...');
      } else {
        setTransactionLoading('Buying YES tokens...');
      }
      
      await executeBuyYes(tradeAmount);
      setTransactionLoading(null);
      // Transaction successful - could add success state here if needed
    } catch (error) {
      setTransactionLoading(null);
      setTransactionError(error instanceof Error ? error.message : 'Transaction failed');
    }
  };

  const handleBuyNo = async () => {
    if (isDemoMode) {
      alert('Demo Mode: Connect a wallet to perform real transactions');
      return;
    }
    
    try {
      setTransactionError(null);
      setTransactionLoading('Preparing transaction...');
      
      if (needsApproval && validEventInfo) {
        setTransactionLoading('Approving USDCs spending...');
        await approveAMM(validEventInfo.ammAddress as `0x${string}`, tradeAmount);
        setTransactionLoading('Buying NO tokens...');
      } else {
        setTransactionLoading('Buying NO tokens...');
      }
      
      await executeBuyNo(tradeAmount);
      setTransactionLoading(null);
      // Transaction successful - could add success state here if needed
    } catch (error) {
      setTransactionLoading(null);
      setTransactionError(error instanceof Error ? error.message : 'Transaction failed');
    }
  };

  const handleProvideLiquidity = async () => {
    if (isDemoMode) {
      alert('Demo Mode: Connect a wallet to perform real transactions');
      return;
    }
    
    try {
      setTransactionError(null);
      setTransactionLoading('Providing liquidity...');
      await executeProvideLiquidity(liquidityAmount);
      setTransactionLoading(null);
      // Transaction successful - could add success state here if needed
    } catch (error) {
      setTransactionLoading(null);
      setTransactionError(error instanceof Error ? error.message : 'Transaction failed');
    }
  };

  // Show loading skeleton while data is loading
  if (isLoading && !isDemoMode) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-8rem)] flex flex-col justify-center">
          <MarketHeaderSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ChartSkeleton />
            </div>
            <div>
              <TradingFormSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-yellow-600 border-b border-yellow-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-center">
                <span className="text-yellow-100 font-medium text-sm">
                  🎭 Demo Mode: This is sample data for testing. Connect a wallet to trade on real markets.
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          
          {/* Transaction Status Messages */}
          {transactionLoading && (
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-6">
              <div className="text-blue-400 font-medium">Transaction in Progress</div>
              <div className="text-blue-300 text-sm">{transactionLoading}</div>
            </div>
          )}
          
          {transactionError && (
            <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-red-400 font-medium">Transaction Error</div>
                  <div className="text-red-300 text-sm">{transactionError}</div>
                </div>
                <button
                  onClick={() => setTransactionError(null)}
                  className="text-red-400 hover:text-red-300 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Market Header */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="inline-block bg-blue-600 text-blue-100 px-3 py-1 rounded-full text-sm font-medium mb-2">
                  {isDemoMode ? demoMarket.category : validEventInfo?.category || 'Unknown'}
                </span>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {isDemoMode ? demoMarket.title : validEventInfo?.title || 'Market'}
                </h1>
                <p className="text-gray-300 mb-4">
                  {isDemoMode ? demoMarket.description : validEventInfo?.description || 'Loading...'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Resolves in</div>
                <div className="text-lg font-bold text-white">{timeLeft}</div>
              </div>
            </div>

            {/* Market Stats - Responsive grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-400">
                  {isDemoMode && demoMarket.marketType === 'ternary' ? 'Home' : 'YES'} Probability
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {isDemoMode 
                    ? `${(demoMarket.currentProbabilities[0] * 100).toFixed(1)}%`
                    : formatProbability(displayMarketData.yesProbability)
                  }
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-400">Liquidity</div>
                <div className="text-2xl font-bold text-blue-400">
                  {isDemoMode 
                    ? `$${(demoMarket.totalLiquidity / 1000).toFixed(1)}k`
                    : formatUSDC(typeof displayMarketData.liquidityUsd === 'bigint' ? displayMarketData.liquidityUsd : BigInt(0))
                  }
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-400">Volume</div>
                <div className="text-2xl font-bold text-purple-400">
                  {isDemoMode 
                    ? `$${(demoMarket.totalVolume / 1000).toFixed(1)}k`
                    : formatUSDC(typeof displayMarketData.volumeUsd === 'bigint' ? displayMarketData.volumeUsd : BigInt(0))
                  }
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-sm text-gray-400">Participants</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {isDemoMode 
                    ? `+${demoMarket.participants}`
                    : `${displayMarketData.userLpShare?.toFixed(2) || '0.00'}%`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Chart and Trading */}
            <div className="lg:col-span-2 space-y-6">
              {/* Price Chart Placeholder */}
              {isDemoMode && demoMarket ? (
                <PriceChart 
                  priceHistory={demoMarket.priceHistory}
                  outcomes={demoMarket.outcomes}
                />
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur">
                  <h2 className="text-xl font-bold text-white mb-4">Probability Chart</h2>
                  <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-gray-400 text-center">
                      <div className="text-4xl mb-2">📈</div>
                      <div>Chart visualization coming soon</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Navigation - Mobile friendly */}
              <div className="flex space-x-1 bg-white/5 border border-white/10 rounded-xl p-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('trade')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'trade'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Trade
                </button>
                <button
                  onClick={() => setActiveTab('liquidity')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'liquidity'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Liquidity
                </button>
                <button
                  onClick={() => setActiveTab('resolution')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'resolution'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Resolution
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'trade' ? (
                /* Trade Tab */
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur">
                  <h2 className="text-xl font-bold text-white mb-6">Trade Shares</h2>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount (USDCs)
                    </label>
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="Enter amount"
                    />
                  </div>

                  <div className={`grid gap-4 mb-6 ${isDemoMode && demoMarket?.marketType === 'ternary' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {isDemoMode && demoMarket ? (
                      // Demo market buttons
                      demoMarket.outcomes.map((outcome, index) => {
                        const colors = ['bg-teal-600 hover:bg-teal-700', 'bg-gray-600 hover:bg-gray-700', 'bg-pink-600 hover:bg-pink-700'];
                        const prob = demoMarket.currentProbabilities[index] * 100;
                        return (
                          <button
                            key={outcome}
                            onClick={() => alert(`Demo Mode: Connect a wallet to trade ${outcome} shares`)}
                            className={`${colors[index]} disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors`}
                          >
                            Buy {outcome}
                            <div className="text-sm opacity-75 mt-1">
                              {prob.toFixed(1)}%
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      // Real market buttons
                      <>
                        <button
                          onClick={handleBuyYes}
                          disabled={isPending || isApproving || !tradeAmount}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors"
                        >
                          {needsApproval ? 'Approve & ' : ''}Buy YES
                          <div className="text-sm opacity-75 mt-1">
                            {formatProbability(displayMarketData.yesProbability)}
                          </div>
                        </button>
                        <button
                          onClick={handleBuyNo}
                          disabled={isPending || isApproving || !tradeAmount}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors"
                        >
                          {needsApproval ? 'Approve & ' : ''}Buy NO
                          <div className="text-sm opacity-75 mt-1">
                            {formatProbability(10000 - displayMarketData.yesProbability)}
                          </div>
                        </button>
                      </>
                    )}
                  </div>

                  {(isPending || isApproving) && (
                    <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3 mb-4">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3"></div>
                        <span className="text-blue-300 text-sm">
                          {isApproving ? 'Approving USDCs...' : 'Processing trade...'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-400">
                    Balance: {formatUSDC(balance)} USDCs
                  </div>
                </div>
              ) : activeTab === 'liquidity' ? (
                /* Liquidity Tab */
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur">
                  <h2 className="text-xl font-bold text-white mb-6">Provide Liquidity</h2>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount (USDCs)
                    </label>
                    <input
                      type="number"
                      value={liquidityAmount}
                      onChange={(e) => setLiquidityAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="Enter amount"
                    />
                  </div>

                  <button
                    onClick={handleProvideLiquidity}
                    disabled={isPending || !liquidityAmount}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors mb-6"
                  >
                    {isPending ? 'Processing...' : 'Provide Liquidity'}
                  </button>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-gray-300">Your LP Position</div>
                    <div className="text-lg font-bold text-white">
                      {formatUSDC(typeof displayMarketData.userLpBalance === 'bigint' ? displayMarketData.userLpBalance : BigInt(0))} ({displayMarketData.userLpShare?.toFixed(2) || '0.00'}%)
                    </div>
                  </div>
                </div>
              ) : (
                /* Resolution Tab */
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur">
                  <h2 className="text-xl font-bold text-white mb-6">Market Resolution</h2>
                  
                  {isDemoMode ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🎭</div>
                      <h3 className="text-lg font-bold text-white mb-2">Demo Mode</h3>
                      <p className="text-gray-300">
                        Resolution features are only available for real markets. 
                        Connect a wallet to participate in market resolution.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4">
                        <span className="text-sm text-gray-400">Status: </span>
                        <span className="text-white font-medium">{stateLabel}</span>
                      </div>
                      
                      {canReport && (
                        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-4">
                          <h4 className="text-blue-400 font-medium mb-2">Report Resolution</h4>
                          <p className="text-blue-300 text-sm mb-4">
                            As an arbiter, you can report the outcome of this market.
                          </p>
                          <button
                            onClick={() => alert('Resolution Reporting: This feature is coming soon!')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            Report Outcome
                          </button>
                        </div>
                      )}
                      
                      {canDispute && (
                        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-4">
                          <h4 className="text-yellow-400 font-medium mb-2">Dispute Resolution</h4>
                          <p className="text-yellow-300 text-sm mb-4">
                            You can dispute the current resolution if you believe it's incorrect.
                          </p>
                          <button
                            onClick={() => alert('Dispute Functionality: This feature is coming soon!')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            File Dispute
                          </button>
                        </div>
                      )}
                      
                      {!canReport && !canDispute && !isResolved && (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">⏳</div>
                          <h3 className="text-lg font-bold text-white mb-2">Waiting for Resolution</h3>
                          <p className="text-gray-300">
                            This market is waiting to be resolved by the designated arbiter.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Market Info Sidebar */}
            <div className="space-y-6">
              {/* Market Details */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Market Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creator:</span>
                    <span className="text-white font-mono">
                    {isDemoMode 
                      ? `${demoMarket.creator.slice(0, 6)}...${demoMarket.creator.slice(-4)}`
                      : validEventInfo?.creator ? `${validEventInfo.creator.slice(0, 6)}...${validEventInfo.creator.slice(-4)}` : 'Unknown'
                    }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">
                    {isDemoMode 
                      ? new Date(demoMarket.createdAt).toLocaleDateString()
                      : validEventInfo?.createdAt ? new Date(Number(validEventInfo.createdAt) * 1000).toLocaleDateString() : 'Unknown'
                    }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resolves:</span>
                    <span className="text-white">
                      {resolveDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Source:</span>
                    <a 
                      href={isDemoMode ? demoMarket.primarySource : validEventInfo?.primarySource || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 truncate"
                    >
                      View Source
                    </a>
                  </div>
                </div>
              </div>

              {/* Trading Tips */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Trading Tips</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Buy YES if you think the event will happen</li>
                  <li>• Buy NO if you think it won't happen</li>
                  <li>• Prices reflect market probability</li>
                  <li>• All trades have a 0.3% fee</li>
                  <li>• Add liquidity to earn trading fees</li>
                </ul>
              </div>
              
              {/* Resolved state for demo */}
              {isDemoMode && demoMarket.status === 'resolved' && (
                <div className="bg-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Market Resolved</h3>
                  <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                    <div className="text-green-400 font-medium mb-2">
                      Outcome: {(demoMarket.resolvedOutcome || demoMarket.outcomes?.[0] || 'YES').toUpperCase()}
                    </div>
                    <p className="text-green-300 text-sm">
                      This market has been resolved. In a real market, you would be able to redeem your positions here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}