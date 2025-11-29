import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { Chain } from 'viem';
import { SONIC_CHAIN_CONFIG } from '@sonic-prediction-market/shared';

// Custom Sonic chain configuration for wagmi
const sonicChain: Chain = {
  id: SONIC_CHAIN_CONFIG.id,
  name: SONIC_CHAIN_CONFIG.name,
  nativeCurrency: SONIC_CHAIN_CONFIG.nativeCurrency,
  rpcUrls: SONIC_CHAIN_CONFIG.rpcUrls,
  blockExplorers: SONIC_CHAIN_CONFIG.blockExplorers,
  testnet: false,
};

// Wagmi configuration
export const wagmiConfig = getDefaultConfig({
  appName: 'Sonic Prediction Market',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [sonicChain],
  ssr: true,
});

// Contract addresses from environment
export const getContractAddresses = () => ({
  feeConfig: process.env.NEXT_PUBLIC_FEE_CONFIG_ADDRESS as `0x${string}`,
  eventFactory: process.env.NEXT_PUBLIC_EVENT_FACTORY_ADDRESS as `0x${string}`,
  resolutionManager: process.env.NEXT_PUBLIC_RESOLUTION_MANAGER_ADDRESS as `0x${string}`,
  usdc: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS as `0x${string}`,
  treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`,
  arbiter: process.env.NEXT_PUBLIC_ARBITER_ADDRESS as `0x${string}`,
});

// Chain configuration
export const CHAIN_CONFIG = {
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '146'),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.soniclabs.com',
  blockExplorer: 'https://sonicscan.org',
} as const;

// App configuration
export const APP_CONFIG = {
  isDev: process.env.NEXT_PUBLIC_DEV === '1',
  web3StorageToken: process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN,
} as const;
