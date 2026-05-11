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
        <title>SMESH — Trade Finance LP Utility Token</title>
        <meta name="description" content="SMESH is a deflationary settlement token on Base. Every trade finance deal settled burns SMESH permanently. Real-world activity drives on-chain scarcity." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{`
        .nav-links { display: flex; align-items: center; gap: 1.5rem; }
        .nav-link  { color: #a0a0b8; text-decoration: none; font-size: 0.85rem; letter-spacing: 0.05em; white-space: nowrap; }
        .nav-link:hover { color: #fff; }
        .nav-desktop { display: flex; align-items: center; gap: 1.5rem; }
        @media (max-width: 768px) {
          .nav-desktop { display: none; }
        }
      `}</style>
      <div className={`${spaceGrotesk.variable} ${orbitron.variable} min-h-screen`} style={{ background: '#0a0a0f', color: '#fff' }}>
        <nav style={{ borderBottom: '1px solid #1f1f2e', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <img src="/smesh-logo.jpg" alt="SMESH" style={{ height: '28px', width: '28px', borderRadius: '5px' }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em', color: '#fff' }}>SMESH</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="nav-desktop">
                <Link href="/how-it-works" className="nav-link">How It Works</Link>
                <Link href="/investors" className="nav-link">Participate</Link>
                <Link href="/otc" className="nav-link">OTC</Link>
                <Link href="/stake" className="nav-link">Stake</Link>
                <Link href="/governance" className="nav-link">Governance</Link>
                <Link href="/tokenomics" className="nav-link">Tokenomics</Link>
                <Link href="/originators" className="nav-link">Originators</Link>
                <Link href="/whitepaper" className="nav-link">Whitepaper</Link>
              </div>
              <a href="/stake" style={{ background: '#6366f1', color: '#fff', padding: '7px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Stake SMESH →</a>
            </div>
          </div>
        </nav>
        <Component {...pageProps} />
        <footer style={{ borderTop: '1px solid #1f1f2e', padding: '2rem 1.5rem', textAlign: 'center', color: '#555', fontSize: '0.8rem', marginTop: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <a href="/stake" style={{ color: '#6366f1', textDecoration: 'none' }}>Stake</a>
            <a href="/how-it-works" style={{ color: '#6366f1', textDecoration: 'none' }}>How It Works</a>
            <a href="/whitepaper" style={{ color: '#6366f1', textDecoration: 'none' }}>Whitepaper</a>
            <a href="https://t.me/smeshtoken" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>Telegram</a>
            <a href="https://x.com/smesh_gg" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>X / Twitter</a>
            <a href="https://basescan.org/address/0xDA31b578841d6d4417Dba55EFbdbF068e101a67a" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>Contract</a>
          </div>
          <p>© 2026 SMESH · Live on <a href="https://basescan.org/address/0xDA31b578841d6d4417Dba55EFbdbF068e101a67a" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>Base Network</a></p>
          <p style={{ marginTop: '0.5rem' }}>Operated by Litial Consulting FZ LLC · UAE · <a href="mailto:zalman@litial.net" style={{ color: '#6366f1', textDecoration: 'none' }}>zalman@litial.net</a></p>
          <p style={{ marginTop: '0.75rem', maxWidth: '600px', margin: '0.75rem auto 0', color: '#333', fontSize: '0.72rem', lineHeight: 1.6 }}>SMESH is a utility token providing protocol access rights. It is not an investment product and does not represent equity, debt, or profit-sharing arrangements. Not for US persons.</p>
        </footer>
      </div>
    </>
  );
}
