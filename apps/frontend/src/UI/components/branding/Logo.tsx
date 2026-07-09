// Single source of truth for the app's name and mark, so the brand only ever
// has to change in one place.
export const BRAND_NAME = 'Mechventory';

type LogoProps = {
  /** Render the wordmark next to the mark. Defaults to true. */
  showName?: boolean;
  /** Size of the hex-nut mark in pixels. */
  size?: number;
  className?: string;
};

export const Logo = ({ showName = true, size = 22, className = '' }: LogoProps) => (
  <span
    className={`inline-flex items-center gap-2.5 text-base font-medium tracking-[-0.01em] ${className}`}
  >
    {/* hex-nut mark — uses currentColor so it adapts to its context */}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.2l8.5 4.9v9.8L12 21.8 3.5 16.9V7.1L12 2.2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
    {showName && <span>{BRAND_NAME}</span>}
  </span>
);
