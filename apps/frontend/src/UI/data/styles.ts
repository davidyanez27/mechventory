// Shared Tailwind class strings for the auth screens (Login, Register,
// ConfirmCodeCard) so they never drift apart.
// Tokens (mv-bg, mv-surface, mv-line-2, font-mv-ui, rounded-mv, …) live in
// styles.css @theme.

// Full-screen root. `mv-screen` also drives the reduced-motion rule in styles.css.
export const mvScreen =
  'mv-screen relative flex min-h-screen items-center justify-center overflow-hidden ' +
  'bg-mv-bg px-5 py-8 font-mv-ui text-mv-fg antialiased';

// Card shell (width + padding are set per screen). Entrance animation respects
// reduced-motion via the index.css media query.
export const mvCard =
  'relative z-1 rounded-mv-card border border-mv-line-2 bg-mv-surface ' +
  'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-20px_rgba(0,0,0,0.8)] ' +
  'animate-[mv-rise_0.5s_cubic-bezier(0.2,0.7,0.2,1)_both]';

export const mvLabel = 'mb-2 block text-[13px] font-[450] text-mv-fg';

export const mvInput =
  'h-10 w-full rounded-mv border border-mv-line-2 bg-mv-surface-2 px-3 text-sm text-mv-fg ' +
  'placeholder:text-mv-muted-2 outline-none transition-colors hover:border-[#3a3a3a] ' +
  'focus:border-white focus:bg-[#0f0f0f] focus:shadow-[0_0_0_1px_#ffffff]';

export const mvHint = 'mx-px mt-[7px] text-[11.5px] text-mv-muted-2';

// Inline validation / auth errors — red that stays legible on the black surface.
export const mvError = 'mt-[7px] text-[12.5px] text-[#ff6166]';

// Buttons: shared base + variants. Visible keyboard focus via focus-visible ring.
const mvBtnBase =
  'inline-flex h-10 items-center justify-center gap-[9px] rounded-mv text-sm font-medium ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-mv-bg';

export const mvBtnPrimary =
  `${mvBtnBase} border border-white bg-white text-black hover:bg-[#d6d6d6] hover:border-[#d6d6d6] ` +
  'disabled:cursor-not-allowed disabled:border-[#1f1f1f] disabled:bg-[#1f1f1f] disabled:text-mv-muted-2';

export const mvBtnGhost =
  `${mvBtnBase} border border-mv-line-2 bg-transparent text-mv-fg hover:border-[#3a3a3a] hover:bg-[#0c0c0c]`;
