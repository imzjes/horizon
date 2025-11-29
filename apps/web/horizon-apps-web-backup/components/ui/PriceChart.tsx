'use client';

import { useMemo } from 'react';

interface PriceHistoryPoint {
  timestamp: string;
  probabilities: number[];
  volume: number;
}

interface PriceChartProps {
  priceHistory: PriceHistoryPoint[];
  outcomes: string[];
  className?: string;
}

export function PriceChart({ priceHistory, outcomes, className = '' }: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return null;

    // Sort by timestamp
    const sorted = [...priceHistory].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Create SVG path data for each outcome
    const paths = outcomes.map((_, outcomeIndex) => {
      const points = sorted.map((point, index) => {
        const x = (index / (sorted.length - 1)) * 100;
        const y = 100 - (point.probabilities[outcomeIndex] * 100);
        return `${x},${y}`;
      });

      return points.join(' L');
    });

    return { sorted, paths };
  }, [priceHistory, outcomes]);

  if (!chartData) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-8 text-center ${className}`}>
        <div className="text-gray-400">No price history available</div>
      </div>
    );
  }

  const colors = ['#14b8a6', '#6b7280', '#ec4899']; // teal, gray, pink

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-white font-light text-lg mb-2">Price History</h3>
        <div className="flex items-center gap-4 text-sm">
          {outcomes.map((outcome, index) => (
            <div key={outcome} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[index] }}
              />
              <span className="text-gray-300">{outcome}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-64 bg-gray-900/50 rounded-lg p-4">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Y-axis labels */}
          <text x="2" y="10" fontSize="3" fill="#9ca3af" textAnchor="start">100%</text>
          <text x="2" y="50" fontSize="3" fill="#9ca3af" textAnchor="start">50%</text>
          <text x="2" y="90" fontSize="3" fill="#9ca3af" textAnchor="start">0%</text>
          
          {/* X-axis labels */}
          <text x="10" y="98" fontSize="3" fill="#9ca3af" textAnchor="middle">7d ago</text>
          <text x="50" y="98" fontSize="3" fill="#9ca3af" textAnchor="middle">3d ago</text>
          <text x="90" y="98" fontSize="3" fill="#9ca3af" textAnchor="middle">Now</text>

          {/* Price lines */}
          {chartData.paths.map((path, index) => (
            <path
              key={index}
              d={`M ${path}`}
              fill="none"
              stroke={colors[index]}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Current probability dots */}
          {chartData.sorted[chartData.sorted.length - 1]?.probabilities.map((prob, index) => (
            <circle
              key={index}
              cx="90"
              cy={100 - (prob * 100)}
              r="1.5"
              fill={colors[index]}
              stroke="white"
              strokeWidth="0.3"
            />
          ))}
        </svg>
      </div>

      {/* Volume indicator */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>Volume: ${chartData.sorted[chartData.sorted.length - 1]?.volume.toLocaleString()}</span>
        <span>Last updated: {new Date(chartData.sorted[chartData.sorted.length - 1]?.timestamp).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
