'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/Navigation';
import Link from 'next/link';
import { MarketCardSkeleton } from '../../components/ui/Skeleton';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { formatTimeAgo, formatUSDC, formatTimeRemaining } from '@sonic-prediction-market/shared';
import { DEMO_MARKETS, DemoMarket } from '../../lib/data/demo-markets';

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created'>('created');
  const [isLoading, setIsLoading] = useState(false);

  // Use demo markets for showcase
  const [demoMarkets, setDemoMarkets] = useState<DemoMarket[]>([]);

  // Load demo markets
  useEffect(() => {
    setDemoMarkets(DEMO_MARKETS);
    setIsLoading(false);
  }, []);

  // Filter markets based on category and search
  const filteredMarkets = demoMarkets.filter(market => {
    const matchesCategory = selectedCategory === 'All' || market.category === selectedCategory.toLowerCase();
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         market.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort markets
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen overflow-hidden bg-black">
        {/* Animated background layers */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <Navigation />
      
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 min-h-[calc(100vh-8rem)] flex flex-col justify-center">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-thin tracking-tight text-white mb-4">Prediction Markets</h1>
            <p className="text-xl text-gray-400 font-light">Trade on real-world events with transparent, decentralized markets</p>
          </div>
          <Link
            href="/create"
            className="bg-blue-600/80 hover:bg-blue-600 text-white font-light py-3 px-6 rounded-full transition-all backdrop-blur w-fit"
          >
            Create Market
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-8 backdrop-blur">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Simple category placeholder (All only) */}
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 rounded-full text-sm font-light bg-blue-600/80 text-white backdrop-blur">
                All
              </button>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur"
              >
                <option value="volume">Sort by Volume</option>
                <option value="liquidity">Sort by Liquidity</option>
                <option value="created">Recently Created</option>
                <option value="probability">Most Uncertain</option>
              </select>
            </div>
          </div>
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            [...Array(6)].map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))
          ) : (
            // Demo market cards
            sortedMarkets.map((market) => (
              <DemoMarketCard key={market.id} market={market} />
            ))
          )}
        </div>

        {/* Empty State */}
        {(!sortedMarkets || sortedMarkets.length === 0) && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No markets found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search or filters to find markets.
            </p>
            <Link
              href="/create"
              className="bg-blue-600/80 hover:bg-blue-600 text-white font-light py-3 px-6 rounded-full transition-all backdrop-blur inline-block"
            >
              Create the First Market
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
    </ErrorBoundary>
  );
}
// Demo market card component
function DemoMarketCard({ market }: { market: DemoMarket }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sports':
        return '🏀';
      case 'crypto':
        return '₿';
      case 'entertainment':
        return '🎭';
      default:
        return '📊';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sports':
        return 'bg-orange-600/60';
      case 'crypto':
        return 'bg-yellow-600/60';
      case 'entertainment':
        return 'bg-purple-600/60';
      default:
        return 'bg-blue-600/60';
    }
  };

  const formatLiquidity = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount}`;
  };

  const formatVolume = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount}`;
  };

  const formatParticipants = (count: number) => {
    if (count >= 1000) {
      return `+${(count / 1000).toFixed(1)}k`;
    }
    return `+${count}`;
  };

  return (
    <Link href={`/market/${market.id}`} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all block">
      {/* Header with category icon and badges */}
      <div className="relative h-32 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-6xl opacity-60">{getCategoryIcon(market.category)}</div>
        <div className="absolute left-4 bottom-3 flex items-center gap-2">
          <span className="bg-black/60 text-white px-2 py-1 rounded text-xs font-medium border border-white/10">USDCs</span>
          <span className={`${getCategoryColor(market.category)} text-white px-2 py-1 rounded text-xs font-medium border border-white/10`}>
            {market.category.charAt(0).toUpperCase() + market.category.slice(1)}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Market title */}
        <h3 className="text-white font-light text-lg mb-4 line-clamp-2 leading-tight">{market.title}</h3>

        {/* Probability bar */}
        <div className="mb-4">
          <div className="w-full h-3 rounded-full overflow-hidden bg-gray-700">
            {market.currentProbabilities.map((prob, index) => {
              const colors = ['bg-teal-500', 'bg-gray-400', 'bg-pink-500'];
              return (
                <div
                  key={index}
                  className={`h-3 ${colors[index]} inline-block`}
                  style={{ width: `${prob * 100}%` }}
                />
              );
            })}
          </div>
          
          {/* Outcome buttons */}
          <div className={`mt-4 grid gap-3 ${market.marketType === 'ternary' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {market.outcomes.map((outcome, index) => {
              const colors = [
                'bg-teal-900/20 border-teal-700/30 text-teal-300',
                'bg-gray-900/20 border-gray-700/30 text-gray-300',
                'bg-pink-900/20 border-pink-700/30 text-pink-300'
              ];
              return (
                <div
                  key={outcome}
                  className={`rounded-xl ${colors[index]} border py-3 text-center font-light text-sm`}
                >
                  {outcome}
                </div>
              );
            })}
          </div>
        </div>

        {/* Market stats */}
        <div className="flex items-center justify-between text-gray-400 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>{formatParticipants(market.participants)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>{formatVolume(market.totalVolume)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>{formatLiquidity(market.totalLiquidity)}</span>
          </div>
        </div>

        {/* Resolution time */}
        <div className="mt-3 text-xs text-gray-500">
          Resolves {formatTimeRemaining(new Date(market.resolveAt))}
        </div>
      </div>
    </Link>
  );
}
