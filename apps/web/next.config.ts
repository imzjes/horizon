import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Enable compression
  compress: true,
  
  // PWA and caching settings
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],

  // Image optimization
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
  },

  // Bundle analyzer (disabled by default)
  ...(process.env.ANALYZE === 'true' && {
    experimental: {
      bundlePagesExternals: false,
    },
  }),

  webpack: (config, { isServer, webpack }) => {
    // Fix for Node.js modules being required in browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        url: false,
      };
    }

    // Performance optimizations
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    };

    // Tree shaking for production
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Bundle analyzer (commented out to avoid dependency issues)
    // if (process.env.ANALYZE === 'true') {
    //   const BundleAnalyzerPlugin = require('@next/bundle-analyzer')({
    //     enabled: true,
    //   });
    //   config.plugins.push(new BundleAnalyzerPlugin());
    // }

    return config;
  },

  // Experimental features for performance (reduced to avoid issues)
  experimental: {
    optimizePackageImports: [
      '@rainbow-me/rainbowkit',
      '@tanstack/react-query',
      'wagmi',
      'viem',
    ],
  },

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    swcMinify: true,
    
    // Static generation for better performance
    trailingSlash: false,
    
    // Reduce build output
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: false,
    },
  }),
};

export default nextConfig;
