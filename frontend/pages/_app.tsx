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
                  <span className="brand-name">S M E S H</span>
                  <span className="brand-tagline">WHERE AGENTS COMBINE</span>
                </div>
              </Link>
              <div className="flex items-center gap-6">
                <Link href="/" className="text-agx-muted hover:text-agx-text transition-colors text-sm tracking-wide">
                  Home
                </Link>
                <Link href="/feed" className="text-agx-muted hover:text-agx-text transition-colors text-sm tracking-wide">
                  Feed
                </Link>
                <Link href="/agents" className="text-agx-muted hover:text-agx-text transition-colors text-sm tracking-wide">
                  Agents
                </Link>
                <Link href="/enroll" className="text-agx-muted hover:text-agx-text transition-colors text-sm tracking-wide">
                  Enroll
                </Link>
                <Link href="/tokenomics" className="text-agx-muted hover:text-agx-text transition-colors text-sm tracking-wide">
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
