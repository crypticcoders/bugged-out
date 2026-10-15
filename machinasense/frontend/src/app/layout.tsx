import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "MachinaSense | Intelligent Industrial Fault Detection & Predictive Maintenance",
  description: "Enterprise-grade physics-informed industrial DSP, unsupervised anomaly detection, supervised fault classification, and edge computing profiler.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} ${playfair.variable} font-sans min-h-screen flex flex-col bg-[#0A0D12] text-[#F8FAFC] antialiased selection:bg-[#10B981]/20 selection:text-[#34D399]`}
      >
        {/* Ledgr-style Top Header */}
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0A0D12]/80 border-b border-[#1E2633] px-6 lg:px-12 py-3.5 transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Wordmark and Provenance */}
            <div className="flex items-center gap-4">
              <Link href="/" className="group flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-[#10B981] transition-colors">
                  machinasense<span className="text-[#10B981]">.</span>
                </span>
              </Link>
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wider bg-[#064E3B]/40 border border-[#10B981]/30 text-[#34D399]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span>LIVE TELEMETRY (1,000 Hz)</span>
              </div>
            </div>

            {/* Navigation and Action CTA */}
            <nav className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6 text-[13px] text-slate-400 font-medium tracking-wide">
                <a href="/#pipeline" className="hover:text-white transition-colors">
                  Pipeline
                </a>
                <a href="/#architecture" className="hover:text-white transition-colors">
                  Physics Twin
                </a>
                <a href="/#edge-specs" className="hover:text-white transition-colors">
                  Edge Specs
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide bg-[#10B981] text-[#0A0D12] hover:bg-[#34D399] shadow-sm hover:shadow-[#10B981]/20 transition-all"
                >
                  <span>Operator Console</span>
                  <span className="text-sm">→</span>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Ledgr-style Minimalist Footer */}
        <footer className="w-full border-t border-[#1E2633] py-8 px-6 lg:px-12 text-center text-xs text-slate-500 bg-[#0A0D12]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">machinasense.</span>
              <span>— Deterministic Physics & Industrial Machine Learning in Sync.</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px] text-slate-500">
              <span>ISO 10816 COMPLIANT</span>
              <span>•</span>
              <span>STM32 / ESP32 PROFILED</span>
              <span>•</span>
              <span>ZERO MOCK INFERENCE</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
