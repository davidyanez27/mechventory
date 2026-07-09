// Brand mark for the Google SSO button. Single-color to match the monochrome
// design (the original art used #ededed).
export const GoogleMark = ({ className = '' }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M21 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h5.1c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-6.9zM12 21c2.4 0 4.5-.8 6-2.2l-3.1-2.4c-.8.6-1.9.9-2.9.9-2.3 0-4.2-1.5-4.9-3.6H3.9v2.5C5.4 19.1 8.5 21 12 21zM7.1 13.7c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7V7.8H3.9C3.3 9 3 10.5 3 12s.3 3 .9 4.2l3.2-2.5zM12 6.6c1.3 0 2.5.5 3.4 1.3l2.5-2.5C16.5 3.9 14.4 3 12 3 8.5 3 5.4 4.9 3.9 7.8l3.2 2.5C7.8 8.1 9.7 6.6 12 6.6z"
      fill="#ededed"
    />
  </svg>
);
