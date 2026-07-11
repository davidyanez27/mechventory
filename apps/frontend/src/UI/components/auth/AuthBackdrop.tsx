// Blueprint background shared by the auth screens: two grids, the side SVG
// drawings, a center glow and a vignette. Purely decorative — pointer-events
// are disabled and it sits behind the card. Colours come from the --mv-* CSS
// variables (styles.css) so the whole blueprint flips with the theme toggle.
const MONO = "'JetBrains Mono', ui-monospace, monospace";

export const AuthBackdrop = () => (
  <div className="pointer-events-none absolute inset-0 z-0">
    {/* fine 56px grid */}
    <div
      className="absolute inset-[-2px]"
      style={{
        background:
          'linear-gradient(to right, var(--mv-grid-fine) 1px, transparent 1px) 0 0 / 56px 56px,' +
          'linear-gradient(to bottom, var(--mv-grid-fine) 1px, transparent 1px) 0 0 / 56px 56px',
      }}
    />
    {/* coarse 280px grid */}
    <div
      className="absolute inset-[-2px]"
      style={{
        background:
          'linear-gradient(to right, var(--mv-grid-coarse) 1px, transparent 1px) 0 0 / 280px 280px,' +
          'linear-gradient(to bottom, var(--mv-grid-coarse) 1px, transparent 1px) 0 0 / 280px 280px',
      }}
    />
    {/* side technical drawings */}
    <div className="absolute inset-0">
      <svg
        className="absolute top-1/2 left-[-160px] w-[520px] -translate-y-1/2"
        viewBox="0 0 520 520"
        fill="none"
      >
        <circle cx="260" cy="260" r="200" stroke="var(--mv-draw-strong)" strokeWidth="1.3" />
        <circle cx="260" cy="260" r="120" stroke="var(--mv-draw-soft)" strokeWidth="1.3" />
        <circle cx="260" cy="260" r="6" stroke="var(--mv-draw-text)" strokeWidth="1.3" />
        <path
          d="M260 30v460M30 260h460"
          stroke="var(--mv-draw-soft)"
          strokeWidth="1"
          strokeDasharray="8 7"
        />
        <circle cx="260" cy="100" r="14" stroke="var(--mv-draw-strong)" strokeWidth="1.2" />
        <circle cx="420" cy="260" r="14" stroke="var(--mv-draw-strong)" strokeWidth="1.2" />
        <circle cx="260" cy="420" r="14" stroke="var(--mv-draw-strong)" strokeWidth="1.2" />
        <circle cx="100" cy="260" r="14" stroke="var(--mv-draw-strong)" strokeWidth="1.2" />
        <path d="M260 260L460 260" stroke="var(--mv-draw-line)" strokeWidth="1" />
        <text x="345" y="250" fontFamily={MONO} fontSize="13" fill="var(--mv-draw-text)">
          R200
        </text>
      </svg>
      <svg
        className="absolute right-[-120px] bottom-[-80px] w-[460px]"
        viewBox="0 0 460 360"
        fill="none"
      >
        <rect
          x="60"
          y="60"
          width="300"
          height="220"
          rx="14"
          stroke="var(--mv-draw-strong)"
          strokeWidth="1.3"
        />
        <circle cx="210" cy="170" r="58" stroke="var(--mv-draw-soft)" strokeWidth="1.3" />
        <path d="M60 36h300" stroke="var(--mv-draw-strong)" strokeWidth="1" />
        <path d="M60 30v12M360 30v12" stroke="var(--mv-draw-strong)" strokeWidth="1" />
        <text x="190" y="32" fontFamily={MONO} fontSize="12" fill="var(--mv-draw-text)">
          240.0
        </text>
        <text x="60" y="312" fontFamily={MONO} fontSize="11" fill="var(--mv-draw-line)">
          MEC-0420 · ±0.05
        </text>
      </svg>
    </div>
    {/* center glow */}
    <div
      className="absolute top-1/2 left-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2"
      style={{
        background: 'radial-gradient(circle, var(--mv-glow) 0%, transparent 60%)',
      }}
    />
    {/* vignette */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(80% 70% at 50% 50%, transparent 0%, var(--mv-vignette-mid) 55%, var(--mv-vignette-edge) 100%)',
      }}
    />
  </div>
);
