// Shared Tailwind class strings for the auth screens (Login, Register,
// ConfirmCodeCard) so they never drift apart.
// Tokens (mv-bg, mv-surface, mv-line-2, font-mv-ui, rounded-mv, …) live in
// styles.css @theme.

// Full-screen root. `mv-screen` also drives the reduced-motion rule in styles.css.
export const mvScreen =
  'mv-screen relative flex min-h-screen items-center justify-center overflow-hidden ' +
  'bg-mv-bg px-5 py-8 font-mv-ui text-mv-fg antialiased';

// Card shell (width + padding are set per screen). Entrance animation respects
// reduced-motion via the index.css media query. Light gets a soft ambient
// shadow; dark keeps the original inset highlight + deep drop shadow.
export const mvCard =
  'relative z-1 rounded-mv-card border border-mv-line-2 bg-mv-surface ' +
  'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-20px_rgba(0,0,0,0.18)] ' +
  'dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-20px_rgba(0,0,0,0.8)] ' +
  'animate-[mv-rise_0.5s_cubic-bezier(0.2,0.7,0.2,1)_both]';

export const mvLabel = 'mb-2 block text-[13px] font-[450] text-mv-fg';

// Focus uses the mv-fg token so the ring is dark on light screens and light on
// dark screens (was a fixed white ring, invisible in light mode).
export const mvInput =
  'h-10 w-full rounded-mv border border-mv-line-2 bg-mv-surface-2 px-3 text-sm text-mv-fg ' +
  'placeholder:text-mv-muted-2 outline-none transition-colors hover:border-mv-muted-2 ' +
  'focus:border-mv-fg focus:bg-mv-surface focus:shadow-[0_0_0_1px_var(--color-mv-fg)]';

export const mvHint = 'mx-px mt-[7px] text-[11.5px] text-mv-muted-2';

// Inline validation / auth errors — a red tuned per theme so it stays legible on
// both the white (light) and near-black (dark) card surfaces.
export const mvError = 'mt-[7px] text-[12.5px] text-[#e5484d] dark:text-[#ff6166]';

// Buttons: shared base + variants. Visible keyboard focus via focus-visible ring.
const mvBtnBase =
  'inline-flex h-10 items-center justify-center gap-[9px] rounded-mv text-sm font-medium ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mv-fg/60 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-mv-bg';

// Primary = the foreground colour as a solid fill (black-on-light, white-on-dark)
// with the page colour as its text, so it inverts cleanly with the theme.
export const mvBtnPrimary =
  `${mvBtnBase} border border-mv-fg bg-mv-fg text-mv-bg hover:opacity-90 ` +
  'disabled:cursor-not-allowed disabled:border-mv-line-2 disabled:bg-mv-line-2 disabled:text-mv-muted-2';

export const mvBtnGhost =
  `${mvBtnBase} border border-mv-line-2 bg-transparent text-mv-fg hover:border-mv-muted-2 hover:bg-mv-surface-2`;
