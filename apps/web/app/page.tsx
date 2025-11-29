"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Navigation } from "../components/Navigation";
import lottie from "lottie-web";

export default function Home() {
  const lottieRef = useRef<HTMLDivElement>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [lottieInstance, setLottieInstance] = useState<any>(null);

  // Load Lottie animation
  useEffect(() => {
    fetch('/media/3D Hologram.json')
      .then(response => response.json())
      .then(data => setLottieData(data))
      .catch(error => console.error('Error loading Lottie animation:', error));
  }, []);

  // Initialize Lottie animation
  useEffect(() => {
    if (lottieData && lottieRef.current && !lottieInstance) {
      const instance = lottie.loadAnimation({
        container: lottieRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: lottieData,
      });
      setLottieInstance(instance);
    }

    return () => {
      if (lottieInstance) {
        lottieInstance.destroy();
      }
    };
  }, [lottieData, lottieInstance]);

  // Simple on-scroll reveal animations
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (elements.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-show");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    );
    elements.forEach((el) => {
      el.classList.add("reveal-hidden");
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // Continuous fade section (appears when scrolling down, hides when scrolling up)
  useEffect(() => {
    const fadeEls = Array.from(document.querySelectorAll<HTMLElement>("[data-fade]"));
    if (fadeEls.length === 0) return;
    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const ratio = Math.max(0, Math.min(1, entry.intersectionRatio));
          (entry.target as HTMLElement).style.setProperty("--vis", ratio.toString());
        });
      },
      { threshold: thresholds }
    );
    fadeEls.forEach((el) => {
      el.classList.add("fade-on-scroll");
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // Sequential animation for step cards
  useEffect(() => {
    const stepCards = Array.from(document.querySelectorAll<HTMLElement>("[data-step]"));
    if (stepCards.length === 0) return;
    
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepNumber = parseInt(entry.target.getAttribute("data-step") || "0");
            // Animate each step with a delay
            setTimeout(() => {
              entry.target.classList.add("step-show");
            }, stepNumber * 200); // 200ms delay between each step
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.1 }
    );
    
    stepCards.forEach((el) => {
      el.classList.add("step-hidden");
      io.observe(el);
    });
    
    return () => io.disconnect();
  }, []);
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Subtle animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-500/15 to-cyan-400/20 blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -right-52 h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-fuchsia-500/15 via-violet-400/10 to-blue-400/15 blur-3xl animate-float" />
        <div className="absolute -bottom-40 left-1/4 h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-emerald-400/10 via-cyan-400/10 to-blue-500/15 blur-3xl animate-float-delay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
      </div>

      <Navigation />

      <main className="relative">
        {/* Hero Section */}
        <section className="text-center flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 w-full pt-24 min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-gray-300 backdrop-blur-sm mb-8">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              Live on Sonic Mainnet
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white mb-6">
              Horizon
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 font-light leading-relaxed max-w-3xl mx-auto mb-12">
              The future of prediction markets. Trade on real-world outcomes with unprecedented speed and transparency.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link 
                href="/markets" 
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-black rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/20"
              >
                Browse Markets
                <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link 
                href="/create" 
                className="inline-flex items-center justify-center px-8 py-4 border border-white/30 text-white rounded-full text-lg font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/50"
              >
                Create Market
              </Link>
            </div>
          </div>
        </section>

        {/* Statement section in stylized center layout */}
        <section className="py-28" data-fade>
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-white text-4xl md:text-6xl font-extrabold tracking-wide leading-tight uppercase">
              USDC‑Native Prediction Markets
            </h2>
            <p className="mt-4 text-gray-400 text-xl md:text-2xl font-light">
              Launch in minutes. Trade outcomes. Earn fees. Settle on‑chain.
            </p>

            {/* 3D Hologram Lottie Animation */}
            <div className="relative mx-auto mt-10 mb-8 h-64 w-64 md:h-80 md:w-80">
              {lottieData ? (
                <div ref={lottieRef} style={{ width: '100%', height: '100%' }} />
              ) : (
                <div className="text-5xl select-none">🔮</div>
              )}
            </div>

            <div className="flex justify-center">
              <Link href="/markets" className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 text-white px-6 py-3 text-base font-medium backdrop-blur transition-colors hover:bg-white/15">
                Explore Markets
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 border-t border-white/10" data-reveal>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-thin text-white mb-4">How it works</h2>
              <p className="text-xl text-gray-400 font-light">Create → Trade → Resolve → Settle</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  title: "Create",
                  desc: "Use sports or crypto templates, add rules and a source, post a refundable bond, optionally seed liquidity.",
                  accentBg: "from-fuchsia-500/25 to-violet-500/25",
                  accentText: "from-fuchsia-400 to-violet-300",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  ),
                },
                {
                  title: "Trade",
                  desc: "Buy YES/NO against the CPMM pool. LPs earn a share of trade fees.",
                  accentBg: "from-cyan-500/25 to-indigo-500/25",
                  accentText: "from-cyan-300 to-indigo-300",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h11m0 0L11 3m4 4L11 11M20 17H9m0 0l4-4m-4 4l4 4" />
                    </svg>
                  ),
                },
                {
                  title: "Resolve",
                  desc: "Reporter submits outcome + IPFS evidence. Dispute window opens; arbiter finalizes if disputed.",
                  accentBg: "from-emerald-500/25 to-teal-500/25",
                  accentText: "from-emerald-300 to-teal-200",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5a9 9 0 11-14 0V7l7-4z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                    </svg>
                  ),
                },
                {
                  title: "Settle",
                  desc: "Winning shares redeem for USDC. Fees become claimable by LPs, creators, protocol.",
                  accentBg: "from-amber-500/25 to-pink-500/25",
                  accentText: "from-amber-300 to-pink-300",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3m-2 0v7a2 2 0 01-2 2H9a2 2 0 01-2-2v-7" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v4m-2-2h4" />
                    </svg>
                  ),
                },
              ].map((item, i) => (
                <div key={item.title} data-step={i + 1} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-400">Step {i + 1}</div>
                    <div className={`rounded-xl border border-white/10 p-2 bg-gradient-to-br ${item.accentBg}`}>{item.icon}</div>
                  </div>
                  <div className={`text-xl bg-gradient-to-r bg-clip-text text-transparent ${item.accentText} mb-2`}>{item.title}</div>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fees & incentives */}
        <section className="py-24" data-fade>
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-xl border border-white/10 p-2 bg-gradient-to-br from-blue-500/25 to-purple-500/25">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent font-light">Fees, Bonds, Incentives</h3>
                </div>
                <ul className="text-gray-300/90 space-y-2 text-sm">
                  <li>• Trade fee example 0.8% → LP 65% • Creator 20% • Protocol 15%</li>
                  <li>• Settlement fee example 0.2% on payouts</li>
                  <li>• Creation bond (e.g., 10 USDC) with timed refund; deters spam</li>
                  <li>• Dispute bond scales with open interest to prevent frivolous disputes</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-xl border border-white/10 p-2 bg-gradient-to-br from-emerald-500/25 to-cyan-500/25">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </div>
                  <h3 className="text-2xl bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent font-light">Why Sonic</h3>
                </div>
                <ul className="text-gray-300/90 space-y-2 text-sm">
                  <li>• Fast finality, low gas, native USDC</li>
                  <li>• EVM tooling: Foundry, wagmi/viem, MetaMask</li>
                  <li>• Public RPC + Sonicscan for deploy and verify</li>
                  <li>• FeeM: developer gas revenue sharing on L1 gas</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Light stats strip */}
        <section className="py-20 border-t border-white/10" data-reveal>
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-thin text-white">Protocol Fee Split</div>
                <div className="text-gray-400">LP / Creator / Protocol</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-thin text-white">One-Click Approval</div>
                <div className="text-gray-400">USDCs Integration</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-thin text-white">On-Chain Markets</div>
                <div className="text-gray-400">No Demo Data</div>
              </div>
            </div>
        </div>
        </section>
      </main>

      {/* Page-level styles */}
      <style jsx>{`
        @keyframes float { 
          0%, 100% { transform: translateY(0px) translateX(0px); } 
          50% { transform: translateY(-20px) translateX(8px); } 
        }
        .animate-float { animation: float 15s ease-in-out infinite; }
        .animate-float-slow { animation: float 20s ease-in-out infinite; }
        .animate-float-delay { animation: float 18s ease-in-out infinite 2s; }
        .reveal-hidden { opacity: 0; transform: translateY(24px); transition: opacity 700ms ease, transform 700ms ease; }
        .reveal-show { opacity: 1; transform: translateY(0); }
        .fade-on-scroll { opacity: calc(var(--vis, 0)); transform: translateY(calc(24px * (1 - var(--vis, 0)))); transition: opacity 200ms linear, transform 200ms linear; }
        .step-hidden { opacity: 0; transform: translateY(32px) scale(0.95); transition: opacity 600ms ease, transform 600ms ease; }
        .step-show { opacity: 1; transform: translateY(0) scale(1); }
      `}</style>
    </div>
  );
}