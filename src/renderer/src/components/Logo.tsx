interface Props {
  size?: number
  className?: string
}

export default function Logo({ size = 24, className }: Props) {
  const s = size / 24
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top bar — shortest, starts left */}
      <rect x="2" y="3" width="12" height="4.5" rx="2.25" fill="#f0a500" />
      {/* Middle bar — longest, offset right */}
      <rect x="6" y="9.75" width="16" height="4.5" rx="2.25" fill="#f0a500" />
      {/* Bottom bar — medium, more offset */}
      <rect x="10" y="16.5" width="12" height="4.5" rx="2.25" fill="#f0a500" opacity="0.6" />
    </svg>
  )
}
