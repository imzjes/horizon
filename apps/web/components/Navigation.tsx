'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { formatUSDC } from '@sonic-prediction-market/shared';
import { useUSDCs } from '../lib/hooks/useUSDC';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { APP_CONFIG } from '../lib/config';

export function Navigation() {
  // const { balance } = useUSDCs();
  const { address, isConnected } = useAccount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-4 inset-x-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-full border border-white/10 bg-black/40 backdrop-blur-md shadow-lg shadow-black/20">
          <div className="flex justify-between h-14 px-3 sm:px-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-lg sm:text-xl font-thin tracking-tight text-white truncate hover:opacity-90 transition-opacity">
              <span className="sm:hidden">Horizon</span>
              <span className="hidden sm:inline">Horizon</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/markets" className="text-gray-300 hover:text-white px-3 py-2 rounded-full text-sm font-light hover:bg-white/10 transition-colors">
              Markets
            </Link>
            <Link href="/create" className="text-gray-300 hover:text-white px-3 py-2 rounded-full text-sm font-light hover:bg-white/10 transition-colors">
              Create
            </Link>
            <Link href="/creator" className="text-gray-300 hover:text-white px-3 py-2 rounded-full text-sm font-light hover:bg-white/10 transition-colors">
              Creator
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Balance hidden per request */}
            
            {/* Connect Button */}
            <div className="hidden sm:block">
              <ConnectButton.Custom>
                {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;
                  if (!connected) {
                    return (
                      <button onClick={openConnectModal} className="inline-flex items-center rounded-full bg-white text-black px-4 py-2 text-sm font-medium shadow-sm transition-transform hover:scale-[1.02]">
                        Connect Wallet
                      </button>
                    );
                  }
                  if (chain && chain.unsupported) {
                    return (
                      <button onClick={openChainModal} className="inline-flex items-center rounded-full bg-yellow-300 text-black px-4 py-2 text-sm font-medium shadow-sm">
                        Wrong network
                      </button>
                    );
                  }
                  return (
                    <button onClick={openAccountModal} className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-medium shadow-sm transition-transform hover:scale-[1.02]">
                      <span>{account ? account.displayName : 'Account'}</span>
                    </button>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/30"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="mx-4 mt-2 rounded-2xl px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/60 backdrop-blur border border-white/10">
              <Link 
                href="/markets" 
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-light"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Markets
              </Link>
              <Link 
                href="/create" 
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-light"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Create
              </Link>
              <Link 
                href="/creator" 
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-light"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Creator
              </Link>
              {/* Admin moved under Creator page */}
              
              {/* Mobile wallet info */}
              <div className="border-t border-white/10 pt-4 mt-4 px-3">
                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;
                    if (!connected) {
                      return (
                        <button onClick={openConnectModal} className="w-full inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-2 text-base font-medium shadow-sm">
                          Connect Wallet
                        </button>
                      );
                    }
                    if (chain && chain.unsupported) {
                      return (
                        <button onClick={openChainModal} className="w-full inline-flex items-center justify-center rounded-full bg-yellow-300 text-black px-4 py-2 text-base font-medium shadow-sm">
                          Wrong network
                        </button>
                      );
                    }
                    return (
                      <button onClick={openAccountModal} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-4 py-2 text-base font-medium shadow-sm">
                        <span>{account ? account.displayName : 'Account'}</span>
                      </button>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
