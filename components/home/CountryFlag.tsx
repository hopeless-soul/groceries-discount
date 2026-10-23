import { cn } from "cn"

// Inline flags: flag emoji render as letter pairs on Windows, so the flags are drawn here.
// The Slovak shield is simplified (plain red shield, no coat of arms).
const FLAGS = {
  SK: (
    <>
      <rect width="3" height="0.667" fill="#fff" />
      <rect y="0.667" width="3" height="0.667" fill="#0b4ea2" />
      <rect y="1.333" width="3" height="0.667" fill="#ee1c25" />
      <path d="M0.42 0.36H1.08V1.06Q1.08 1.5 0.75 1.7Q0.42 1.5 0.42 1.06Z" fill="#ee1c25" stroke="#fff" strokeWidth="0.08" />
    </>
  ),
  CZ: (
    <>
      <rect width="3" height="1" fill="#fff" />
      <rect y="1" width="3" height="1" fill="#d7141a" />
      <path d="M0 0L1.5 1L0 2Z" fill="#11457e" />
    </>
  ),
} as const

function CountryFlag({ code, className }: { code: keyof typeof FLAGS; className?: string }) {
  return (
    <svg
      viewBox="0 0 3 2"
      aria-hidden="true"
      className={cn("inline-block h-3.5 w-5 rounded-[2px] align-[-2px] ring-1 ring-black/10", className)}
    >
      {FLAGS[code]}
    </svg>
  )
}

export { CountryFlag }
