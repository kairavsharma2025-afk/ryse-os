interface Props {
  className?: string
  strokeWidth?: number
}

/**
 * The Ryse mark — two rising chevrons + a peak dot, matching public/icon.svg.
 * Rendered in currentColor so the parent's text colour (theme accent, in our
 * usage) drives it.
 */
export function RyseLogo({ className = '', strokeWidth = 56 }: Props) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      role="img"
      aria-label="Ryse"
    >
      <path d="M132 332 L256 206 L380 332" />
      <path d="M164 412 L256 318 L348 412" />
      <circle cx="256" cy="138" r="26" fill="currentColor" stroke="none" />
    </svg>
  )
}
