import { useCallback, useMemo, useRef, useEffect } from 'react';

// Debounce hook for search inputs and expensive operations
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for scroll events and frequent updates
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Memoize expensive calculations
export function useMemoizedCalculation<T>(
  calculation: () => T,
  dependencies: React.DependencyList
): T {
  return useMemo(calculation, dependencies);
}

// Local storage cache with TTL
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMinutes: number = 5
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > ttlMinutes * 60 * 1000;
        if (!isExpired) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    return null;
  }, [key, ttlMinutes]);

  const setCachedData = useCallback((data: T) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }, [key]);

  const fetchData = useCallback(async () => {
    // Try cache first
    const cached = getCachedData();
    if (cached) {
      setData(cached);
      return;
    }

    // Fetch fresh data
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      setCachedData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetcher, getCachedData, setCachedData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Intersection observer for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}

// Virtual scrolling for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    scrollTop,
  };
}

// Image lazy loading with placeholder
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const isVisible = useIntersectionObserver(imgRef as React.RefObject<Element>, {
    threshold: 0.1,
    rootMargin: '50px',
  });

  useEffect(() => {
    if (isVisible && src && imageSrc !== src) {
      setIsLoading(true);
      setError(false);

      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
      img.onerror = () => {
        setError(true);
        setIsLoading(false);
      };
      img.src = src;
    }
  }, [isVisible, src, imageSrc]);

  return {
    ref: imgRef,
    src: imageSrc,
    isLoading,
    error,
  };
}

// Performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderStart = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    const renderTime = performance.now() - renderStart.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    }

    renderStart.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
  };
}

// React import fix
import React from 'react';
