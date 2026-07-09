// Blueprint background shared by the auth screens: two grids, the side SVG
// drawings, a center glow and a vignette. Purely decorative — pointer-events
// are disabled and it sits behind the card.
const MONO = "'JetBrains Mono', ui-monospace, monospace";

export const AuthBackdrop = () => (
  <div className="pointer-events-none absolute inset-0 z-0">
    {/* fine 56px grid */}
    <div
      className="absolute inset-[-2px]"
      style={{
        background:
          'linear-gradient(to right, #1c1c1c 1px, transparent 1px) 0 0 / 56px 56px,' +
          'linear-gradient(to bottom, #1c1c1c 1px, transparent 1px) 0 0 / 56px 56px',
      }}
    />
    {/* coarse 280px grid */}
    <div
      className="absolute inset-[-2px]"
      style={{
        background:
          'linear-gradient(to right, #161616 1px, transparent 1px) 0 0 / 280px 280px,' +
          'linear-gradient(to bottom, #161616 1px, transparent 1px) 0 0 / 280px 280px',
      }}
    />
    {/* side technical drawings */}
    <div className="absolute inset-0">
      <svg
        className="absolute top-1/2 left-[-160px] w-[520px] -translate-y-1/2"
        viewBox="0 0 520 520"
        fill="none"
      >
        <circle cx="260" cy="260" r="200" stroke="#262626" strokeWidth="1.3" />
        <circle cx="260" cy="260" r="120" stroke="#1f1f1f" strokeWidth="1.3" />
        <circle cx="260" cy="260" r="6" stroke="#3a3a3a" strokeWidth="1.3" />
        <path d="M260 30v460M30 260h460" stroke="#1c1c1c" strokeWidth="1" strokeDasharray="8 7" />
        <circle cx="260" cy="100" r="14" stroke="#262626" strokeWidth="1.2" />
        <circle cx="420" cy="260" r="14" stroke="#262626" strokeWidth="1.2" />
        <circle cx="260" cy="420" r="14" stroke="#262626" strokeWidth="1.2" />
        <circle cx="100" cy="260" r="14" stroke="#262626" strokeWidth="1.2" />
        <path d="M260 260L460 260" stroke="#2e2e2e" strokeWidth="1" />
        <text x="345" y="250" fontFamily={MONO} fontSize="13" fill="#3a3a3a">
          R200
        </text>
      </svg>
      <svg
        className="absolute right-[-120px] bottom-[-80px] w-[460px]"
        viewBox="0 0 460 360"
        fill="none"
      >
        <rect x="60" y="60" width="300" height="220" rx="14" stroke="#242424" strokeWidth="1.3" />
        <circle cx="210" cy="170" r="58" stroke="#1f1f1f" strokeWidth="1.3" />
        <path d="M60 36h300" stroke="#262626" strokeWidth="1" />
        <path d="M60 30v12M360 30v12" stroke="#262626" strokeWidth="1" />
        <text x="190" y="32" fontFamily={MONO} fontSize="12" fill="#3a3a3a">
          240.0
        </text>
        <text x="60" y="312" fontFamily={MONO} fontSize="11" fill="#2e2e2e">
          MEC-0420 · ±0.05
        </text>
      </svg>
    </div>
    {/* center glow */}
    <div
      className="absolute top-1/2 left-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2"
      style={{
        background: 'radial-gradient(circle, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0) 60%)',
      }}
    />
    {/* vignette */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(80% 70% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.92) 100%)',
      }}
    />
  </div>
);
