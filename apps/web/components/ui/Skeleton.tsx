import { clsx } from 'clsx';

// Simple className utility function
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return clsx(classes.filter(Boolean));
};

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-700',
        className
      )}
      style={style}
    />
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="mb-4">
        {/* Category badge */}
        <Skeleton className="h-6 w-16 mb-3" />
        
        {/* Title */}
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-3/4 mb-3" />

        {/* Probability */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-700">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function MarketHeaderSkeleton() {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 mb-8">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Skeleton className="h-6 w-16 mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="text-right ml-6">
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-700 rounded-lg p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketStatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-700 rounded-lg p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TradingFormSkeleton() {
  return (
    <div className="bg-gray-800 rounded-2xl p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      
      {/* Amount input */}
      <div className="mb-4">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>

      {/* Balance */}
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-gray-800 rounded-2xl p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="h-64 bg-gray-700 rounded-lg flex items-end justify-between p-4">
        {[...Array(12)].map((_, i) => (
          <Skeleton 
            key={i} 
            className="w-6" 
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}
