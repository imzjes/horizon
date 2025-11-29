'use client';

import { MarketParams } from '../../lib/duplicate-detection';

interface QuestionPreviewProps {
  params: Partial<MarketParams>;
  marketHash?: `0x${string}`;
}

export function QuestionPreview({ params, marketHash }: QuestionPreviewProps) {
  const formatResolveTime = (timestamp?: number) => {
    if (!timestamp) return 'Not set';
    
    const date = new Date(timestamp * 1000);
    const localTime = date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    const utcTime = date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    
    return { localTime, utcTime };
  };

  const resolveTime = formatResolveTime(params.resolveAt);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-7 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-light tracking-tight text-white">Preview</h3>
        {marketHash && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Market ID</span>
            <code 
              className="text-xs bg-black/40 px-2 py-1 rounded-full cursor-pointer border border-white/15 hover:bg-white/10 transition-colors"
              onClick={() => navigator.clipboard.writeText(marketHash)}
              title="Click to copy"
            >
              {`${marketHash.slice(0, 8)}...${marketHash.slice(-6)}`}
            </code>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Category */}
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1 uppercase tracking-wide">
            Category
          </label>
          <div className="text-sm text-white">
            {params.category || (
              <span className="text-gray-500 italic">No category selected</span>
            )}
          </div>
        </div>
        
        {/* Title */}
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1 uppercase tracking-wide">
            Question
          </label>
          <div className="text-lg font-light text-white leading-relaxed">
            {params.title || (
              <span className="text-gray-500 italic">No question generated</span>
            )}
          </div>
        </div>
        
        {/* Rules */}
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1 uppercase tracking-wide">
            Rules &amp; Resolution Criteria
          </label>
          <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-line bg-black/40 rounded-2xl p-4 border border-white/10">
            {params.rules || (
              <span className="text-gray-500 italic">No rules generated</span>
            )}
          </div>
        </div>
        
        {/* Resolve Time */}
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1 uppercase tracking-wide">
            Resolution Time
          </label>
          {typeof resolveTime === 'string' ? (
            <div className="text-gray-500 italic">{resolveTime}</div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm text-white">{resolveTime.localTime}</div>
              <div className="text-xs text-gray-400">{resolveTime.utcTime}</div>
            </div>
          )}
        </div>
        
        {/* Primary Source */}
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1 uppercase tracking-wide">
            Primary Source
          </label>
          {params.primarySource ? (
            <a
              href={params.primarySource}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 underline break-all"
            >
              {params.primarySource}
            </a>
          ) : (
            <span className="text-gray-500 italic">No source specified</span>
          )}
        </div>
      </div>
      
      {/* Validation warnings */}
      <ValidationWarnings params={params} />
    </div>
  );
}

function ValidationWarnings({ params }: { params: Partial<MarketParams> }) {
  const warnings: string[] = [];
  
  if (!params.category?.trim()) warnings.push('Category is required');
  if (!params.title?.trim()) warnings.push('Title is required');
  if (!params.rules?.trim()) warnings.push('Rules are required');
  if (!params.primarySource?.trim()) warnings.push('Primary source is required');
  if (!params.resolveAt || params.resolveAt <= Date.now() / 1000 + 3600) {
    warnings.push('Resolution time must be at least 1 hour in the future');
  }
  
  if (warnings.length === 0) {
    return (
      <div className="mt-5 flex items-center text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/40 rounded-2xl px-3 py-2">
        <svg className="w-4 h-4 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Ready to create</span>
      </div>
    );
  }
  
  return (
    <div className="mt-5 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 space-y-2">
      <div className="flex items-center text-xs font-medium text-amber-300">
        <span className="mr-2">⚠️</span>
        <span>Missing required fields</span>
      </div>
      <ul className="text-xs text-amber-200 space-y-1">
        {warnings.map((warning, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2 mt-0.5">•</span>
            <span>{warning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
