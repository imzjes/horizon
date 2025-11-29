'use client';

import { Navigation } from '../../components/Navigation';
import { useAccount, useReadContract } from 'wagmi';
import { EventFactoryABI, formatUSDC, formatTimeRemaining } from '@sonic-prediction-market/shared';
import { getContractAddresses, APP_CONFIG } from '../../lib/config';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CreatorPage() {
  const { address, isConnected } = useAccount();
  const contracts = getContractAddresses();
  const [creatorStats, setCreatorStats] = useState({
    totalEarnings: BigInt('0'),
    activeMarkets: 0,
    totalVolume: BigInt('0'),
    averageVolume: BigInt('0'),
    reputation: 85, // Mock reputation score
  });

  // Get creator's markets
  const { data: creatorMarkets } = useReadContract({
    address: contracts.eventFactory,
    abi: EventFactoryABI,
    functionName: 'getCreatorEvents',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Mock calculation of creator stats (in real app, this would come from indexer/subgraph)
  useEffect(() => {
    if (creatorMarkets && creatorMarkets.length > 0) {
      // Calculate mock stats
      const activeCount = creatorMarkets.length;
      const mockVolume = BigInt(activeCount * 50000 * 1e6); // 50k USDC per market average
      const mockEarnings = mockVolume / BigInt('100'); // 1% earnings assumption
      
      setCreatorStats({
        totalEarnings: mockEarnings,
        activeMarkets: activeCount,
        totalVolume: mockVolume,
        averageVolume: activeCount > 0 ? mockVolume / BigInt(activeCount) : BigInt('0'),
        reputation: Math.min(85 + activeCount * 2, 100), // Reputation increases with markets
      });
    }
  }, [creatorMarkets]);

  if (!isConnected) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black">
        {/* Animated background layers */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <Navigation />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-8rem)] flex flex-col justify-center">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔗</div>
            <h1 className="text-4xl md:text-5xl font-thin tracking-tight text-white mb-6">
              Connect Your Wallet
            </h1>
            <p className="text-xl text-gray-400 font-light mb-8 max-w-2xl mx-auto">
              Connect your wallet to view your creator dashboard and track your prediction market performance.
            </p>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-30px) rotate(120deg); }
            66% { transform: translateY(30px) rotate(240deg); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated background layers */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <Navigation />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 min-h-[calc(100vh-8rem)] flex flex-col justify-center">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl md:text-5xl font-thin tracking-tight text-white">Creator Dashboard</h1>
          <div className="flex items-center gap-3">
            {APP_CONFIG.isDev && (
              <Link
                href="/admin"
                className="border border-white/20 text-white hover:bg-white/10 font-light py-2 px-4 rounded-full transition-all backdrop-blur"
              >
                Admin
              </Link>
            )}
            <Link
              href="/create"
              className="bg-blue-600/80 hover:bg-blue-600 text-white font-light py-3 px-6 rounded-full transition-all backdrop-blur"
            >
              Create New Market
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
            <div className="text-sm text-gray-400 font-light">Total Earnings</div>
            <div className="text-2xl font-light text-green-400">
              {formatUSDC(creatorStats.totalEarnings)}
            </div>
            <div className="text-xs text-gray-500 mt-1">From creator fees</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
            <div className="text-sm text-gray-400 font-light">Active Markets</div>
            <div className="text-2xl font-light text-blue-400">
              {creatorStats.activeMarkets}
            </div>
            <div className="text-xs text-gray-500 mt-1">Currently live</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
            <div className="text-sm text-gray-400 font-light">Total Volume</div>
            <div className="text-2xl font-light text-purple-400">
              {formatUSDC(creatorStats.totalVolume)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Across all markets</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
            <div className="text-sm text-gray-400 font-light">Reputation</div>
            <div className="text-2xl font-light text-yellow-400">
              {creatorStats.reputation}/100
            </div>
            <div className="text-xs text-gray-500 mt-1">Creator score</div>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 mb-8">
          <h3 className="text-lg font-light text-white mb-4">Earnings Over Time</h3>
          <div className="h-64 bg-white/5 rounded-2xl flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📈</div>
              <div>Chart visualization coming soon</div>
              <div className="text-sm mt-2">Integration with charting library needed</div>
            </div>
          </div>
        </div>

        {/* My Markets */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <h3 className="text-lg font-light text-white mb-6">My Markets</h3>
          
          {creatorMarkets && creatorMarkets.length > 0 ? (
            <div className="space-y-4">
              {creatorMarkets.map((marketId: string, index: number) => (
                <MarketRow key={marketId} marketId={marketId} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-xl font-bold text-white mb-2">No Markets Created</h4>
              <p className="text-gray-400 mb-6">
                Create your first prediction market to start earning fees from trading activity.
              </p>
              <Link
                href="/create"
                className="bg-blue-600/80 hover:bg-blue-600 text-white font-light py-3 px-8 rounded-full transition-all backdrop-blur inline-block"
              >
                Create Your First Market
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-30px) rotate(120deg); }
          66% { transform: translateY(30px) rotate(240deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Individual market row component
function MarketRow({ marketId, index }: { marketId: string; index: number }) {
  const contracts = getContractAddresses();
  
  // Mock market data (in real app, would fetch from contract/indexer)
  const mockMarkets = [
    {
      title: "Will the Boston Celtics win the 2024 NBA Finals?",
      category: "Sports",
      status: "Active",
      volume: "127500000000", // 127.5K USDC
      earnings: "2550000000", // 2.55K USDC
      liquidity: "85000000000", // 85K USDC
      resolveAt: new Date('2024-06-30'),
    },
    {
      title: "Will Bitcoin (BTC) trade at or above $70,000 by March 15, 2024?",
      category: "Crypto", 
      status: "Active",
      volume: "234000000000", // 234K USDC
      earnings: "4680000000", // 4.68K USDC
      liquidity: "156000000000", // 156K USDC
      resolveAt: new Date('2024-03-15'),
    },
  ];

  const market = mockMarkets[index % mockMarkets.length];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 hover:bg-white/10 hover:border-white/20 transition-all">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs font-medium">
              {market.category}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              market.status === 'Active' 
                ? 'bg-green-600 text-green-100'
                : 'bg-gray-600 text-gray-100'
            }`}>
              {market.status}
            </span>
          </div>
          
          <h4 className="text-white font-medium mb-2 line-clamp-2">
            {market.title}
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Volume</div>
              <div className="text-white font-medium">
                {formatUSDC(BigInt(market.volume))}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Your Earnings</div>
              <div className="text-green-400 font-medium">
                {formatUSDC(BigInt(market.earnings))}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Liquidity</div>
              <div className="text-blue-400 font-medium">
                {formatUSDC(BigInt(market.liquidity))}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Resolves</div>
              <div className="text-white font-medium">
                {formatTimeRemaining(market.resolveAt)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="ml-4">
          <Link
            href={`/market/${marketId}`}
            className="bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-light transition-all backdrop-blur"
          >
            View Market
          </Link>
        </div>
      </div>
    </div>
  );
}
