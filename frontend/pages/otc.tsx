import { useState, useEffect, useCallback } from "react";
import {
  BrowserProvider, Contract, parseUnits, formatUnits,
  type Eip1193Provider,
} from "ethers";
import {
  SMESH_ADDRESS, USDC_ADDRESS, OTC_VAULT_V3,
  OTC_VAULT_ABI, SMESH_ABI, USDC_ABI, BASE_CHAIN_ID,
} from "@/lib/web3";

// ── helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number, dec = 2) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(2) + "K";
  return n.toFixed(dec);
}
function pct(bps: bigint) { return (Number(bps) / 100).toFixed(2); }

type TxState = "idle" | "approving" | "buying" | "done" | "error";

interface Preview { discountBps: bigint; smeshToBuyer: bigint; smeshForPool: bigint }

// ── Pause flag — set to false to re-enable OTC purchases ──────────────────────
const OTC_PAUSED = true;

export default function OTCPage() {
  // ── ALL hooks must be declared before any conditional returns (Rules of Hooks) ──
  const [gateAccepted, setGateAccepted] = useState(false);
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);
  const [wallet, setWallet]         = useState<string | null>(null);
  const [usdcBal, setUsdcBal]       = useState(0);
  const [smeshBal, setSmeshBal]     = useState(0);
  const [poolUsdc, setPoolUsdc]     = useState(0);
  const [usdcInput, setUsdcInput]   = useState("");
  const [preview, setPreview]       = useState<Preview | null>(null);
  const [previewLoading, setPrevLoad] = useState(false);
  const [txState, setTxState]       = useState<TxState>("idle");
  const [txHash, setTxHash]         = useState("");
  const [errMsg, setErrMsg]         = useState("");
  const [slippage, setSlippage]     = useState(1);

  function getEthereum() {
    if (typeof window === "undefined") return null;
    return (window as unknown as { ethereum?: unknown }).ethereum ?? null;
  }
  async function getProvider() {
    const eth = getEthereum();
    if (!eth) throw new Error("MetaMask not found");
    return new BrowserProvider(eth as Eip1193Provider);
  }
  async function ensureBase(provider: BrowserProvider) {
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== BASE_CHAIN_ID) {
      await provider.send("wallet_switchEthereumChain", [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }]);
    }
  }

  const loadPoolStats = useCallback(async () => {
    try {
      const provider = await getProvider();
      const vault = new Contract(OTC_VAULT_V3, OTC_VAULT_ABI, provider);
      const raw = await vault.poolUsdcReserve() as bigint;
      setPoolUsdc(Number(formatUnits(raw, 6)));
    } catch {}
  }, []); // eslint-disable-line

  const loadBalances = useCallback(async (addr: string) => {
    try {
      const provider = await getProvider();
      const usdc  = new Contract(USDC_ADDRESS, USDC_ABI, provider);
      const smesh = new Contract(SMESH_ADDRESS, SMESH_ABI, provider);
      const [ub, sb] = await Promise.all([
        usdc.balanceOf(addr) as Promise<bigint>,
        smesh.balanceOf(addr) as Promise<bigint>,
      ]);
      setUsdcBal(Number(formatUnits(ub, 6)));
      setSmeshBal(Number(formatUnits(sb, 18)));
    } catch {}
  }, []); // eslint-disable-line

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accepted = sessionStorage.getItem('smesh_otc_gate');
      if (accepted === 'true') setGateAccepted(true);
    }
  }, []);

  useEffect(() => { loadPoolStats(); }, [loadPoolStats]);

  useEffect(() => {
    const amount = parseFloat(usdcInput);
    if (!amount || amount <= 0) { setPreview(null); return; }
    const t = setTimeout(async () => {
      setPrevLoad(true);
      try {
        const provider = await getProvider();
        const vault = new Contract(OTC_VAULT_V3, OTC_VAULT_ABI, provider);
        const raw = parseUnits(usdcInput, 6);
        const [dBps, smeshOut, smeshPool] = await vault.previewOTC(raw) as [bigint, bigint, bigint];
        setPreview({ discountBps: dBps, smeshToBuyer: smeshOut, smeshForPool: smeshPool });
      } catch { setPreview(null); }
      setPrevLoad(false);
    }, 500);
    return () => clearTimeout(t);
  }, [usdcInput]); // eslint-disable-line

  function acceptGate() {
    sessionStorage.setItem('smesh_otc_gate', 'true');
    setGateAccepted(true);
  }

  if (OTC_PAUSED) {
    return (
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🔒</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '1.25rem', lineHeight: 1.2 }}>
          OTC Purchases Temporarily Paused
        </h1>
        <p style={{ color: '#a0a0b8', fontSize: '1rem', lineHeight: 1.75, marginBottom: '2rem' }}>
          The OTC Vault is currently paused while we complete our regulatory review. We&apos;ll re-open shortly.
        </p>
        <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.7 }}>
          In the meantime, you can{' '}
          <a href="/stake" style={{ color: '#6366f1' }}>stake SMESH</a>{' '}
          or reach out at{' '}
          <a href="mailto:zalman@litial.net" style={{ color: '#6366f1' }}>zalman@litial.net</a>{' '}
          with any questions.
        </p>
      </main>
    );
  }

  if (!gateAccepted) {
    const allChecked = checked1 && checked2 && checked3;
    return (
      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '6rem 1.5rem' }}>
        <div style={{ background: '#0e0e1a', border: '1px solid #6366f1', borderRadius: '16px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
              Before You Continue
            </div>
            <p style={{ color: '#a0a0b8', fontSize: '0.85rem', lineHeight: 1.7 }}>
              Please confirm the following before accessing the OTC Vault.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '2rem' }}>
            {[
              { checked: checked1, set: setChecked1, text: 'I am not a United States person and I am not accessing this on behalf of a US person.' },
              { checked: checked2, set: setChecked2, text: 'I understand that SMESH is a utility token providing protocol access rights — it is not an investment product and does not represent equity, debt, or profit-sharing arrangements.' },
              { checked: checked3, set: setChecked3, text: 'I understand that by participating I receive SMESH tokens, not a financial return. Token values depend on market conditions. I have read the documentation and accept the protocol risk.' },
            ].map((item, i) => (
              <label key={i} style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', cursor: 'pointer' }}>
                <div
                  onClick={() => item.set(!item.checked)}
                  style={{
                    width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, marginTop: '2px',
                    border: `2px solid ${item.checked ? '#6366f1' : '#333'}`,
                    background: item.checked ? '#6366f1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {item.checked && <span style={{ color: '#fff', fontSize: '12px', lineHeight: 1 }}>✓</span>}
                </div>
                <span
                  onClick={() => item.set(!item.checked)}
                  style={{ color: '#a0a0b8', fontSize: '0.83rem', lineHeight: 1.65 }}
                >
                  {item.text}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={acceptGate}
            disabled={!allChecked}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px', fontWeight: 700,
              fontSize: '0.95rem', cursor: allChecked ? 'pointer' : 'not-allowed',
              border: 'none', background: allChecked ? '#6366f1' : '#2a2a3e',
              color: allChecked ? '#fff' : '#555', transition: 'all 0.15s',
            }}
          >
            I Confirm — Continue to OTC Vault
          </button>

          <p style={{ color: '#333', fontSize: '0.72rem', textAlign: 'center', marginTop: '1rem', lineHeight: 1.6 }}>
            Not for US persons. See <a href="/whitepaper" style={{ color: '#555' }}>Whitepaper</a> and <a href="/how-it-works" style={{ color: '#555' }}>How It Works</a> before participating.
          </p>
        </div>
      </main>
    );
  }



  function isMobile() {
    if (typeof window === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  async function handleConnect() {
    try {
      const eth = getEthereum();
      if (!eth) {
        if (isMobile()) {
          // Redirect to MetaMask mobile deep link — opens smesh.gg/otc inside MetaMask browser
          window.location.href = 'https://metamask.app.link/dapp/smesh.gg/otc';
          return;
        }
        setErrMsg("MetaMask not found. Please install MetaMask.");
        return;
      }
      const provider = await getProvider();
      await provider.send("eth_requestAccounts", []);
      await ensureBase(provider);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setWallet(addr);
      await loadBalances(addr);
    } catch (e: unknown) {
      setErrMsg((e as Error).message ?? "Connection failed");
    }
  }

  async function handleBuy() {
    if (!wallet || !preview || !usdcInput) return;
    setErrMsg("");
    try {
      const provider = await getProvider();
      await ensureBase(provider);
      const signer   = await provider.getSigner();
      const usdcWei  = parseUnits(usdcInput, 6);
      // Apply slippage to minSmeshOut
      const minOut   = preview.smeshToBuyer * BigInt(Math.round((100 - slippage) * 100)) / BigInt(10000);

      // 1. Check & approve USDC
      const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer);
      const allowance = await usdc.allowance(wallet, OTC_VAULT_V3) as bigint;
      if (allowance < usdcWei) {
        setTxState("approving");
        const tx = await usdc.approve(OTC_VAULT_V3, usdcWei);
        await tx.wait();
      }

      // 2. Buy OTC
      setTxState("buying");
      const vault = new Contract(OTC_VAULT_V3, OTC_VAULT_ABI, signer);
      const tx = await vault.buyOTC(usdcWei, minOut);
      setTxHash(tx.hash as string);
      await tx.wait();
      setTxState("done");
      await loadBalances(wallet);
      await loadPoolStats();
    } catch (e: unknown) {
      setTxState("error");
      setErrMsg((e as Error).message?.slice(0, 120) ?? "Transaction failed");
    }
  }

  const usdcNum    = parseFloat(usdcInput) || 0;
  const smeshOut   = preview ? Number(formatUnits(preview.smeshToBuyer, 18)) : 0;
  const discountPct = preview ? pct(preview.discountBps) : "0.00";
  const effectivePrice = smeshOut > 0 ? (usdcNum / smeshOut) : 0;
  const canBuy     = !!wallet && !!preview && usdcNum > 0 && usdcNum <= usdcBal && txState === "idle";

  const card: React.CSSProperties = {
    background: '#0e0e1a', border: '1px solid #1f1f2e',
    borderRadius: '14px', padding: '2rem',
  };
  const input: React.CSSProperties = {
    width: '100%', background: '#06060f', border: '1px solid #2a2a3e',
    borderRadius: '8px', color: '#fff', padding: '12px 16px', fontSize: '1.05rem',
    outline: 'none', boxSizing: 'border-box',
  };
  const btn = (disabled = false, variant: 'primary' | 'outline' = 'primary'): React.CSSProperties => ({
    width: '100%', padding: '14px', borderRadius: '10px', fontWeight: 700,
    fontSize: '0.95rem', cursor: disabled ? 'not-allowed' : 'pointer',
    border: variant === 'outline' ? '1px solid #6366f1' : 'none',
    background: disabled ? '#2a2a3e' : variant === 'outline' ? 'transparent' : '#6366f1',
    color: disabled ? '#555' : '#fff', transition: 'opacity .15s',
    opacity: disabled ? 0.6 : 1,
  });

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 1.5rem' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ display: 'inline-block', background: '#1a1a2e', border: '1px solid #6366f1', borderRadius: '999px', padding: '4px 14px', fontSize: '0.72rem', color: '#6366f1', letterSpacing: '0.12em', marginBottom: '1.25rem', fontWeight: 700 }}>
          OTC VAULT — BASE MAINNET
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '1rem', lineHeight: 1.2 }}>
          Provide Liquidity. Receive SMESH.
        </h1>
        <p style={{ color: '#a0a0b8', fontSize: '1rem', lineHeight: 1.75, maxWidth: '580px', margin: '0 auto' }}>
          Contribute USDC to deepen the protocol liquidity pool and receive SMESH in return. Stake your SMESH immediately to earn ecosystem distributions — everything stays within the protocol, denominated in SMESH.
        </p>
      </div>

      {/* Pool stat bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#1f1f2e', borderRadius: '12px', overflow: 'hidden', marginBottom: '2.5rem' }}>
        {[
          { label: 'Pool USDC Depth', value: poolUsdc ? `$${fmt(poolUsdc)}` : '—' },
          { label: 'SMESH Market Price', value: '$0.05' },
          { label: 'Stake After Purchase', value: '10% Rate' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0e0e1a', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: '#6366f1' }}>{s.value}</div>
            <div style={{ color: '#666', fontSize: '0.78rem', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: '1.5rem' }}>

        {/* ── Buy form ── */}
        <div style={card}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>Contribute USDC to the Protocol Pool</h2>
          <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>Your USDC deepens the liquidity pool. You receive SMESH at a protocol-calculated rate based on current pool depth.</p>

          {/* Amount input */}
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <input
              style={input}
              type="number"
              placeholder="0.00"
              min="0"
              value={usdcInput}
              onChange={e => { setUsdcInput(e.target.value); setTxState("idle"); setTxHash(""); setErrMsg(""); }}
            />
            <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1', fontWeight: 700, fontSize: '0.85rem' }}>USDC</span>
          </div>
          {wallet && (
            <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
              <button onClick={() => setUsdcInput(usdcBal.toFixed(2))} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}>
                Balance: {fmt(usdcBal)} USDC — Use Max
              </button>
            </div>
          )}

          {/* Slippage */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ color: '#666', fontSize: '0.8rem' }}>Slippage</span>
            {[0.5, 1, 2].map(s => (
              <button key={s} onClick={() => setSlippage(s)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: slippage === s ? '#6366f1' : '#2a2a3e', background: slippage === s ? '#6366f136' : 'transparent', color: slippage === s ? '#6366f1' : '#a0a0b8' }}>
                {s}%
              </button>
            ))}
          </div>

          {/* CTA */}
          {!wallet ? (
            <button style={btn()} onClick={handleConnect}>Connect Wallet</button>
          ) : txState === "approving" ? (
            <button style={btn(true)} disabled>Approving USDC…</button>
          ) : txState === "buying" ? (
            <button style={btn(true)} disabled>Buying SMESH…</button>
          ) : txState === "done" ? (
            <button style={btn(false, 'outline')} onClick={() => { setTxState("idle"); setUsdcInput(""); setPreview(null); }}>✓ Done — Buy More</button>
          ) : (
            <button style={btn(!canBuy)} onClick={handleBuy} disabled={!canBuy}>
              {usdcNum <= 0 ? 'Enter Amount' : usdcNum > usdcBal ? 'Insufficient USDC' : 'Contribute & Receive SMESH'}
            </button>
          )}

          {txHash && (
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem', color: '#6366f1', fontSize: '0.8rem' }}>
              View on Basescan ↗
            </a>
          )}
          {errMsg && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.75rem' }}>{errMsg}</p>}

          {wallet && (
            <div style={{ borderTop: '1px solid #1f1f2e', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#555' }}>
              <span>SMESH: {fmt(smeshBal)}</span>
              <span>{wallet.slice(0,6)}…{wallet.slice(-4)}</span>
            </div>
          )}
        </div>

        {/* ── Preview panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ ...card, flexGrow: 1 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.78rem', color: '#a0a0b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Transaction Preview</h3>
            {previewLoading && <div style={{ color: '#555', fontSize: '0.85rem' }}>Calculating…</div>}
            {!previewLoading && !preview && <div style={{ color: '#555', fontSize: '0.85rem' }}>Enter an amount to preview</div>}
            {preview && !previewLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#06060f', borderRadius: '10px', padding: '1.25rem', border: '1px solid #6366f120' }}>
                  <div style={{ color: '#a0a0b8', fontSize: '0.75rem', marginBottom: '0.4rem' }}>You receive</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700, color: '#6366f1' }}>
                    {fmt(smeshOut, 0)} SMESH
                  </div>
                  <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.25rem' }}>≈ ${usdcNum.toFixed(2)} at effective price ${effectivePrice.toFixed(6)}</div>
                </div>
                {[
                  { label: 'Protocol participation rate', value: `${discountPct}% below market`, highlight: true },
                  { label: 'Market price', value: '$0.050000' },
                  { label: 'Your entry rate', value: `$${effectivePrice.toFixed(6)}` },
                  { label: 'SMESH → Pool (POL)', value: `${fmt(Number(formatUnits(preview.smeshForPool, 18)), 0)}` },
                  { label: 'Slippage tolerance', value: `${slippage}%` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                    <span style={{ color: '#666' }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: r.highlight ? '#4ade80' : '#fff' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How it works mini card */}
          <div style={{ ...card, background: '#09091a', border: '1px solid #1a1a2e' }}>
            <p style={{ fontSize: '0.78rem', color: '#a0a0b8', fontWeight: 700, marginBottom: '0.6rem' }}>How it works</p>
            {[
              { n: '1', text: 'You contribute USDC → it deepens the protocol liquidity pool on Aerodrome permanently' },
              { n: '2', text: 'You receive SMESH at a protocol-calculated rate based on current pool depth' },
              { n: '3', text: 'Stake your SMESH for 60 or 120 days to earn ecosystem distributions — paid in SMESH' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#6366f1', fontWeight: 700, fontSize: '0.75rem', minWidth: '14px' }}>{s.n}.</span>
                <span style={{ color: '#666', fontSize: '0.78rem', lineHeight: 1.6 }}>{s.text}</span>
              </div>
            ))}
            <a href="/stake" style={{ color: '#6366f1', fontSize: '0.78rem', fontWeight: 600 }}>Stake your SMESH →</a>
          </div>

          {/* Stake CTA */}
          {txState === 'done' && (
            <div style={{ ...card, background: 'linear-gradient(135deg, #1a1a2e, #0e0e1a)', border: '1px solid #6366f1', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔒</div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>Now stake your SMESH</p>
              <p style={{ color: '#666', fontSize: '0.78rem', marginBottom: '1rem', lineHeight: 1.6 }}>Lock for 60 or 120 days. Earn ecosystem distributions in SMESH, pre-funded on day one.</p>
              <a href="/stake" style={{ background: '#6366f1', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', display: 'inline-block' }}>Go to Staking →</a>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{ color: '#444', fontSize: '0.75rem', textAlign: 'center', marginTop: '3rem', lineHeight: 1.6 }}>
        SMESH is a utility token. OTC participation involves protocol risk. You receive SMESH — not a financial return. Actual token values depend on market conditions at time of exit. Not for US persons. Verify all contracts on{' '}
        <a href={`https://basescan.org/address/${OTC_VAULT_V3}`} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>Basescan</a>.
        Not financial advice.
      </p>
    </main>
  );
}
