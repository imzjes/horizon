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
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Preview</h3>
        {marketHash && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Market ID:</span>
            <code 
              className="text-xs bg-gray-700 px-2 py-1 rounded cursor-pointer hover:bg-gray-600 transition-colors"
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
          <label className="text-sm font-medium text-gray-400 block mb-1">Category</label>
          <div className="text-white">
            {params.category || (
              <span className="text-gray-500 italic">No category selected</span>
            )}
          </div>
        </div>
        
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-gray-400 block mb-1">Question</label>
          <div className="text-lg font-medium text-white leading-relaxed">
            {params.title || (
              <span className="text-gray-500 italic">No question generated</span>
            )}
          </div>
        </div>
        
        {/* Rules */}
        <div>
          <label className="text-sm font-medium text-gray-400 block mb-1">Rules & Resolution Criteria</label>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-gray-900 rounded-lg p-3 border border-gray-700">
            {params.rules || (
              <span className="text-gray-500 italic">No rules generated</span>
            )}
          </div>
        </div>
        
        {/* Resolve Time */}
        <div>
          <label className="text-sm font-medium text-gray-400 block mb-1">Resolution Time</label>
          {typeof resolveTime === 'string' ? (
            <div className="text-gray-500 italic">{resolveTime}</div>
          ) : (
            <div className="space-y-1">
              <div className="text-white">{resolveTime.localTime}</div>
              <div className="text-sm text-gray-400">{resolveTime.utcTime}</div>
            </div>
          )}
        </div>
        
        {/* Primary Source */}
        <div>
          <label className="text-sm font-medium text-gray-400 block mb-1">Primary Source</label>
          {params.primarySource ? (
            <a
              href={params.primarySource}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline break-all"
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
      <div className="mt-4 flex items-center text-green-400 text-sm">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Ready to create
      </div>
    );
  }
  
  return (
    <div className="mt-4 space-y-2">
      <div className="text-sm font-medium text-yellow-400">⚠️ Missing required fields:</div>
      <ul className="text-sm text-yellow-300 space-y-1">
        {warnings.map((warning, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2">•</span>
            <span>{warning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
