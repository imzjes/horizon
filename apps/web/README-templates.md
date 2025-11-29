# Smart Templates & Auto-Fill System

This document explains the smart templates and auto-fill system for creating prediction markets.

## Overview

The platform now supports three ways to create prediction markets:

1. **🏀 Sports Templates** - Auto-generate markets for NBA/NFL games
2. **₿ Crypto Templates** - Create price prediction markets for top cryptocurrencies  
3. **✍️ Custom Templates** - Manual entry for any prediction market

## Features

### Sports Templates
- **Leagues**: NBA and NFL support
- **Data Sources**: ESPN API (live) → NBA Official API (live) → Local JSON fallback
- **Auto-Generation**:
  - Question: "Will the {Home Team} beat the {Away Team} on {Date}?"
  - Rules: Official game rules with OT handling
  - Resolution: Smart timing with buffer + deadline system
  - Source: ESPN API with "Final" status verification

### Crypto Templates  
- **Assets**: Top 150 cryptocurrencies by market cap
- **Data Sources**: CoinGecko API → Local JSON fallback
- **Auto-Generation**:
  - Question: "Will {SYMBOL} price reach ≥ ${TARGET} by {DATE}?"
  - Rules: CoinGecko price at 00:00 UTC resolution
  - Target Suggestions: +5%, +10%, +25%, +50%, +100%, round numbers
  - Source: CoinGecko asset page

### Duplicate Detection
- **Canonical Hashing**: Same algorithm as smart contracts
- **Real-time Check**: Validates against existing markets before creation
- **Normalization**: Lowercase, trim, collapse whitespace
- **Hash Display**: Shows market ID preview with copy-to-clipboard

### Enhanced UX
- **Step-by-step Flow**: Template → Details → Review → Launch
- **Live Preview**: Real-time question/rules generation
- **Cost Calculator**: Creation bond + optional liquidity
- **Approval Management**: Smart USDC approval only when needed
- **Mobile Responsive**: Touch-friendly game/asset selection

### Sports Resolution System
**Smart Timing with Buffer + Deadline:**
- **Target Window**: 3-4 hours (NBA) / 4-5 hours (NFL) after tip-off
- **Hard Deadline**: 8 hours (NBA) / 12 hours (NFL) after tip-off
- **Status Verification**: Only resolves when ESPN API shows "Final" status
- **OT/Delay Handling**: Accounts for overtime, weather delays, reporting lag
- **Evidence Required**: Screenshot + link to official final score

**Resolution Automation API:**
- `getResolutionWindow()` - Check timing requirements
- `fetchGameStatus()` - Get live status from ESPN
- `resolveGame()` - Verify completion and determine winner
- Prevents premature resolution and ensures accuracy

## Configuration

### Required Environment Variables
```bash
# Contract addresses
NEXT_PUBLIC_FEE_CONFIG_ADDRESS=0x...
NEXT_PUBLIC_EVENT_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_RESOLUTION_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_USDC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_ARBITER_ADDRESS=0x...

# Chain configuration  
NEXT_PUBLIC_CHAIN_ID=146
NEXT_PUBLIC_RPC_URL=https://rpc.soniclabs.com
```

### Optional API Configuration
```bash
# All sports APIs are free and require no keys
# ESPN API: Provides live NBA/NFL game data
# NBA Official API: Backup source for NBA games

# CoinGecko (no key required)
NEXT_PUBLIC_COINGECKO_BASE=https://api.coingecko.com/api/v3

# IPFS/Pinata (for image uploads)
NEXT_PUBLIC_PINATA_JWT=your_jwt_here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs
```

## Fallback Data

The system includes local JSON files that ensure functionality even when external APIs are unavailable:

- **`/public/data/sports-fixtures.json`** - Sample NBA/NFL games with realistic schedules
- **`/public/data/top100-crypto.json`** - Top 150 crypto assets with current prices

These files are served statically and cached for 60 minutes to reduce API load.

## Architecture

### Data Layer (`/lib/data/`)
- **`types.ts`** - TypeScript interfaces for all data types
- **`cache.ts`** - Simple in-memory cache with 60-minute TTL
- **`sports.ts`** - Sports data providers with fallback chain
- **`crypto.ts`** - Crypto data providers with fallback chain

### Components (`/components/create/`)
- **`SportsGamePicker.tsx`** - League selection and game list
- **`CryptoAssetPicker.tsx`** - Asset search and target price selector
- **`QuestionPreview.tsx`** - Live preview of generated market
- **`CostsPanel.tsx`** - Cost calculation and USDC approval

### Hooks (`/lib/hooks/`)
- **`useCreateMarket.ts`** - Main state management hook
- **`duplicate-detection.ts`** - Market hash generation and validation

## Testing

### Sports Template Flow
1. Visit `/create`
2. Click "Sports" → Choose NBA or NFL → Select game
3. Question and rules auto-generate
4. Review shows market ID and costs
5. Connect wallet → Approve USDC → Launch

### Crypto Template Flow  
1. Visit `/create`
2. Click "Crypto" → Search asset (e.g., "BTC") → Set target price and date
3. Question and rules auto-generate with CoinGecko source
4. Review and launch with market creation

### Fallback Testing
- Disconnect internet → Templates still work with local data
- Invalid API keys → Graceful fallback to local JSON
- Market duplication → Blocked with link to existing market

## Contract Integration

The system maintains 100% compatibility with existing contracts:

- **Market Hash**: Identical `keccak256(category|title|resolveAt|source|rules)` 
- **Event Creation**: Same `EventFactory.createEvent()` parameters
- **USDC Approval**: Optimized to only approve when necessary
- **Transaction Flow**: Standard create → optional liquidity → navigation

## Performance

- **Caching**: 60-minute TTL for all API responses
- **Lazy Loading**: Components load on-demand
- **Debounced Search**: Asset/game search with 300ms delay
- **Optimistic UI**: Immediate feedback with loading states
- **Mobile Optimized**: Touch targets and responsive design

The smart templates system dramatically improves UX while maintaining full contract compatibility and providing robust fallbacks for production reliability.
