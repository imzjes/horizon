## Horizon – Decentralized Prediction Markets

Horizon is a USDC-native prediction market platform built on Sonic Mainnet.  
Creators can launch on-chain markets in minutes, traders can take YES/NO positions on real‑world events, and LPs earn a share of protocol fees.

### Live Demo

- **Production**: [`horizon-liart-nine.vercel.app`](https://horizon-liart-nine.vercel.app/)
- **Local**: `http://localhost:3000` (run with `pnpm dev`)

---

## Product Overview

- **USDC-native trading** on Sonic with low fees and fast finality  
- **Template-based market creation** for sports, crypto, and custom questions  
- **CPMM (constant product) AMM** for continuous pricing and liquidity provision  
- **Optimistic resolution** with evidence on IPFS and dispute windows  
- **Creator and LP incentives** via configurable fee splits and bonds  

### Sports Markets

- NBA, NFL, MLS, and NHL game templates with structured rules  
- Support for binary and ternary outcomes (e.g., win / draw / lose)  
- Resolution windows aligned with trusted data sources (e.g., ESPN)  

### Crypto Markets

- Top‑assets list with real‑time prices and market caps  
- Price‑target markets (e.g., “Will SONIC close above $5.88 by Dec 31, 2025?”)  
- Dynamic target suggestions and custom targets with per‑market resolution time  

### UX & Frontend

- Dark, glassmorphism‑inspired UI aligned with modern web3 products  
- Responsive layout across landing, markets, create, and market detail pages  
- Lottie‑based hero animation and subtle scroll‑triggered motion  

---

## Tech Stack

### Frontend

- **Next.js 15 (App Router)**  
- **React + TypeScript**  
- **Tailwind CSS** for styling  
- **Lottie** for hero animation  

### Web3 Integration

- **wagmi** + **viem** for contract interaction  
- **MetaMask / EVM wallets** for user accounts  
- USDC integration for all deposits, trades, and payouts  

### Blockchain

- **Sonic Mainnet** for low‑latency, low‑fee settlements  
- Core contracts: `EventFactory`, `MarketAMM`, `ResolutionManager`, `FeeConfig`  
- IPFS integration (Pinata) for resolution evidence  

---

## Getting Started

### Prerequisites

- Node.js **20+**  
- **pnpm** package manager  
- An EVM wallet (MetaMask) configured for **Sonic Mainnet**

### Installation

```bash
git clone https://github.com/imzjes/horizon.git
cd horizon
pnpm install
```

### Configuration

```bash
cp apps/web/env.local.example apps/web/.env.local
# Edit apps/web/.env.local with your Sonic RPC URL, contract addresses, and Pinata credentials.
```

### Running Locally

```bash
pnpm dev          # Start dev server at http://localhost:3000
pnpm build        # Build production bundles
pnpm start        # Start production server (after build)
```

---

## Architecture

```text
horizon/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       ├── lib/             # hooks, data, config, IPFS helpers
│       └── public/          # static assets (Lottie, images, fixtures)
├── packages/
│   ├── contracts/           # Foundry smart contracts
│   └── shared/              # Shared ABIs, addresses, utilities
└── docs/                    # Architecture and design docs
```

Contracts are developed with **Foundry** and exposed to the frontend via the `@sonic-prediction-market/shared` package (ABIs, addresses, constants, utilities).

---

## Smart Contracts (Sonic Mainnet)

- **EventFactory** – market creation and configuration  
- **MarketAMM** – CPMM pool for YES/NO shares  
- **ResolutionManager** – optimistic oracle and dispute flow  
- **USDC** – ERC‑20 stablecoin used for all payments  

Environment variables (example):

```bash
NEXT_PUBLIC_CHAIN_ID=146
NEXT_PUBLIC_RPC_URL=https://rpc.soniclabs.com

NEXT_PUBLIC_EVENT_FACTORY=0x40020fefDA001949e9Ea5B900453802F1e7Cb0a1
NEXT_PUBLIC_USDC=0x29219dd400f2Bf60E5a23d13Be72B486D4038894

NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
```

---

## Development Notes

### Frontend scripts

```bash
pnpm dev          # Run app in development mode
pnpm build        # Production build
pnpm start        # Run built app
pnpm lint         # ESLint
pnpm type-check   # TypeScript checks
```

### Contracts (Foundry)

```bash
cd packages/contracts
forge build       # Compile contracts
forge test        # Run contract tests
forge script ...  # Deploy / scripts
```

---

## Contributing

Contributions are welcome. Please open an issue or pull request with a clear description of the change and any relevant screenshots or logs.  
For larger features, consider discussing the approach in an issue before starting implementation.

---

## License

This project is licensed under the **MIT License** – see [`LICENSE`](LICENSE) for details.
