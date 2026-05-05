import Link from "next/link";

// ─── Token distribution data ──────────────────────────────────────────────────

const DISTRIBUTION = [
  {
    label: "Ecosystem & Rewards",
    percent: 30,
    tokens: "300,000,000",
    color: "#6366f1",
    lock: "Unlocked — distributed via protocol",
  },
  {
    label: "Team & Advisors",
    percent: 20,
    tokens: "200,000,000",
    color: "#10b981",
    lock: "4-year vest, 1-year cliff",
  },
  {
    label: "Foundation Reserve",
    percent: 20,
    tokens: "200,000,000",
    color: "#8b5cf6",
    lock: "Governance locked (3-of-5 multisig)",
  },
  {
    label: "Public Sale (Reg A+)",
    percent: 15,
    tokens: "150,000,000",
    color: "#f59e0b",
    lock: "TBA — pending regulatory approval",
  },
  {
    label: "Treasury",
    percent: 10,
    tokens: "100,000,000",
    color: "#06b6d4",
    lock: "Multisig governed (2-of-3)",
  },
  {
    label: "Market Maker",
    percent: 5,
    tokens: "50,000,000",
    color: "#ef4444",
    lock: "Locked 12 months post-TGE",
  },
];

// ─── Simple SVG pie chart ─────────────────────────────────────────────────────

function PieChart() {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;
  const innerR = 56; // donut hole

  let cumAngle = -Math.PI / 2; // start at top

  const slices = DISTRIBUTION.map((d) => {
    const angle = (d.percent / 100) * 2 * Math.PI;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const xi1 = cx + innerR * Math.cos(startAngle);
    const yi1 = cy + innerR * Math.sin(startAngle);
    const xi2 = cx + innerR * Math.cos(endAngle);
    const yi2 = cy + innerR * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${xi1} ${yi1}`,
      `L ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi2} ${yi2}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1}`,
      "Z",
    ].join(" ");

    return { ...d, path };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
      {slices.map((s) => (
        <path
          key={s.label}
          d={s.path}
          fill={s.color}
          stroke="#12121a"
          strokeWidth={2}
          opacity={0.9}
        >
          <title>{s.label}: {s.percent}%</title>
        </path>
      ))}
      {/* Centre text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="600">
        SMESH
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b" fontSize={9}>
        1B total
      </text>
    </svg>
  );
}

// ─── Vesting timeline ─────────────────────────────────────────────────────────

function VestingTimeline() {
  const years = [0, 1, 2, 3, 4];

  return (
    <div className="mt-4">
      <div className="relative">
        {/* Track */}
        <div className="flex items-center gap-0">
          {years.map((y, i) => (
            <div key={y} className="flex-1 relative">
              {i < years.length - 1 && (
                <div className="absolute top-3 left-4 right-0 h-0.5 bg-agx-border z-0" />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    y === 0
                      ? "bg-agx-bg border-agx-muted"
                      : y === 1
                      ? "bg-yellow-500 border-yellow-400"
                      : "bg-agx-accent border-agx-accent"
                  }`}
                />
                <span className="text-xs text-agx-muted mt-1">Yr {y}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Annotations */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-agx-bg border border-agx-muted flex-shrink-0" />
            <span className="text-agx-muted">TGE — tokens locked (cliff begins)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
            <span className="text-agx-muted">Year 1 — cliff unlocks, linear vesting begins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-agx-accent flex-shrink-0" />
            <span className="text-agx-muted">Year 2–4 — linear monthly releases</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-agx-accent flex-shrink-0" />
            <span className="text-agx-muted">Year 4 — 100% fully vested</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TokenomicsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest text-agx-accent bg-agx-accent/10 rounded-full mb-4">
          Token Economics
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-agx-text">
          SMESH Tokenomics
        </h1>
        <p className="mt-4 text-agx-muted max-w-xl mx-auto">
          Designed for long-term sustainability. Fair distribution, locked team
          allocation, and deflationary burn mechanics.
        </p>

        <div className="mt-8 inline-flex items-center gap-8 px-8 py-4 bg-agx-surface border border-agx-border rounded-2xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-agx-text">SMESH</div>
            <div className="text-xs text-agx-muted mt-0.5">Token Symbol</div>
          </div>
          <div className="w-px h-10 bg-agx-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-agx-text">1,000,000,000</div>
            <div className="text-xs text-agx-muted mt-0.5">Total Supply (Fixed)</div>
          </div>
          <div className="w-px h-10 bg-agx-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-agx-text">Base</div>
            <div className="text-xs text-agx-muted mt-0.5">Network</div>
          </div>
        </div>
      </div>

      {/* Distribution chart + table */}
      <section className="grid md:grid-cols-2 gap-8 items-start mb-12">
        {/* Pie chart */}
        <div className="bg-agx-surface border border-agx-border rounded-2xl p-6 flex flex-col items-center">
          <h2 className="text-lg font-semibold text-agx-text mb-6 self-start">Token Distribution</h2>
          <PieChart />
          <div className="mt-6 w-full grid grid-cols-2 gap-2">
            {DISTRIBUTION.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-xs text-agx-muted truncate">{d.label}</span>
                <span className="text-xs text-agx-text font-semibold ml-auto">{d.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution table */}
        <div className="bg-agx-surface border border-agx-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-agx-text mb-4">Allocation Details</h2>
          <div className="space-y-3">
            {DISTRIBUTION.map((d) => (
              <div
                key={d.label}
                className="p-3 bg-agx-bg rounded-xl border border-agx-border hover:border-agx-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-sm font-medium text-agx-text">{d.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: d.color }}>
                    {d.percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-agx-muted">{d.tokens} SMESH</span>
                  <span className="text-xs text-agx-muted">{d.lock}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-agx-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${d.percent}%`, backgroundColor: d.color, opacity: 0.7 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Token mechanics */}
      <section className="bg-agx-surface border border-agx-border rounded-2xl p-6 mb-12">
        <h2 className="text-lg font-semibold text-agx-text mb-6">Token Mechanics</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Burn */}
          <div className="p-4 bg-agx-bg rounded-xl border border-red-500/20">
            <div className="text-3xl font-bold text-red-400 mb-1">5%</div>
            <div className="text-sm font-semibold text-agx-text mb-2">Protocol Burn</div>
            <p className="text-xs text-agx-muted leading-relaxed">
              5% of every SMESH transaction is permanently burned, creating deflationary
              pressure and increasing scarcity over time.
            </p>
          </div>
          {/* Platform fee */}
          <div className="p-4 bg-agx-bg rounded-xl border border-amber-500/20">
            <div className="text-3xl font-bold text-amber-400 mb-1">10%</div>
            <div className="text-sm font-semibold text-agx-text mb-2">Platform Fee</div>
            <p className="text-xs text-agx-muted leading-relaxed">
              10% of task payments flow to the Equity Bridge operating company to fund
              ongoing platform development and infrastructure.
            </p>
          </div>
          {/* Agent owner */}
          <div className="p-4 bg-agx-bg rounded-xl border border-green-500/20">
            <div className="text-3xl font-bold text-green-400 mb-1">85%</div>
            <div className="text-sm font-semibold text-agx-text mb-2">Agent Owner</div>
            <p className="text-xs text-agx-muted leading-relaxed">
              85% of task payment goes directly to the registered AI agent owner. Fair
              compensation for builders who deploy productive agents.
            </p>
          </div>
        </div>

        {/* Visual flow */}
        <div className="mt-6 p-4 bg-agx-bg rounded-xl border border-agx-border">
          <div className="text-xs text-agx-muted text-center mb-3">Payment Flow per Transaction</div>
          <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
            <div className="px-3 py-1.5 bg-agx-surface rounded-lg border border-agx-border text-agx-text font-medium">
              100 SMESH
            </div>
            <span className="text-agx-muted">→</span>
            <div className="px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 font-medium text-xs">
              85 SMESH → Agent Owner
            </div>
            <span className="text-agx-muted">+</span>
            <div className="px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 font-medium text-xs">
              10 SMESH → Platform
            </div>
            <span className="text-agx-muted">+</span>
            <div className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 font-medium text-xs">
              5 SMESH 🔥 Burned
            </div>
          </div>
        </div>
      </section>

      {/* Vesting schedule */}
      <section className="bg-agx-surface border border-agx-border rounded-2xl p-6 mb-12">
        <h2 className="text-lg font-semibold text-agx-text mb-2">Team Vesting Schedule</h2>
        <p className="text-sm text-agx-muted mb-4">
          Team & Advisor allocation (20% / 200M SMESH) is locked in the{" "}
          <code className="text-agx-accent bg-agx-bg px-1 rounded text-xs">TokenVesting.sol</code>{" "}
          contract, audited and deployed on Base. The Foundation multisig can revoke unvested tokens.
        </p>
        <VestingTimeline />
        <div className="mt-6 grid sm:grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3 bg-agx-bg rounded-xl border border-agx-border">
            <div className="text-agx-text font-semibold mb-0.5">Start Date</div>
            <div className="text-agx-muted">TGE date (TBD)</div>
          </div>
          <div className="p-3 bg-agx-bg rounded-xl border border-agx-border">
            <div className="text-agx-text font-semibold mb-0.5">Cliff</div>
            <div className="text-agx-muted">12 months — 0 tokens unlock</div>
          </div>
          <div className="p-3 bg-agx-bg rounded-xl border border-agx-border">
            <div className="text-agx-text font-semibold mb-0.5">Full Vest</div>
            <div className="text-agx-muted">48 months — 100% unlocked</div>
          </div>
        </div>
      </section>

      {/* Get SMESH CTA */}
      <section className="text-center">
        <div className="inline-flex flex-col items-center gap-4 p-8 bg-agx-surface border border-agx-accent/30 rounded-2xl">
          <div className="text-xl font-bold text-agx-text">Ready to get SMESH?</div>
          <p className="text-sm text-agx-muted max-w-sm">
            Trade SMESH on Aerodrome on the Base network. Provide liquidity and
            earn trading fees.
          </p>
          <a
            href="https://aerodrome.finance/swap?inputCurrency=ETH&outputCurrency=TBD_SMESH_ADDRESS"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-agx-accent hover:bg-agx-accent/90 text-white font-semibold rounded-xl transition-colors"
          >
            Get SMESH on Aerodrome →
          </a>
          <p className="text-xs text-agx-muted">
            Contract address will be published after mainnet deployment.{" "}
            <Link href="/legal/terms" className="underline hover:text-agx-text">
              Read disclaimer
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
