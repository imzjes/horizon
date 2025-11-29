'use client';

import { useState, useEffect, useMemo } from 'react';
import { CryptoAsset } from '../../lib/data/types';
import { cryptoDataService, generateTargetSuggestions } from '../../lib/data/crypto';

interface CryptoAssetPickerProps {
  onSelect: (asset: CryptoAsset) => void;
  selectedAsset?: CryptoAsset;
}

export function CryptoAssetPicker({ onSelect, selectedAsset }: CryptoAssetPickerProps) {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAssets = await cryptoDataService.fetchTop100Assets();
      setAssets(fetchedAssets);
    } catch (err) {
      setError('Failed to load crypto assets. Please try again.');
      console.error('Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return assets.slice(0, 30); // Show top 30 by default
    
    const search = searchTerm.toLowerCase();
    return assets.filter(asset => 
      asset.symbol.toLowerCase().includes(search) ||
      asset.name.toLowerCase().includes(search)
    );
  }, [assets, searchTerm]);

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading crypto assets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadAssets}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by symbol or name (e.g., BTC, Bitcoin)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Assets List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAssets.map((asset) => {
          const isSelected = selectedAsset?.id === asset.id;
          
          return (
            <div
              key={asset.id}
              onClick={() => onSelect(asset)}
              className={`
                cursor-pointer rounded-2xl p-4 border transition-all
                ${isSelected 
                  ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/25'
                  : 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-750'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Asset Logo */}
                  <img
                    src={asset.image}
                    alt={asset.name}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/crypto-fallback.png';
                    }}
                  />
                  
                  {/* Asset Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-white">{asset.name}</span>
                      <span className="text-sm font-medium text-gray-400 uppercase">
                        {asset.symbol}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Market Cap: {formatMarketCap(asset.market_cap)}
                    </div>
                  </div>
                </div>
                
                {/* Price */}
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">
                    {formatPrice(asset.current_price)}
                  </div>
                  {isSelected && (
                    <div className="flex items-center text-blue-400 text-sm mt-1">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Selected
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredAssets.length === 0 && searchTerm && (
        <div className="text-center py-4">
          <p className="text-gray-400">No assets found matching "{searchTerm}"</p>
        </div>
      )}
      
      {!searchTerm && (
        <div className="text-center text-sm text-gray-400">
          Showing top 30 assets by market cap. Search to find more from 150+ available.
        </div>
      )}
    </div>
  );
}

// Target price suggestion component for crypto predictions
interface PriceTargetSelectorProps {
  currentPrice: number;
  selectedTarget?: number;
  onTargetChange: (target: number) => void;
}

export function PriceTargetSelector({ currentPrice, selectedTarget, onTargetChange }: PriceTargetSelectorProps) {
  const [customTarget, setCustomTarget] = useState<string>('');
  const [showCustom, setShowCustom] = useState(false);

  const suggestions = generateTargetSuggestions(currentPrice);

  const handleCustomSubmit = () => {
    const target = parseFloat(customTarget);
    if (!isNaN(target) && target > currentPrice) {
      onTargetChange(target);
      setShowCustom(false);
      setCustomTarget('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400">
        Current price: <span className="text-white font-medium">${currentPrice.toLocaleString()}</span>
      </div>
      
      {/* Quick suggestions */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Quick targets:</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {suggestions.slice(0, 6).map((target) => (
            <button
              key={target}
              onClick={() => onTargetChange(target)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${selectedTarget === target
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              ${target.toLocaleString()}
            </button>
          ))}
        </div>
      </div>
      
      {/* Custom target */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Custom target:</label>
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            + Set custom target
          </button>
        ) : (
          <div className="flex space-x-2">
            <input
              type="number"
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
              placeholder="Enter target price"
              min={currentPrice}
              step="0.01"
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customTarget || parseFloat(customTarget) <= currentPrice}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              Set
            </button>
            <button
              onClick={() => {
                setShowCustom(false);
                setCustomTarget('');
              }}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      
      {selectedTarget && (
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
          <div className="text-sm">
            <span className="text-gray-400">Selected target: </span>
            <span className="text-blue-400 font-medium">${selectedTarget.toLocaleString()}</span>
            <span className="text-gray-400 ml-2">
              (+{(((selectedTarget - currentPrice) / currentPrice) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
