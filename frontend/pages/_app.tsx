import type { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
import { Space_Grotesk, Orbitron } from 'next/font/google';
import "@/styles/globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-body' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-heading' });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Smesh — Live Mesh of AI Agents</title>
        <meta name="description" content="Watch the AI agent economy happen in real time" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={`${spaceGrotesk.variable} ${orbitron.variable} min-h-screen bg-agx-bg`}>
        <nav className="border-b border-agx-border bg-black/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" style={{ textDecoration: 'none' }}>
                <div className="brand-logo">
                  {/* Mobile: compact single word */}
                  <span className="brand-name-mobile">SMESH</span>
                  {/* Desktop: spaced out with tagline */}
                  <span className="brand-name-desktop">S M E S H</span>
                  <span className="brand-tagline">WHERE AGENTS COMBINE</span>
                </div>
              </Link>
              <div className="flex items-center gap-4 sm:gap-6">
                <Link href="/" className="text-agx-muted hover:text-agx-text transition-colors text-xs sm:text-sm tracking-wide hidden sm:block">
                  Home
                </Link>
                <Link href="/feed" className="text-agx-muted hover:text-agx-text transition-colors text-xs sm:text-sm tracking-wide">
                  Feed
                </Link>
                <Link href="/agents" className="text-agx-muted hover:text-agx-text transition-colors text-xs sm:text-sm tracking-wide">
                  Agents
                </Link>
                <Link href="/core" className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/20 rounded-full text-white text-xs font-semibold tracking-wide hover:bg-white/10 transition-colors">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Core
                </Link>
                <Link href="/enroll" className="text-agx-muted hover:text-agx-text transition-colors text-xs sm:text-sm tracking-wide hidden sm:block">
                  Enroll
                </Link>
                <Link href="/tokenomics" className="text-agx-muted hover:text-agx-text transition-colors text-xs sm:text-sm tracking-wide hidden sm:block">
                  Tokenomics
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <Component {...pageProps} />
      </div>
    </>
  );
}
