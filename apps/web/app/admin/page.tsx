'use client';

import { Navigation } from '../../components/Navigation';
import { useAccount, useReadContract } from 'wagmi';
import { EventFactoryABI, ResolutionManagerABI, ResolutionState, formatUSDC } from '@sonic-prediction-market/shared';
import { getContractAddresses, APP_CONFIG } from '../../lib/config';
import { useState } from 'react';
import { fetchFromIPFS } from '../../lib/ipfs';

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const contracts = getContractAddresses();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [evidenceData, setEvidenceData] = useState<any>(null);

  // Check if user is arbiter and dev mode is enabled
  const isArbiter = address?.toLowerCase() === contracts.arbiter?.toLowerCase();
  const isDevMode = APP_CONFIG.isDev;

  // For now, we'll show an empty state since we don't have getAllMarketIds
  // In a real implementation, you'd need to track market IDs through events or add this function
  const allMarketIds: string[] = [];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Admin Access Required
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Connect your wallet to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isArbiter || !isDevMode) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Access Denied
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              You need to be the designated arbiter and have dev mode enabled to access this panel.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
              <div className="text-sm text-gray-300">
                <div>Arbiter Address: <span className="text-blue-400 font-mono">{contracts.arbiter}</span></div>
                <div>Your Address: <span className="text-yellow-400 font-mono">{address}</span></div>
                <div>Dev Mode: <span className={isDevMode ? 'text-green-400' : 'text-red-400'}>{isDevMode ? 'Enabled' : 'Disabled'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Arbiter Console</h1>
          <div className="bg-red-600 text-red-100 px-3 py-1 rounded-full text-sm font-medium">
            DEV MODE
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="text-sm text-gray-400">Total Markets</div>
            <div className="text-2xl font-bold text-blue-400">
              {allMarketIds?.length || 0}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="text-sm text-gray-400">Pending Reports</div>
            <div className="text-2xl font-bold text-yellow-400">
              2
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="text-sm text-gray-400">Disputed Markets</div>
            <div className="text-2xl font-bold text-red-400">
              1
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="text-sm text-gray-400">Resolved Today</div>
            <div className="text-2xl font-bold text-green-400">
              0
            </div>
          </div>
        </div>

        {/* Markets Requiring Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Markets List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Markets Requiring Attention</h3>
              
              <div className="space-y-4">
                {/* Mock disputed/reported markets */}
                <MarketAdminRow
                  marketId="0x1234567890123456789012345678901234567890123456789012345678901234"
                  title="Will the Boston Celtics win the 2024 NBA Finals?"
                  status="DISPUTED"
                  reportedOutcome="YES"
                  onSelect={() => setSelectedMarket("0x1234567890123456789012345678901234567890123456789012345678901234")}
                  isSelected={selectedMarket === "0x1234567890123456789012345678901234567890123456789012345678901234"}
                />
                
                <MarketAdminRow
                  marketId="0x2345678901234567890123456789012345678901234567890123456789012345"
                  title="Will Bitcoin (BTC) trade at or above $70,000 by March 15, 2024?"
                  status="REPORTED"
                  reportedOutcome="NO"
                  onSelect={() => setSelectedMarket("0x2345678901234567890123456789012345678901234567890123456789012345")}
                  isSelected={selectedMarket === "0x2345678901234567890123456789012345678901234567890123456789012345"}
                />
              </div>
              
              {(!allMarketIds || allMarketIds.length === 0) && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">✅</div>
                  <h4 className="text-xl font-bold text-white mb-2">All Clear</h4>
                  <p className="text-gray-400">
                    No markets currently require arbiter attention.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Panel */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Resolution Actions</h3>
            
            {selectedMarket ? (
              <ResolutionPanel 
                marketId={selectedMarket}
                onEvidenceLoad={setEvidenceData}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-gray-400">
                  Select a market to view resolution options
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Viewer */}
        {evidenceData && (
          <div className="mt-8 bg-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Evidence Details</h3>
            <div className="bg-gray-700 rounded-lg p-4">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(evidenceData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Market row component for admin view
function MarketAdminRow({ 
  marketId, 
  title, 
  status, 
  reportedOutcome, 
  onSelect, 
  isSelected 
}: {
  marketId: string;
  title: string;
  status: string;
  reportedOutcome: string;
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <div 
      className={`p-4 rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 hover:bg-gray-650'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium line-clamp-2">{title}</h4>
        <div className="ml-4 flex space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            status === 'DISPUTED' 
              ? 'bg-red-600 text-red-100'
              : 'bg-yellow-600 text-yellow-100'
          }`}>
            {status}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <div>
          Reported: <span className={`font-medium ${
            reportedOutcome === 'YES' ? 'text-green-400' : 'text-red-400'
          }`}>{reportedOutcome}</span>
        </div>
        <div className="text-gray-400 font-mono">
          {marketId.slice(0, 8)}...{marketId.slice(-6)}
        </div>
      </div>
    </div>
  );
}

// Resolution panel for selected market
function ResolutionPanel({ 
  marketId, 
  onEvidenceLoad 
}: { 
  marketId: string; 
  onEvidenceLoad: (data: any) => void; 
}) {
  const [isLoading, setIsLoading] = useState(false);

  const loadEvidence = async (evidenceUri: string) => {
    setIsLoading(true);
    try {
      const evidence = await fetchFromIPFS(evidenceUri);
      onEvidenceLoad(evidence);
    } catch (error) {
      console.error('Failed to load evidence:', error);
      alert('Failed to load evidence');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Evidence Section */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="font-bold text-white mb-2">Evidence</h4>
        <button
          onClick={() => loadEvidence('ipfs://QmMockEvidenceHash123')}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm transition-colors"
        >
          {isLoading ? 'Loading...' : 'Load Evidence'}
        </button>
      </div>

      {/* Resolution Actions */}
      <div className="space-y-3">
        <button
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          onClick={() => alert('Resolve YES - Implementation needed')}
        >
          Resolve YES
        </button>
        
        <button
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          onClick={() => alert('Resolve NO - Implementation needed')}
        >
          Resolve NO
        </button>
        
        <button
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          onClick={() => alert('Invalidate Market - Implementation needed')}
        >
          Invalidate Market
        </button>
      </div>

      <div className="text-xs text-gray-400 mt-4">
        Market ID: <span className="font-mono">{marketId}</span>
      </div>
    </div>
  );
}
