'use client';

import { Navigation } from '../../components/Navigation';
import { useCreateMarket } from '../../lib/hooks/useCreateMarket';
// import { SportsGamePicker } from '../../components/create/SportsGamePicker';
import { SimpleSportsGamePicker } from '../../components/create/SimpleSportsGamePicker';
import { CryptoAssetPicker, PriceTargetSelector } from '../../components/create/CryptoAssetPicker';
import { QuestionPreview } from '../../components/create/QuestionPreview';
import { CostsPanel } from '../../components/create/CostsPanel';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWaitForTransactionReceipt } from 'wagmi';
import { parseEventLogs } from 'viem';
import { EventFactoryABI } from '@sonic-prediction-market/shared';

export default function CreatePage() {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  
  const {
    state,
    marketHash,
    duplicateCheck,
    totalRequired,
    hasRequiredAllowance,
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
    isValid,
    validationErrors,
    canCreate,
  } = useCreateMarket();

  // Wait for transaction receipt to extract market details
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: state.txHash,
  });

  // Extract market creation details from receipt
  if (receipt && !state.createdMarketId) {
    try {
      const logs = parseEventLogs({
        abi: EventFactoryABI,
        logs: receipt.logs,
      });
      
      const marketCreatedEvent = logs.find((log: any) => log.eventName === 'MarketCreated');
      if (marketCreatedEvent) {
        const { marketId, amm } = (marketCreatedEvent as any).args;
        handleMarketCreated(marketId, amm);
        // Navigate to the new market
        router.push(`/market/${amm}`);
      }
    } catch (error) {
      console.error('Failed to parse market creation event:', error);
    }
  }

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await approveUSDCs();
      // The approval should trigger a re-render with updated allowance
      // The useCreateMarket hook will automatically refetch the allowance
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Approval failed. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createMarket();
    } catch (error) {
      console.error('Market creation failed:', error);
      alert(`Market creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCryptoDateChange = (date: string) => {
    if (!state.selectedAsset || !state.targetPrice) return;
    
    const targetDate = new Date(date + 'T23:59:59.999Z'); // Set to 23:59 UTC (end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Prevent past dates only (today is valid since we resolve at 23:59 UTC)
    if (targetDate < today) {
      alert('Target date cannot be in the past');
      return;
    }
    
    setCryptoTarget(state.targetPrice, targetDate);
  };

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'template':
        return <TemplateSelection />;
      case 'details':
        return <DetailsStep />;
      case 'review':
        return <ReviewStep />;
      case 'launch':
        return <LaunchStep />;
      default:
        return null;
    }
  };

  const TemplateSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-thin tracking-tight text-white mb-6">Create Prediction Market</h1>
        <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
          Choose how you&apos;d like to create your market. Templates help you get started quickly with pre-filled questions and rules.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Sports Template */}
        <div
          onClick={() => {
            setTemplateType('sports');
            setCurrentStep('details');
          }}
          className="cursor-pointer rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-xl border border-white/10 p-2 bg-gradient-to-br from-orange-500/25 to-red-500/25 w-10 h-10 flex items-center justify-center">
              <div className="text-2xl">🏀</div>
            </div>
            <div className="text-sm text-gray-400">Template</div>
          </div>
          <h3 className="text-2xl font-light text-white mb-3">Sports</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Pick upcoming games from NBA, NFL, MLS, or NHL. Questions and rules are automatically generated.
          </p>
          <div className="text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
            Choose from live games →
          </div>
        </div>

        {/* Crypto Template */}
        <div
          onClick={() => {
            setTemplateType('crypto');
            setCurrentStep('details');
          }}
          className="cursor-pointer rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-xl border border-white/10 p-2 bg-gradient-to-br from-yellow-500/25 to-orange-500/25 w-10 h-10 flex items-center justify-center">
              <div className="text-2xl">₿</div>
            </div>
            <div className="text-sm text-gray-400">Template</div>
          </div>
          <h3 className="text-2xl font-light text-white mb-3">Crypto</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Predict price targets for top cryptocurrencies. Pick from 150+ assets with current prices.
          </p>
          <div className="text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
            Browse assets →
          </div>
        </div>

        {/* Manual Template */}
        <div
          onClick={() => {
            setTemplateType('manual');
            setCurrentStep('details');
          }}
          className="cursor-pointer rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-xl border border-white/10 p-2 bg-gradient-to-br from-blue-500/25 to-purple-500/25 w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div className="text-sm text-gray-400">Template</div>
          </div>
          <h3 className="text-2xl font-light text-white mb-3">Custom</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Create any prediction market with custom questions, rules, and resolution criteria.
          </p>
          <div className="text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
            Start from scratch →
          </div>
        </div>
      </div>
    </div>
  );

  const DetailsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {state.templateType === 'sports' && 'Sports Market'}
            {state.templateType === 'crypto' && 'Crypto Market'}
            {state.templateType === 'manual' && 'Custom Market'}
          </h1>
          <p className="text-gray-400">
            {state.templateType === 'sports' && 'Select a game to generate your prediction market'}
            {state.templateType === 'crypto' && 'Choose an asset and set your price target'}
            {state.templateType === 'manual' && 'Fill in all market details manually'}
          </p>
        </div>
        <button
          onClick={() => setCurrentStep('template')}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          ← Change template
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {state.templateType === 'sports' && (
            <div className="space-y-4">
              {!state.selectedLeague ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Choose League</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedLeague('NBA')}
                      className="bg-orange-600/20 border border-orange-600/30 hover:bg-orange-600/30 text-orange-400 font-light py-3 px-4 rounded-2xl transition-all backdrop-blur flex items-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 12h8"/>
                        <path d="M12 8v8"/>
                      </svg>
                      NBA
                    </button>
                    <button
                      onClick={() => setSelectedLeague('NFL')}
                      className="bg-green-600/20 border border-green-600/30 hover:bg-green-600/30 text-green-400 font-light py-3 px-4 rounded-2xl transition-all backdrop-blur flex items-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <ellipse cx="12" cy="12" rx="10" ry="6"/>
                        <path d="M2 12h20"/>
                      </svg>
                      NFL
                    </button>
                    <button
                      onClick={() => setSelectedLeague('MLS')}
                      className="bg-blue-600/20 border border-blue-600/30 hover:bg-blue-600/30 text-blue-400 font-light py-3 px-4 rounded-2xl transition-all backdrop-blur flex items-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 12h8"/>
                        <path d="M12 8v8"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      MLS
                    </button>
                    <button
                      onClick={() => setSelectedLeague('NHL')}
                      className="bg-red-600/20 border border-red-600/30 hover:bg-red-600/30 text-red-400 font-light py-3 px-4 rounded-2xl transition-all backdrop-blur flex items-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                      NHL
                    </button>
                  </div>
                </div>
              ) : (
                <SimpleSportsGamePicker
                  league={state.selectedLeague}
                  selectedGame={state.selectedGame}
                  onGameSelect={setSelectedGame}
                  onLeagueChange={setSelectedLeague}
                />
              )}
            </div>
          )}

          {state.templateType === 'crypto' && (
            <div className="space-y-6">
              {!state.selectedAsset ? (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Choose Cryptocurrency</h3>
                  <CryptoAssetPicker
                    onSelect={setSelectedAsset}
                    selectedAsset={state.selectedAsset}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Set Price Target</h3>
                    <button
                      onClick={() => setSelectedAsset(undefined as any)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Change asset
                    </button>
                  </div>
                  
                  <PriceTargetSelector
                    currentPrice={state.selectedAsset.current_price}
                    selectedTarget={state.targetPrice}
                    onTargetChange={(target) => {
                      if (state.targetDate) {
                        setCryptoTarget(target, state.targetDate);
                      } else {
                        const defaultDate = new Date(); // Today is valid for crypto markets
                        setCryptoTarget(target, defaultDate);
                      }
                    }}
                  />
                  
                  {state.targetPrice && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Target Date (UTC)
                      </label>
                      <input
                        type="date"
                        value={state.targetDate ? state.targetDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value + 'T00:00:00.000Z');
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          if (selectedDate < today) {
                            e.target.value = ''; // Clear the invalid selection
                            alert('Please select today or a future date. Past dates are not allowed.');
                            return;
                          }
                          
                          handleCryptoDateChange(e.target.value);
                        }}
                        min={(() => {
                          const today = new Date();
                          return today.toISOString().split('T')[0];
                        })()}
                        className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {state.templateType === 'manual' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Market Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select
                  value={state.params.category || ''}
                  onChange={(e) => updateParams({ category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur"
                >
                  <option value="">Select category...</option>
                  <option value="Sports">Sports</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Politics">Politics</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Technology">Technology</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Question</label>
                <input
                  type="text"
                  value={state.params.title || ''}
                  onChange={(e) => updateParams({ title: e.target.value })}
                  placeholder="Will X happen by Y?"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Rules & Resolution Criteria</label>
                <textarea
                  value={state.params.rules || ''}
                  onChange={(e) => updateParams({ rules: e.target.value })}
                  placeholder="Describe exactly how this market will be resolved..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Resolution Date & Time</label>
                <input
                  type="datetime-local"
                  value={state.params.resolveAt ? new Date(state.params.resolveAt * 1000).toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateParams({ resolveAt: Math.floor(new Date(e.target.value).getTime() / 1000) })}
                  min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} // 1 hour from now
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Primary Source</label>
                <input
                  type="url"
                  value={state.params.primarySource || ''}
                  onChange={(e) => updateParams({ primarySource: e.target.value })}
                  placeholder="https://example.com/source"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all backdrop-blur"
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <QuestionPreview params={state.params} marketHash={marketHash || undefined} />
          
          {isValid && (
            <CostsPanel
              initialLiquidity={state.initialLiquidity}
              onInitialLiquidityChange={setInitialLiquidity}
              onApprove={handleApprove}
              onApproveComplete={() => {}} // Handled automatically by allowance updates
              isApproving={isApproving}
              hasRequiredAllowance={hasRequiredAllowance}
              totalRequired={totalRequired}
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('template')}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-light py-3 px-6 rounded-full transition-all backdrop-blur"
        >
          ← Back
        </button>
        
        <button
          onClick={() => setCurrentStep('review')}
          disabled={!isValid}
          className="bg-blue-600/80 hover:bg-blue-600 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-light py-3 px-6 rounded-full transition-all backdrop-blur"
        >
          Review →
        </button>
      </div>
    </div>
  );

  const ReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Review & Launch</h1>
        <p className="text-gray-400">
          Review your market details and launch when ready.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <QuestionPreview params={state.params} marketHash={marketHash || undefined} />
        </div>
        
        <div className="space-y-6">
          <CostsPanel
            initialLiquidity={state.initialLiquidity}
            onInitialLiquidityChange={setInitialLiquidity}
            onApprove={handleApprove}
            onApproveComplete={() => {}}
            isApproving={isApproving}
            hasRequiredAllowance={hasRequiredAllowance}
            totalRequired={totalRequired}
          />
          
          {/* Duplicate Check */}
          {duplicateCheck.isDuplicate && (
            <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
              <div className="text-red-400 font-medium mb-2">⚠️ Duplicate Market</div>
              <div className="text-red-300 text-sm mb-3">
                A market with these parameters already exists.
              </div>
              {duplicateCheck.existingMarketId && (
                <button className="text-blue-400 hover:text-blue-300 text-sm">
                  View existing market →
                </button>
              )}
            </div>
          )}
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
              <div className="text-yellow-400 font-medium mb-2">Issues to fix:</div>
              <ul className="text-yellow-300 text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('details')}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-light py-3 px-6 rounded-full transition-all backdrop-blur"
        >
          ← Edit Details
        </button>
        
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className="bg-green-600/80 hover:bg-green-600 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-light py-3 px-8 rounded-full transition-all backdrop-blur"
        >
          {state.isCreating ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Market...
            </div>
          ) : (
            'Launch Market'
          )}
        </button>
      </div>
      
      {state.createError && (
        <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
          <div className="text-red-400 font-medium">Creation Failed</div>
          <div className="text-red-300 text-sm">{state.createError}</div>
        </div>
      )}
    </div>
  );

  const LaunchStep = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold text-white">Market Created!</h1>
      <p className="text-gray-400 max-w-md mx-auto">
        Your prediction market has been successfully created and is now live.
      </p>
      
      {state.createdAmmAddress && (
        <button
          onClick={() => router.push(`/market/${state.createdAmmAddress}`)}
          className="bg-blue-600/80 hover:bg-blue-600 text-white font-light py-3 px-8 rounded-full transition-all backdrop-blur"
        >
          View Your Market →
        </button>
      )}
    </div>
  );

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
        {renderStepContent()}
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