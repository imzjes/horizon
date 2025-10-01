# Horizon - Decentralized Prediction Markets

![Horizon Banner](https://via.placeholder.com/1200x400/1a1a1a/ffffff?text=Horizon+Prediction+Markets)

A modern, decentralized prediction market platform built on Sonic blockchain with USDC-native trading, optimistic resolution, and creator incentives.

## 🚀 Live Demo

**🌐 [Try Horizon](https://horizon-demo.vercel.app)** - Live demo deployed on Vercel

**🔧 [Local Development](http://localhost:3000)** - Run locally with `pnpm dev`

## ✨ Features

### 🎯 **Core Functionality**
- **USDC-Native Trading** - Trade with stablecoins on Sonic Mainnet
- **Template-Based Creation** - Sports, crypto, and custom market templates
- **Real-Time Pricing** - CPMM (Constant Product Market Maker) pricing
- **Optimistic Resolution** - Fast settlement with dispute mechanisms
- **Creator Revenue Share** - Earn fees from successful markets

### 🏀 **Sports Markets**
- NBA, NFL, MLS, NHL game predictions
- Automated rule generation from live data
- Support for draw/tie outcomes
- Real-time game status integration

### ₿ **Crypto Markets**
- Top 100 cryptocurrency price predictions
- Dynamic target suggestions (+5%, +10%, +25%, 2x)
- CoinGecko price integration
- Custom date and price targets

### 🎨 **Modern UX**
- **Dark Theme** - Sleek, Apple-inspired design
- **Glassmorphism** - Frosted glass effects and animations
- **Responsive Design** - Mobile-first approach
- **Real-Time Updates** - Live price and status updates
- **Interactive Charts** - Price history visualization

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lottie** - Interactive animations

### **Web3 Integration**
- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **MetaMask** - Wallet connection
- **USDC Integration** - Native stablecoin support

### **Blockchain**
- **Sonic Mainnet** - Fast, low-cost transactions
- **Smart Contracts** - EventFactory, MarketAMM, ResolutionManager
- **IPFS** - Decentralized evidence storage
- **FeeM** - Developer gas revenue sharing

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart         │    │   External      │
│   (Next.js)     │◄──►│   Contracts     │◄──►│   APIs          │
│                 │    │   (Sonic)       │    │   (Sports/Crypto)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   State Mgmt    │    │   USDC Trading  │    │   IPFS Storage  │
│   (React Hooks) │    │   (AMM Pool)    │    │   (Evidence)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ 
- **pnpm** package manager
- **MetaMask** wallet
- **Sonic Mainnet** network configured

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/horizon.git
   cd horizon
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📱 Usage

### **Creating Markets**
1. **Choose Template** - Sports, crypto, or custom
2. **Configure Details** - Title, rules, resolution time
3. **Add Liquidity** - Optional initial liquidity
4. **Deploy** - Pay creation bond and launch

### **Trading**
1. **Connect Wallet** - MetaMask with Sonic network
2. **Browse Markets** - View active prediction markets
3. **Trade Shares** - Buy YES/NO positions
4. **Monitor** - Track your positions and P&L

### **Resolution**
1. **Evidence Submission** - IPFS-based proof
2. **Dispute Window** - Community challenge period
3. **Final Settlement** - Automatic or arbiter decision
4. **Fee Distribution** - LP and creator rewards

## 🔧 Configuration

### **Environment Variables**
```bash
# Network Configuration
NEXT_PUBLIC_CHAIN_ID=146
NEXT_PUBLIC_RPC_URL=https://rpc.soniclabs.com

# Contract Addresses
NEXT_PUBLIC_EVENT_FACTORY=0x40020fefDA001949e9Ea5B900453802F1e7Cb0a1
NEXT_PUBLIC_USDC=0x29219dd400f2Bf60E5a23d13Be72B486D4038894

# IPFS Configuration
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
```

### **Smart Contract Addresses (Sonic Mainnet)**
- **EventFactory**: `0x40020fefDA001949e9Ea5B900453802F1e7Cb0a1`
- **ResolutionManager**: `0xe241bEE5b8228Ca03ED6846fe34ce8e743eC0b57`
- **USDC**: `0x29219dd400f2Bf60E5a23d13Be72B486D4038894`

## 🎯 Key Features Explained

### **Template System**
- **Sports**: Automated game detection and rule generation
- **Crypto**: Price prediction with dynamic targets
- **Custom**: Full control over market parameters

### **Trading Mechanics**
- **CPMM Pricing**: Constant product market maker
- **Liquidity Provision**: Earn fees by providing liquidity
- **Real-Time Updates**: Live price and volume data

### **Resolution Flow**
- **Optimistic**: Fast settlement with dispute window
- **Evidence-Based**: IPFS proof submission
- **Community Driven**: Dispute mechanisms and arbiter fallback

## 🧪 Development

### **Project Structure**
```
horizon/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       ├── lib/            # Utilities and hooks
│       └── public/         # Static assets
├── packages/
│   ├── contracts/          # Smart contracts
│   └── shared/             # Shared utilities
└── docs/                   # Documentation
```

### **Available Scripts**
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript checks
```

### **Smart Contract Development**
```bash
cd packages/contracts
forge build       # Compile contracts
forge test        # Run tests
forge deploy      # Deploy to network
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sonic Labs** - For the fast, low-cost blockchain infrastructure
- **Wagmi Team** - For excellent React hooks for Ethereum
- **Viem Team** - For the TypeScript Ethereum library
- **OpenZeppelin** - For secure smart contract patterns

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/yourusername/horizon/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/horizon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/horizon/discussions)

---

**Built with ❤️ for the decentralized future**

*Not affiliated with or endorsed by any league, team, or player.*
